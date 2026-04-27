import { IsString, IsOptional, IsObject } from 'class-validator';

export class UpdateCVDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsObject()
  content?: any;

  @IsOptional()
  @IsString()
  status?: string;
}
