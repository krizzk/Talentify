import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UserPlan } from './entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async me(@CurrentUser('id') userId: string) {
    const user = await this.usersService.findById(userId);
    return {
      id: user.id,
      email: user.email,
      full_name: user.fullName,
      public_slug: user.publicSlug,
      plan: user.plan,
      role: user.role,
      created_at: user.createdAt.toISOString(),
    };
  }

  @Post('upgrade')
  async upgrade(@CurrentUser('id') userId: string, @Body() body: { plan: string }) {
    const validPlans = [UserPlan.FREE, UserPlan.PREMIUM, UserPlan.ENTERPRISE];
    const newPlan = body.plan as UserPlan;

    if (!validPlans.includes(newPlan)) {
      throw new BadRequestException('Plan tidak valid');
    }

    const user = await this.usersService.updatePlan(userId, newPlan);

    return { plan: user.plan };
  }
}
