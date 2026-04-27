import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ATSController } from './ats.controller';
import { ATSService } from './ats.service';
import { ATSResult } from './entities/ats-result.entity';
import { CV } from '../cv/entities/cv.entity';
import { AIModule } from '../../shared/ai/ai.module';

@Module({
  imports: [TypeOrmModule.forFeature([ATSResult, CV]), AIModule],
  controllers: [ATSController],
  providers: [ATSService],
})
export class ATSModule {}
