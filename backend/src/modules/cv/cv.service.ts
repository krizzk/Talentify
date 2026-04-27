import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CV, CVType, CVStatus } from './entities/cv.entity';
import { User, UserPlan } from '../users/entities/user.entity';
import { AIService } from '../../shared/ai/ai.service';
import { ProfileService } from '../profile/profile.service';
import { RedisService } from '../../shared/redis/redis.service';
import { UpdateCVDto } from './dto/update-cv.dto';
import { TailorCVDto } from './dto/tailor-cv.dto';

@Injectable()
export class CVService {
  private readonly logger = new Logger(CVService.name);

  constructor(
    @InjectRepository(CV)
    private readonly cvRepo: Repository<CV>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly aiService: AIService,
    private readonly profileService: ProfileService,
    private readonly redisService: RedisService,
  ) {}

  async findAll(userId: string): Promise<CV[]> {
    const cacheKey = `cvs:${userId}`;
    const cached = await this.redisService.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    const cvs = await this.cvRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: {
        id: true,
        publicSlug: true,
      },
    });
    const serialized = cvs.map((cv) => this.serializeCV(cv, user?.publicSlug ?? null));
    await this.redisService.set(cacheKey, JSON.stringify(serialized), 120);
    return serialized as unknown as CV[];
  }

  async findOne(id: string, userId: string): Promise<CV> {
    const cv = await this.cvRepo.findOne({ where: { id } });
    if (!cv) {
      throw new NotFoundException('CV tidak ditemukan');
    }
    if (cv.userId !== userId) {
      throw new ForbiddenException('Akses ditolak');
    }

    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: {
        id: true,
        publicSlug: true,
      },
    });

    return this.serializeCV(cv, user?.publicSlug ?? null) as unknown as CV;
  }

  async update(id: string, userId: string, dto: UpdateCVDto): Promise<CV> {
    const existing = await this.cvRepo.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException('CV tidak ditemukan');
    }
    if (existing.userId !== userId) {
      throw new ForbiddenException('Akses ditolak');
    }

    Object.assign(existing, {
      title: dto.title ?? existing.title,
      content: dto.content ?? existing.content,
      status: dto.status ?? existing.status,
    });
    const result = await this.cvRepo.save(existing);
    await this.redisService.del(`cvs:${userId}`);
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: {
        id: true,
        publicSlug: true,
      },
    });
    return this.serializeCV(result, user?.publicSlug ?? null) as unknown as CV;
  }

  async remove(id: string, userId: string): Promise<void> {
    const cv = await this.findOne(id, userId);
    await this.cvRepo.delete({ id: cv.id });
    await this.redisService.del(`cvs:${userId}`);
  }

  async generate(userId: string): Promise<CV> {
    // Check free tier daily limit
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    if (user.plan === UserPlan.FREE) {
      const dailyKey = `cv:generate:${userId}:${new Date().toISOString().split('T')[0]}`;
      const count = await this.redisService.incr(dailyKey, 86400);
      
      if (count > 1) {
        throw new BadRequestException(
          'Batas CV generation untuk FREE plan adalah 1 per hari. Upgrade ke PREMIUM untuk unlimited.',
        );
      }
    }

    const profile = await this.profileService.getEntityByUserId(userId);
    const profileForAI = this.buildProfileForAI(user, profile);
    const aiResult = await this.generateCVContent(profileForAI);
    const hydratedContent = this.hydrateGeneratedContent(aiResult, profileForAI);
    const plainText = this.flattenCVContent(hydratedContent);
    const publicSlug = await this.ensurePublicSlug(user);

    await this.cvRepo.update({ userId, isPublic: true }, { isPublic: false });

    const cv = new CV();
    cv.userId = userId;
    cv.title = profile.targetRole ?? user.fullName ?? 'CV Baru';
    cv.content = hydratedContent;
    cv.plainText = plainText;
    cv.type = CVType.GENERATED;
    cv.status = CVStatus.FINALIZED;
    cv.isPublic = true;

    const saved = await this.cvRepo.save(cv);
    await this.redisService.del(`cvs:${userId}`);
    return this.serializeCV(saved, publicSlug) as unknown as CV;
  }

  async tailor(id: string, userId: string, dto: TailorCVDto): Promise<CV> {
    const parent = await this.findOne(id, userId);
    const tailored = await this.aiService.tailorCV(
      parent.content,
      dto.job_description,
    );
    const plainText = this.flattenCVContent(tailored);

    const cv = new CV();
    cv.userId = userId;
    cv.title = `${parent.title} (Tailored)`;
    cv.content = tailored;
    cv.plainText = plainText;
    cv.type = CVType.TAILORED;
    cv.parentCvId = parent.id;
    cv.status = CVStatus.DRAFT;

    const saved = await this.cvRepo.save(cv);
    await this.redisService.del(`cvs:${userId}`);
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: {
        id: true,
        publicSlug: true,
      },
    });
    return this.serializeCV(saved, user?.publicSlug ?? null) as unknown as CV;
  }

  async findPublicBySlug(slug: string) {
    const normalizedSlug = slug.trim().toLowerCase();
    const user = await this.userRepo.findOne({
      where: { publicSlug: normalizedSlug },
      select: {
        id: true,
        email: true,
        fullName: true,
        publicSlug: true,
      },
    });

    if (!user?.publicSlug) {
      throw new NotFoundException('Landing page CV tidak ditemukan');
    }

    const [cv, profile] = await Promise.all([
      this.cvRepo.findOne({
        where: { userId: user.id, isPublic: true },
        order: { updatedAt: 'DESC' },
      }),
      this.profileService.getEntityByUserId(user.id),
    ]);

    if (!cv) {
      throw new NotFoundException('Landing page CV belum dipublikasikan');
    }

    return {
      slug: user.publicSlug,
      public_url: `/${user.publicSlug}`,
      user: {
        id: user.id,
        full_name: user.fullName,
        email: user.email,
      },
      profile: {
        target_role: profile.targetRole ?? '',
        phone: profile.phone ?? '',
        location: profile.location ?? '',
        linkedin_url: profile.linkedinUrl ?? '',
        portfolio_url: profile.portfolioUrl ?? '',
        professional_summary: profile.summary ?? '',
      },
      cv: this.serializeCV(cv, user.publicSlug),
    };
  }

  private flattenCVContent(content: any): string {
    const parts: string[] = [];
    if (content.header?.full_name) parts.push(content.header.full_name);
    if (content.header?.email) parts.push(content.header.email);
    if (content.professional_summary) parts.push(content.professional_summary);
    if (Array.isArray(content.experiences)) {
      for (const exp of content.experiences) {
        parts.push(exp.company, exp.position, exp.start_date, exp.end_date || 'Sekarang');
        if (exp.description) parts.push(exp.description);
      }
    }
    if (Array.isArray(content.education)) {
      for (const edu of content.education) {
        parts.push(edu.institution, edu.degree, edu.field_of_study, edu.start_date, edu.end_date);
      }
    }
    if (Array.isArray(content.skills)) {
      for (const skill of content.skills) {
        if (skill.name) parts.push(skill.name);
      }
    }
    return parts.filter(Boolean).join('\n');
  }

  private async generateCVContent(profileForAI: any) {
    try {
      return await this.aiService.generateCV(profileForAI);
    } catch (error) {
      this.logger.warn(
        `AI generation unavailable, using deterministic fallback: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return this.buildFallbackCV(profileForAI);
    }
  }

  private serializeCV(cv: CV, publicSlug: string | null) {
    const isPublic = Boolean(cv.isPublic && publicSlug);

    return {
      id: cv.id,
      user_id: cv.userId,
      title: cv.title,
      content: cv.content,
      plain_text: cv.plainText ?? '',
      type: cv.type,
      parent_cv_id: cv.parentCvId ?? null,
      status: cv.status,
      is_public: cv.isPublic ?? false,
      public_slug: isPublic ? publicSlug : null,
      public_url: isPublic ? `/${publicSlug}` : null,
      created_at: cv.createdAt?.toISOString?.() ?? new Date().toISOString(),
      updated_at: cv.updatedAt?.toISOString?.() ?? new Date().toISOString(),
    };
  }

  private buildProfileForAI(user: User, profile: any) {
    return {
      full_name: user.fullName,
      email: user.email,
      target_role: profile.targetRole ?? '',
      phone: profile.phone ?? '',
      location: profile.location ?? '',
      linkedin_url: profile.linkedinUrl ?? '',
      portfolio_url: profile.portfolioUrl ?? '',
      professional_summary: profile.summary ?? '',
      experiences: (profile.experiences ?? []).map((exp: any) => ({
        company: exp.company ?? '',
        position: exp.position ?? '',
        start_date: exp.start_date ?? '',
        end_date: exp.end_date ?? null,
        is_current: exp.is_current ?? false,
        description: exp.description ?? '',
      })),
      education: (profile.educations ?? []).map((edu: any) => ({
        institution: edu.institution ?? '',
        degree: edu.degree ?? '',
        field_of_study: edu.major ?? '',
        start_date: edu.start_year ? `${edu.start_year}-01-01` : '',
        end_date: edu.end_year ? `${edu.end_year}-01-01` : '',
        gpa: edu.gpa !== null && edu.gpa !== undefined ? String(edu.gpa) : '',
      })),
      skills: (profile.skills ?? []).map((skill: any) => ({
        name: skill.name ?? '',
        category: skill.category ?? '',
        level: skill.level ?? '',
      })),
    };
  }

  private hydrateGeneratedContent(content: any, source: any) {
    return {
      ...content,
      header: {
        full_name:
          content?.header?.full_name?.trim?.() || source.full_name || 'Anonymous Talent',
        email: content?.header?.email?.trim?.() || source.email || '',
        phone: content?.header?.phone?.trim?.() || source.phone || '',
        location: content?.header?.location?.trim?.() || source.location || '',
        linkedin_url:
          content?.header?.linkedin_url?.trim?.() || source.linkedin_url || '',
      },
      professional_summary:
        content?.professional_summary?.trim?.() ||
        source.professional_summary ||
        '',
      experiences: Array.isArray(content?.experiences)
        ? content.experiences
        : source.experiences,
      education: Array.isArray(content?.education)
        ? content.education
        : source.education,
      skills: Array.isArray(content?.skills) ? content.skills : source.skills,
    };
  }

  private buildFallbackCV(source: any) {
    const skills = Array.isArray(source.skills) ? source.skills : [];
    const experiences = Array.isArray(source.experiences) ? source.experiences : [];
    const education = Array.isArray(source.education) ? source.education : [];
    const topSkills = skills.slice(0, 6).map((skill: any) => ({ name: skill.name }));
    const skillText = topSkills.map((skill: any) => skill.name).join(', ');
    const summaryParts = [
      source.target_role
        ? `${source.full_name} adalah profesional ${source.target_role.toLowerCase()}`
        : `${source.full_name} adalah profesional dengan profil yang terus berkembang`,
      source.location ? `berbasis di ${source.location}` : null,
      skillText ? `dengan fokus pada ${skillText}` : null,
    ].filter(Boolean);

    return {
      header: {
        full_name: source.full_name,
        email: source.email,
        phone: source.phone,
        location: source.location,
        linkedin_url: source.linkedin_url,
      },
      professional_summary:
        source.professional_summary ||
        `${summaryParts.join(' ')}. CV ini disusun otomatis dari data profil untuk menghasilkan halaman personal yang rapi dan siap dibagikan.`,
      experiences: experiences.map((experience: any) => ({
        company: experience.company,
        position: experience.position,
        start_date: experience.start_date,
        end_date: experience.end_date,
        description:
          experience.description ||
          `Berperan sebagai ${experience.position} dan berkontribusi pada target tim serta pengembangan produk.`,
      })),
      education: education.map((item: any) => ({
        institution: item.institution,
        degree: item.degree,
        field_of_study: item.field_of_study,
        start_date: item.start_date,
        end_date: item.end_date,
        gpa: item.gpa,
      })),
      skills: topSkills,
    };
  }

  private async ensurePublicSlug(user: User): Promise<string> {
    if (user.publicSlug) {
      return user.publicSlug;
    }

    const baseSlug = this.slugify(user.fullName);
    let candidate = baseSlug;
    let suffix = 2;

    while (true) {
      const existing = await this.userRepo.findOne({
        where: { publicSlug: candidate },
        select: {
          id: true,
          publicSlug: true,
        },
      });

      if (!existing || existing.id === user.id) {
        user.publicSlug = candidate;
        await this.userRepo.save(user);
        return candidate;
      }

      candidate = `${baseSlug}-${suffix}`;
      suffix += 1;
    }
  }

  private slugify(value: string): string {
    const slug = value
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return slug || 'talent';
  }
}
