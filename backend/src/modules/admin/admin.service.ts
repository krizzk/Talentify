import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { RedisService } from '../../shared/redis/redis.service';
import { ATSResult } from '../ats/entities/ats-result.entity';
import { CV } from '../cv/entities/cv.entity';
import { User, UserPlan, UserRole } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(CV)
    private readonly cvRepo: Repository<CV>,
    @InjectRepository(ATSResult)
    private readonly atsRepo: Repository<ATSResult>,
    private readonly dataSource: DataSource,
    private readonly redisService: RedisService,
    private readonly usersService: UsersService,
  ) {}

  async getDashboardOverview() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsersThisWeek,
      adminCount,
      premiumCount,
      enterpriseCount,
      totalCvs,
      totalAnalyses,
      recentUsers,
    ] = await Promise.all([
      this.userRepo.count(),
      this.userRepo
        .createQueryBuilder('user')
        .where('user.createdAt >= :sevenDaysAgo', { sevenDaysAgo })
        .getCount(),
      this.userRepo.count({ where: { role: UserRole.ADMIN } }),
      this.userRepo.count({ where: { plan: UserPlan.PREMIUM } }),
      this.userRepo.count({ where: { plan: UserPlan.ENTERPRISE } }),
      this.cvRepo.count(),
      this.atsRepo.count(),
      this.userRepo.find({
        order: { createdAt: 'DESC' },
        take: 5,
      }),
    ]);

    return {
      metrics: {
        total_users: totalUsers,
        new_users_this_week: newUsersThisWeek,
        admin_count: adminCount,
        premium_users: premiumCount,
        enterprise_users: enterpriseCount,
        total_cvs: totalCvs,
        total_ats_analyses: totalAnalyses,
      },
      recent_users: recentUsers.map((user) => this.serializeUser(user)),
    };
  }

  async listUsers(page = 1, limit = 10, search?: string) {
    return this.usersService.findAll({ page, limit, search });
  }

  async updateUser(id: string, dto: UpdateAdminUserDto) {
    const user = await this.usersService.updateUserAsAdmin(id, dto);
    return this.serializeUser(user);
  }

  async getContentModeration() {
    const cvs = await this.cvRepo.find({
      relations: ['user'],
      order: { updatedAt: 'DESC' },
      take: 25,
    });

    const items = cvs
      .map((cv) => {
        const sourceText =
          cv.plainText?.trim() ||
          JSON.stringify(cv.content ?? {}).replace(/\s+/g, ' ').trim();
        const reasons: string[] = [];
        let severity: 'low' | 'medium' | 'high' = 'low';

        if (sourceText.length < 120) {
          reasons.push('Konten CV terlalu pendek untuk dipublikasikan.');
          severity = 'medium';
        }

        if (sourceText.length > 6000) {
          reasons.push('Konten CV terlalu panjang dan perlu ditinjau.');
          severity = 'medium';
        }

        if (/(slot|casino|judi|bet|telegram|whatsapp|wa\.me|bit\.ly|tinyurl|http:\/\/|https:\/\/)/i.test(sourceText)) {
          reasons.push('Konten mengandung tautan atau kata kunci berisiko.');
          severity = 'high';
        }

        if (!cv.title?.trim()) {
          reasons.push('CV tidak memiliki judul yang jelas.');
        }

        if (reasons.length === 0) {
          return null;
        }

        return {
          id: cv.id,
          title: cv.title || 'Tanpa judul',
          status: cv.status,
          type: cv.type,
          severity,
          reasons,
          updated_at: cv.updatedAt.toISOString(),
          user: cv.user
            ? {
                id: cv.user.id,
                email: cv.user.email,
                full_name: cv.user.fullName,
                plan: cv.user.plan,
                role: cv.user.role,
              }
            : null,
          preview: sourceText.slice(0, 180),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return {
      summary: {
        total_reviewed: cvs.length,
        flagged: items.length,
        high_risk: items.filter((item) => item.severity === 'high').length,
        medium_risk: items.filter((item) => item.severity === 'medium').length,
      },
      items,
    };
  }

  async getSystemHealth() {
    let databaseStatus: 'healthy' | 'unhealthy' = 'healthy';
    let redisStatus: 'healthy' | 'unhealthy' = 'healthy';

    try {
      await this.dataSource.query('SELECT 1');
    } catch (error) {
      this.logger.warn(`Database health check failed: ${String(error)}`);
      databaseStatus = 'unhealthy';
    }

    try {
      await this.redisService.ping();
    } catch (error) {
      this.logger.warn(`Redis health check failed: ${String(error)}`);
      redisStatus = 'unhealthy';
    }

    const memoryUsage = process.memoryUsage();

    return {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV ?? 'development',
      uptime_seconds: Math.round(process.uptime()),
      services: {
        api: 'healthy',
        database: databaseStatus,
        redis: redisStatus,
      },
      runtime: {
        rss_mb: this.toMb(memoryUsage.rss),
        heap_used_mb: this.toMb(memoryUsage.heapUsed),
        heap_total_mb: this.toMb(memoryUsage.heapTotal),
        external_mb: this.toMb(memoryUsage.external),
      },
    };
  }

  private serializeUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      full_name: user.fullName,
      plan: user.plan,
      role: user.role,
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString(),
    };
  }

  private toMb(bytes: number) {
    return Math.round((bytes / 1024 / 1024) * 100) / 100;
  }
}
