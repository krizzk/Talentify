import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class ExperienceDto {
  @IsString()
  company: string;

  @IsString()
  position: string;

  @IsString()
  start_date: string;

  @IsOptional()
  @IsString()
  end_date?: string;

  @IsOptional()
  @IsBoolean()
  is_current?: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}
