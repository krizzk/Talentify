import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class AdminBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(AdminBootstrapService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async onModuleInit() {
    const adminEmails = (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);

    if (adminEmails.length === 0) {
      return;
    }

    const result = await this.userRepo
      .createQueryBuilder()
      .update(User)
      .set({ role: UserRole.ADMIN })
      .where('LOWER(email) IN (:...adminEmails)', { adminEmails })
      .execute();

    if (result.affected && result.affected > 0) {
      this.logger.log(`Promoted ${result.affected} admin account(s) from ADMIN_EMAILS.`);
    }
  }
}
