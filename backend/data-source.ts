/// <reference types="node" />
import { DataSource } from 'typeorm';

const isTest = process.env.NODE_ENV === 'test';

const dataSource = new DataSource(
  isTest
    ? {
        type: 'sqlite',
        database: ':memory:',
        entities: [__dirname + '/src/modules/auth/**/*.entity{.ts,.js}'],
        synchronize: true,
        logging: false,
      }
    : {
        type: 'postgres',
        url:
          process.env.DATABASE_URL ||
          'postgresql://postgres:postgres@localhost:5432/cv_app',
        entities: [__dirname + '/src/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/src/migrations/*{.ts,.js}'],
        migrationsTableName: 'migrations',
        synchronize: false,
        logging: process.env.NODE_ENV === 'development',
        logger: 'advanced-console',
        ssl: false,
        extra: {
          max: 20,
          min: 2,
          idleTimeoutMillis: 30000,
        },
      }
);

export default dataSource;