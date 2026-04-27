import { Controller, Post, Body, UseGuards, Get, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { ATSService } from './ats.service';
import { AnalyzeATSDto } from './dto/analyze-ats.dto';

@Controller('ats')
@UseGuards(JwtAuthGuard)
export class ATSController {
  constructor(private readonly atsService: ATSService) {}

  @Post('analyze')
  analyze(@CurrentUser('id') userId: string, @Body() dto: AnalyzeATSDto) {
    return this.atsService.analyze(userId, dto);
  }

  @Get('cv/:cvId/history')
  history(@Param('cvId') cvId: string, @CurrentUser('id') userId: string) {
    return this.atsService.history(userId, cvId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.atsService.findOne(id, userId);
  }
}
