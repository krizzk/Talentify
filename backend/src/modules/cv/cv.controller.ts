import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { CVService } from './cv.service';
import { UpdateCVDto } from './dto/update-cv.dto';
import { TailorCVDto } from './dto/tailor-cv.dto';

@Controller('cv')
export class CVController {
  constructor(private readonly cvService: CVService) {}

  @Get('public/:slug')
  findPublic(@Param('slug') slug: string) {
    return this.cvService.findPublicBySlug(slug);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@CurrentUser('id') userId: string) {
    return this.cvService.findAll(userId);
  }

  @Post('generate')
  @UseGuards(JwtAuthGuard)
  generate(@CurrentUser('id') userId: string) {
    return this.cvService.generate(userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.cvService.findOne(id, userId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateCVDto,
  ) {
    return this.cvService.update(id, userId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.cvService.remove(id, userId);
  }

  @Post(':id/tailor')
  @UseGuards(JwtAuthGuard)
  tailor(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: TailorCVDto,
  ) {
    return this.cvService.tailor(id, userId, dto);
  }
}
