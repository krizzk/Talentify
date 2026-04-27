# ⚙️ SKILL — Backend

## AI Job Getting System — Backend Development Guide

**Stack:** NestJS 10 · TypeScript · TypeORM · PostgreSQL · Redis · Anthropic API  
**Context:** Single Engineer (Phase-based cross-role execution)  
**Phase Context:** Use skills per phase as defined in 15-IMPL-INTEGRATED.md

---

## 1. Skill: Membuat Module Baru

### Struktur standar satu NestJS module

```
modules/nama-fitur/
├── nama-fitur.module.ts
├── nama-fitur.controller.ts
├── nama-fitur.service.ts
├── dto/
│   ├── create-nama-fitur.dto.ts
│   └── update-nama-fitur.dto.ts
└── entities/
    └── nama-fitur.entity.ts
```

### Template Module

```typescript
// modules/cv/cv.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CVController } from './cv.controller';
import { CVService } from './cv.service';
import { CV } from './entities/cv.entity';
import { AIModule } from '../../shared/ai/ai.module';
import { ProfileModule } from '../profile/profile.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CV]),
    AIModule,
    ProfileModule,
  ],
  controllers: [CVController],
  providers: [CVService],
  exports: [CVService], // Ekspor jika dipakai modul lain
})
export class CVModule {}
```

### Template Controller

```typescript
// modules/cv/cv.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { CVService } from './cv.service';
import { CreateCVDto } from './dto/create-cv.dto';

@Controller('cv')
@UseGuards(JwtAuthGuard) // Guard berlaku untuk semua endpoint di controller ini
export class CVController {
  constructor(private readonly cvService: CVService) {}

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.cvService.findAll(userId);
  }

  @Post('generate')
  generate(@CurrentUser('id') userId: string) {
    return this.cvService.generate(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.cvService.findOne(id, userId);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateCVDto,
  ) {
    return this.cvService.update(id, userId, dto);
  }
}
```

---

## 2. Skill: Membuat Entity TypeORM

```typescript
// modules/cv/entities/cv.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  CreateDateColumn, UpdateDateColumn, JoinColumn
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum CVType {
  GENERATED = 'generated',
  TAILORED = 'tailored',
}

export enum CVStatus {
  DRAFT = 'draft',
  FINALIZED = 'finalized',
}

@Entity('cvs')
export class CV {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'jsonb' })
  content: CVContent;

  @Column({ name: 'plain_text', type: 'text', nullable: true })
  plainText: string;

  @Column({ type: 'enum', enum: CVType, default: CVType.GENERATED })
  type: CVType;

  @Column({ name: 'parent_cv_id', nullable: true })
  parentCvId: string;

  @Column({ type: 'enum', enum: CVStatus, default: CVStatus.DRAFT })
  status: CVStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

---

## 3. Skill: Membuat DTO dengan Validasi

```typescript
// modules/ats/dto/analyze-ats.dto.ts
import { IsUUID, IsString, MinLength, MaxLength } from 'class-validator';

export class AnalyzeATSDto {
  @IsUUID()
  cv_id: string;

