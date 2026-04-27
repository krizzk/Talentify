import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ATSResult } from './entities/ats-result.entity';
import { CV } from '../cv/entities/cv.entity';
import { AnalyzeATSDto } from './dto/analyze-ats.dto';
import { AIService } from '../../shared/ai/ai.service';

@Injectable()
export class ATSService {
  constructor(
    @InjectRepository(ATSResult)
    private readonly atsRepo: Repository<ATSResult>,
    @InjectRepository(CV)
    private readonly cvRepo: Repository<CV>,
    private readonly aiService: AIService,
  ) {}

  private toResponse(result: ATSResult) {
    if (!result) return null;
    return {
      id: result.id,
      cv_id: result.cvId,
      job_description: result.jobDescription,
      ats_score: result.score,
      matched_keywords: result.matchedKeywords ?? [],
      missing_keywords: result.missingKeywords ?? [],
      suggestions: result.suggestions ?? [],
      analyzed_at: result.createdAt?.toISOString(),
    };
  }

  async analyze(userId: string, dto: AnalyzeATSDto) {
    const cv = await this.cvRepo.findOne({ where: { id: dto.cv_id } });
    if (!cv) {
      throw new NotFoundException('CV tidak ditemukan');
    }
    if (cv.userId !== userId) {
      throw new ForbiddenException('Akses ditolak');
    }

    const existing = await this.atsRepo.findOne({
      where: { cvId: cv.id, jobDescription: dto.job_description },
    });
    if (existing) {
      return this.toResponse(existing);
    }

    const aiResult = await this.aiService.analyzeATS(
      cv.plainText ?? '',
      dto.job_description,
    );

    const result = this.atsRepo.create({
      cvId: cv.id,
      jobDescription: dto.job_description,
      score: Number(aiResult.score ?? 0),
      matchedKeywords: aiResult.matched_keywords ?? [],
      missingKeywords: aiResult.missing_keywords ?? [],
      suggestions: aiResult.suggestions ?? [],
    });

    const saved = await this.atsRepo.save(result);
    return this.toResponse(saved);
  }

  async history(userId: string, cvId: string) {
    const cv = await this.cvRepo.findOne({ where: { id: cvId, userId } });
    if (!cv) {
      throw new NotFoundException('CV tidak ditemukan');
    }
    const results = await this.atsRepo.find({ where: { cvId }, order: { createdAt: 'DESC' } });
    return results.map(r => this.toResponse(r));
  }

  async findOne(id: string, userId: string) {
    const result = await this.atsRepo.findOne({
      where: { id },
      relations: ['cv'],
    });
    if (!result) {
      throw new NotFoundException('Hasil ATS tidak ditemukan');
    }
    if (result.cv.userId !== userId) {
      throw new ForbiddenException('Akses ditolak');
    }
    return this.toResponse(result);
  }
}