import { TypeOrmModuleOptions } from '@nestjs/typeorm';

const isTest = process.env.NODE_ENV === 'test';

export const databaseConfig: TypeOrmModuleOptions = isTest
  ? {
      type: 'sqlite',
      database: ':memory:',
      entities: [__dirname + '/../modules/auth/**/*.entity{.ts,.js}'],
      synchronize: true,
      logging: false,
    }
  : {
      type: 'postgres',
      url:
        process.env.DATABASE_URL ||
        'postgres://postgres:postgres@localhost:5432/cv_app',
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/../migrations/*{.ts,.js}'],
      migrationsTableName: 'migrations',
      synchronize: false, // NEVER use synchronize: true in production
      logging: process.env.NODE_ENV === 'development',
      logger: 'advanced-console',
      extra: {
        max: 20,
        min: 2,
        idleTimeoutMillis: 30000,
      },
    };
