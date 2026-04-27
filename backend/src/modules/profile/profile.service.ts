import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Profile } from './entities/profile.entity';
import { Education } from './entities/education.entity';
import { Experience } from './entities/experience.entity';
import { Skill } from './entities/skill.entity';
import { UpsertProfileDto } from './dto/upsert-profile.dto';

@Injectable()
export class ProfileService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Profile)
    private readonly profileRepo: Repository<Profile>,
    @InjectRepository(Education)
    private readonly educationRepo: Repository<Education>,
    @InjectRepository(Experience)
    private readonly experienceRepo: Repository<Experience>,
    @InjectRepository(Skill)
    private readonly skillRepo: Repository<Skill>,
  ) {}

  async getEntityByUserId(userId: string): Promise<Profile> {
    const profile = await this.profileRepo.findOne({
      where: { userId },
      relations: ['user', 'educations', 'experiences', 'skills'],
    });

    if (!profile) {
      throw new NotFoundException('Profil belum diisi');
    }

    return profile;
  }

  async getByUserId(userId: string): Promise<Profile> {
    const profile = await this.getEntityByUserId(userId);
    return this.serializeProfile(profile) as unknown as Profile;
  }

  async upsert(userId: string, dto: UpsertProfileDto): Promise<Profile> {
    return this.dataSource.transaction(async (manager) => {
      let profile = await manager.findOne(Profile, { where: { userId } });
      if (!profile) {
        profile = manager.create(Profile, { userId });
      }

      profile.targetRole = dto.target_role ?? profile.targetRole;
      profile.phone = dto.phone ?? profile.phone;
      profile.location = dto.location ?? profile.location;
      profile.linkedinUrl = dto.linkedin_url ?? profile.linkedinUrl;
      profile.portfolioUrl = dto.portfolio_url ?? profile.portfolioUrl;
      profile.summary = dto.professional_summary ?? profile.summary;

      const savedProfile = await manager.save(Profile, profile);

      await manager.delete(Education, { profileId: savedProfile.id });
      await manager.delete(Experience, { profileId: savedProfile.id });
      await manager.delete(Skill, { profileId: savedProfile.id });

      if (dto.education?.length) {
        const educations = dto.education.map((item) =>
          manager.create(Education, {
            profileId: savedProfile.id,
            institution: item.institution,
            degree: item.degree,
            major: item.field_of_study,
            gpa: this.toNullableNumber(item.gpa),
            start_year: this.extractYear(item.start_date),
            end_year: this.extractYear(item.end_date),
          }),
        );
        await manager.save(Education, educations);
      }

      if (dto.experiences?.length) {
        const experiences = dto.experiences.map((item) =>
          manager.create(Experience, {
            ...item,
            profileId: savedProfile.id,
            end_date: item.end_date ? item.end_date : null,
          }),
        );
        await manager.save(Experience, experiences);
      }

      if (dto.skills?.length) {
        const skills = dto.skills.map((item) =>
          manager.create(Skill, { ...item, profileId: savedProfile.id }),
        );
        await manager.save(Skill, skills);
      }

      const updatedProfile = await manager.findOne(Profile, {
        where: { id: savedProfile.id },
        relations: ['user', 'educations', 'experiences', 'skills'],
      });
      if (!updatedProfile) {
        throw new Error('Failed to retrieve profile after save');
      }
      return this.serializeProfile(updatedProfile) as unknown as Profile;
    });
  }

  private extractYear(value?: string | null): number | null {
    if (!value) {
      return null;
    }

    const year = Number.parseInt(value.slice(0, 4), 10);
    return Number.isNaN(year) ? null : year;
  }

  private toNullableNumber(value?: number | string | null): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const parsed = typeof value === 'number' ? value : Number.parseFloat(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  private serializeProfile(profile: Profile) {
    return {
      id: profile.id,
      user_id: profile.userId,
      full_name: profile.user?.fullName ?? '',
      target_role: profile.targetRole ?? '',
      phone: profile.phone ?? '',
      location: profile.location ?? '',
      linkedin_url: profile.linkedinUrl ?? '',
      portfolio_url: profile.portfolioUrl ?? '',
      professional_summary: profile.summary ?? '',
      education: (profile.educations ?? []).map((edu) => ({
        id: edu.id,
        institution: edu.institution ?? '',
        degree: edu.degree ?? '',
        field_of_study: edu.major ?? '',
        start_date: edu.start_year ? `${edu.start_year}-01-01` : '',
        end_date: edu.end_year ? `${edu.end_year}-01-01` : '',
        gpa: edu.gpa !== null && edu.gpa !== undefined ? String(edu.gpa) : '',
      })),
      experiences: (profile.experiences ?? []).map((exp) => ({
        id: exp.id,
        company: exp.company ?? '',
        position: exp.position ?? '',
        start_date: exp.start_date ?? '',
        end_date: exp.end_date ?? null,
        is_current: exp.is_current ?? false,
        description: exp.description ?? '',
      })),
      skills: (profile.skills ?? []).map((skill) => ({
        id: skill.id,
        name: skill.name ?? '',
        category: skill.category ?? 'hard_skill',
        level: skill.level ?? 'intermediate',
      })),
      created_at: profile.createdAt?.toISOString?.() ?? new Date().toISOString(),
      updated_at: profile.updatedAt?.toISOString?.() ?? new Date().toISOString(),
    };
  }
}
