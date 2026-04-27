import { IsString } from 'class-validator';

export class TailorCVDto {
  @IsString()
  job_description: string;
}
+``