  @IsString()
  @MinLength(100, { message: 'Job description minimal 100 karakter' })
  @MaxLength(10000, { message: 'Job description maksimal 10.000 karakter' })
  job_description: string;
}
```

```typescript
// Untuk nested objects, gunakan @ValidateNested + @Type
import { ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class UpsertProfileDto {
  @IsString()
  target_role: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationDto)
  educations: EducationDto[];
}
```

---

## 4. Skill: Service dengan Cache Pattern

Pola standar untuk service yang butuh performa: **cache-aside**.

```typescript
// modules/profile/profile.service.ts
@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile) private profileRepo: Repository<Profile>,
    private redisService: RedisService,
  ) {}

  async getByUserId(userId: string): Promise<Profile> {
    const cacheKey = `profile:${userId}`;

    // 1. Cek cache
    const cached = await this.redisService.get(cacheKey);
    if (cached) return JSON.parse(cached);

    // 2. Query DB
    const profile = await this.profileRepo.findOne({
      where: { userId },
      relations: ['educations', 'experiences', 'skills'],
    });

    if (!profile) throw new NotFoundException('Profil belum diisi');

    // 3. Set cache (TTL 5 menit)
    await this.redisService.set(cacheKey, JSON.stringify(profile), 300);

    return profile;
  }

  async upsert(userId: string, dto: UpsertProfileDto): Promise<Profile> {
    // ... logic upsert

    // Invalidate cache setelah update
    await this.redisService.del(`profile:${userId}`);

    return updatedProfile;
  }
}
```

---

## 5. Skill: Integrasi Backend-Frontend

Backend hanya bertanggung jawab pada API contract. Frontend adalah konsumen yang memanggil endpoint di bawah `/api/*`.

- Pastikan backend menggunakan `app.setGlobalPrefix('api')` dan CORS hanya mengizinkan origin frontend.
- Frontend API client berada di `frontend/src/lib/api.ts` dan menggunakan `NEXT_PUBLIC_API_URL || http://localhost:4000/api`.
- Semua endpoint harus mengembalikan wrapper respons standar:
  - `{ success: true, data: ... }`
  - `{ success: false, error: { code, message } }`
- Auth flow backend harus mendukung access token pada header `Authorization: Bearer ...` dan refresh token pada endpoint `/api/auth/refresh`.
- Jangan menaruh logika UI atau rendering di backend; backend fokus pada bisnis, validasi, otorisasi, dan integrasi data.

---

## 6. Skill: Memanggil AI Service

`AIService` adalah shared injectable. Jangan panggil Anthropic API langsung dari module — selalu melalui `AIService`.

```typescript
// shared/ai/ai.service.ts
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class AIService {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async generateCV(profile: ProfileData): Promise<CVContent> {
    const prompt = buildCVGeneratePrompt(profile);

    try {
      const message = await this.callWithTimeout(
        { role: 'user', content: prompt },
        30_000,
      );
      return this.parseCVContent(message);
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new ServiceUnavailableException('AI timeout. Coba lagi.');
      }
      throw err;
    }
  }

  private async callWithTimeout(
    message: { role: string; content: string },
    timeoutMs: number,
  ): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await this.client.messages.create({
        model: process.env.ANTHROPIC_MODEL,
        max_tokens: 2048,
        messages: [message],
      }, { signal: controller.signal });

      return response.content[0].type === 'text' ? response.content[0].text : '';
    } finally {
      clearTimeout(timeout);
    }
  }

  private parseCVContent(raw: string): CVContent {
    // Parse JSON response dari AI
    // Selalu validate struktur sebelum return
    const clean = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(clean) as CVContent;
  }
}
```

### Contoh Prompt Template

```typescript
// shared/ai/prompts/cv-generate.prompt.ts
export function buildCVGeneratePrompt(profile: ProfileData): string {
  return `
Kamu adalah seorang profesional CV writer dengan keahlian membuat CV yang ATS-friendly.

Berdasarkan data profil berikut, buatkan CV profesional dalam format JSON.

DATA PROFIL:
- Nama: ${profile.fullName}
- Target Role: ${profile.targetRole}
- Lokasi: ${profile.location}
- Summary: ${profile.summary ?? 'Tidak ada'}
- Pendidikan: ${JSON.stringify(profile.educations)}
- Pengalaman: ${JSON.stringify(profile.experiences)}
- Skill: ${JSON.stringify(profile.skills)}

INSTRUKSI:
1. Tulis summary yang kuat, 2-3 kalimat, sesuai target role
2. Ubah deskripsi pengalaman menjadi bullet points dengan format action verb + achievement
3. Kuantifikasi pencapaian jika memungkinkan
4. Pastikan semua keyword relevan dengan target role ada di CV
5. Gunakan bahasa profesional dalam Bahasa Indonesia

Kembalikan HANYA JSON dengan format:
{
  "summary": "...",
  "experiences": [{ "company": "...", "position": "...", "duration": "...", "bullets": ["..."] }],
  "educations": [{ "institution": "...", "degree": "...", "major": "...", "year": "...", "gpa": "..." }],
  "skills": { "hard": ["..."], "soft": ["..."], "tools": ["..."] }
}
`.trim();
}
```

---

## 6. Skill: Custom Exception Filter

```typescript
// shared/filters/http-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException
      ? (exception.getResponse() as any)?.message ?? exception.message
      : 'Terjadi kesalahan internal';

    const code = this.mapStatusToCode(status);

    response.status(status).json({
      success: false,
      error: { code, message },
    });
  }

  private mapStatusToCode(status: number): string {
    const map: Record<number, string> = {
      400: 'VALIDATION_ERROR',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      429: 'RATE_LIMIT_EXCEEDED',
      503: 'AI_TIMEOUT',
      500: 'INTERNAL_ERROR',
    };
    return map[status] ?? 'INTERNAL_ERROR';
  }
}
```

---

## 7. Skill: Response Interceptor

```typescript
// shared/interceptors/response.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
      })),
    );
  }
}
```

---

## 8. Skill: Redis Service

```typescript
// shared/redis/redis.service.ts
import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
  private client: Redis;

  constructor() {
    this.client = new Redis(process.env.REDIS_URL);
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async incr(key: string, ttlSeconds?: number): Promise<number> {
    const count = await this.client.incr(key);
    if (ttlSeconds && count === 1) {
      await this.client.expire(key, ttlSeconds);
    }
    return count;
  }
}
```

---

## 9. Skill: PDF Export dengan Puppeteer

```typescript
// modules/export/export.service.ts
import puppeteer from 'puppeteer';
import { readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class ExportService {
  async generatePDF(cv: CV): Promise<Buffer> {
    const template = readFileSync(
      join(__dirname, 'templates', 'cv.template.html'),
      'utf-8',
    );

    const html = this.renderTemplate(template, cv);

    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
      printBackground: true,
    });

    await browser.close();
    return Buffer.from(pdf);
  }

  private renderTemplate(template: string, cv: CV): string {
    // Simple template rendering — replace {{variable}} dengan data CV
    return template
      .replace('{{name}}', cv.content.name ?? '')
      .replace('{{summary}}', cv.content.summary ?? '')
      // ... etc
  }
}
```
