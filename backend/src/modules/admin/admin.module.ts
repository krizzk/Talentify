import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { RedisModule } from '../../shared/redis/redis.module';
import { ATSResult } from '../ats/entities/ats-result.entity';
import { CV } from '../cv/entities/cv.entity';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { AdminBootstrapService } from './admin-bootstrap.service';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, CV, ATSResult]), UsersModule, RedisModule],
  controllers: [AdminController],
  providers: [AdminService, AdminBootstrapService, RolesGuard],
})
export class AdminModule {}
