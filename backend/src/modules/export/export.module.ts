import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { CV } from '../cv/entities/cv.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CV])],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {}
