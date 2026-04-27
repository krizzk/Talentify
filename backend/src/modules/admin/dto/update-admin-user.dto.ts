import { IsEnum, IsOptional } from 'class-validator';
import { UserPlan, UserRole } from '../../users/entities/user.entity';

export class UpdateAdminUserDto {
  @IsOptional()
  @IsEnum(UserPlan)
  plan?: UserPlan;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
