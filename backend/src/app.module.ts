import './polyfills';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { appConfig } from './config/app.config';
import { databaseConfig } from './config/database.config';
import { validate } from './config/env.validation';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RedisModule } from './shared/redis/redis.module';
import { ThrottleGuard } from './shared/guards/throttle.guard';
import { ProfileModule } from './modules/profile/profile.module';
import { CVModule } from './modules/cv/cv.module';
import { ATSModule } from './modules/ats/ats.module';
import { ExportModule } from './modules/export/export.module';
import { AIModule } from './shared/ai/ai.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      load: [appConfig],
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => databaseConfig,
    }),
    RedisModule,
    AuthModule,
    UsersModule,
    ProfileModule,
    CVModule,
    ATSModule,
    ExportModule,
    AIModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottleGuard,
    },
  ],
})
export class AppModule {}
