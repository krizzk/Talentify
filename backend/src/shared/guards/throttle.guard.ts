import { Injectable, CanActivate, ExecutionContext, HttpException } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class ThrottleGuard implements CanActivate {
  constructor(private redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id ?? request.ip;
    const path = request.path;

    const isAIEndpoint = /\/(generate|tailor|analyze)/.test(path);
    const limit = isAIEndpoint
      ? parseInt(process.env.THROTTLE_AI_LIMIT ?? '10')
      : parseInt(process.env.THROTTLE_LIMIT ?? '100');

    const key = `rl:${isAIEndpoint ? 'ai' : 'general'}:${userId}`;
    const ttl = parseInt(process.env.THROTTLE_TTL ?? '900');

    const count = await this.redisService.incr(key, ttl);

    if (count > limit) {
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Terlalu banyak request.',
          },
        },
        429,
      );
    }

    return true;
  }
}