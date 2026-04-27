import { IsString, IsUUID } from 'class-validator';

export class AnalyzeATSDto {
  @IsUUID()
  cv_id: string;

  @IsString()
  job_description: string;
}
