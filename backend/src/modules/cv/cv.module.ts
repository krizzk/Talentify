import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CVController } from './cv.controller';
import { CVService } from './cv.service';
import { CV } from './entities/cv.entity';
import { AIModule } from '../../shared/ai/ai.module';
import { ProfileModule } from '../profile/profile.module';
import { RedisModule } from '../../shared/redis/redis.module';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CV, User]), AIModule, ProfileModule, RedisModule],
  controllers: [CVController],
  providers: [CVService],
})
export class CVModule {}
