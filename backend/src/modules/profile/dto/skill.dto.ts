import { IsString, IsOptional } from 'class-validator';

export class SkillDto {
  @IsString()
  name: string;

  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  level?: string;
}
