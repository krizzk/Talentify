export interface RedisConfig {
  url: string;
}

export const getRedisConfig = (): RedisConfig => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  return {
    url: redisUrl,
  };
};
