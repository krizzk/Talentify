import { plainToClass } from 'class-transformer';
import { IsEnum, IsNumber, IsString, validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  APP_PORT: number = 4000;

  @IsString()
  DATABASE_URL: string;

  @IsString()
  REDIS_URL: string;

  @IsString()
  JWT_SECRET: string;

  @IsString()
  JWT_EXPIRATION: string = '15m';

  @IsString()
  JWT_REFRESH_EXPIRATION: string = '7d';

  @IsString()
  FRONTEND_URL: string;

  @IsString()
  ANTHROPIC_API_KEY: string;

  @IsString()
  ANTHROPIC_MODEL: string = 'claude-3-5-sonnet-20241022';

  @IsNumber()
  THROTTLE_LIMIT: number = 100;

  @IsNumber()
  THROTTLE_AI_LIMIT: number = 10;

  @IsNumber()
  THROTTLE_TTL: number = 900;

  @IsString()
  ADMIN_EMAILS: string = '';
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(
      `Environment validation failed: ${errors.map((e) => e.toString()).join(', ')}`,
    );
  }

  return validatedConfig;
}
