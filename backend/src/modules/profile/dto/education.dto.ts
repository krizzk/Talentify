import { IsString, IsOptional } from 'class-validator';

export class EducationDto {
  @IsString()
  institution: string;

  @IsOptional()
  @IsString()
  degree?: string;

  @IsOptional()
  @IsString()
  field_of_study?: string;

  @IsOptional()
  gpa?: number | string;

  @IsOptional()
  @IsString()
  start_date?: string;

  @IsOptional()
  @IsString()
  end_date?: string;
}
