import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { ExportService } from './export.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CV } from '../cv/entities/cv.entity';

@Controller('cv')
@UseGuards(JwtAuthGuard)
export class ExportController {
  constructor(
    private readonly exportService: ExportService,
    @InjectRepository(CV)
    private readonly cvRepo: Repository<CV>,
  ) {}

  @Get(':id/export/pdf')
  async exportPDF(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Res() res: Response,
  ) {
    const cv = await this.cvRepo.findOne({ where: { id } });
    if (!cv || cv.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Akses ditolak' },
      });
    }

    const pdf = await this.exportService.generatePDF(cv);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="cv-${cv.id}.pdf"`,
    );
    res.send(pdf);
  }
}
