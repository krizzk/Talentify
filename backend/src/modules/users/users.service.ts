import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserPlan, UserRole } from './entities/user.entity';

interface FindAllUsersOptions {
  page?: number;
  limit?: number;
  search?: string;
}

interface UpdateUserAdminOptions {
  plan?: UserPlan;
  role?: UserRole;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    readonly userRepo: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        fullName: true,
        publicSlug: true,
        plan: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        publicSlug: true,
        plan: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }
    return user;
  }

  async create(user: Partial<User>): Promise<User> {
    const entity = this.userRepo.create(user);
    return this.userRepo.save(entity);
  }

  async updatePlan(id: string, plan: UserPlan): Promise<User> {
    const user = await this.findById(id);
    user.plan = plan;
    return this.userRepo.save(user);
  }

  async findAll(options: FindAllUsersOptions = {}) {
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.min(100, Math.max(1, options.limit ?? 10));
    const search = options.search?.trim().toLowerCase();

    const query = this.userRepo
      .createQueryBuilder('user')
      .loadRelationCountAndMap('user.cvCount', 'user.cvs')
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      query.where('LOWER(user.email) LIKE :search OR LOWER(user.fullName) LIKE :search', {
        search: `%${search}%`,
      });
    }

    const [users, total] = await query.getManyAndCount();

    return {
      items: users.map((user) => ({
        id: user.id,
        email: user.email,
        full_name: user.fullName,
        plan: user.plan,
        role: user.role,
        created_at: user.createdAt.toISOString(),
        updated_at: user.updatedAt.toISOString(),
        cv_count: (user as User & { cvCount?: number }).cvCount ?? 0,
      })),
      meta: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async updateUserAsAdmin(id: string, changes: UpdateUserAdminOptions): Promise<User> {
    const user = await this.findById(id);

    if (changes.plan) {
      user.plan = changes.plan;
    }

    if (changes.role) {
      user.role = changes.role;
    }

    return this.userRepo.save(user);
  }
}
