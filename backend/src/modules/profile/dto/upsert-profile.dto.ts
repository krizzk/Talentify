import { IsString, IsOptional, IsArray } from 'class-validator';
import { EducationDto } from './education.dto';
import { ExperienceDto } from './experience.dto';
import { SkillDto } from './skill.dto';

export class UpsertProfileDto {
  @IsOptional()
  @IsString()
  target_role?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  linkedin_url?: string;

  @IsOptional()
  @IsString()
  portfolio_url?: string;

  @IsOptional()
  @IsString()
  professional_summary?: string;

  @IsOptional()
  @IsArray()
  education?: EducationDto[];

  @IsOptional()
  @IsArray()
  experiences?: ExperienceDto[];

  @IsOptional()
  @IsArray()
  skills?: SkillDto[];
}
