# ⚙️ IMPLEMENTATION PLAN — Backend

> ⚠️ **DEPRECATED** — This document uses the old 3-role structure (Backend Engineer role-based).  
> **NEW UNIFIED ROADMAP:** See `15-IMPL-INTEGRATED.md` for single-engineer, phase-based execution.  
> This file kept for reference only. For current development, follow `15-IMPL-INTEGRATED.md`.

## AI Job Getting System — Backend Roadmap (10 Phases)

**Role:** Backend Engineer  
**Timeline:** 5 minggu  
**Stack:** NestJS · TypeScript · TypeORM · PostgreSQL · Redis · Anthropic API

---

## Overview Timeline

```
Week 1                    Week 2              Week 3              Week 4              Week 5
│                         │                   │                   │                   │
├─ Phase 1                ├─ Phase 4          ├─ Phase 6          ├─ Phase 8          ├─ Phase 10
│  Project Bootstrap      │  CV Module         │  ATS Module        │  CV Tailoring     │  Hardening
│                         │  (Generate)        │  (Analyzer)        │  & Export PDF     │  & Deploy
│                         │                   │                   │                   │
├─ Phase 2                ├─ Phase 5          ├─ Phase 7          ├─ Phase 9
│  Auth Module            │  Profile          │  AI Service        │  Monetization
│                         │  Module           │  Hardening         │  Layer
│                         │                   │                   │
├─ Phase 3
│  Core Infrastructure
│  (DB, Redis, Guards)
```

---

## Phase 1 — Project Bootstrap & Core Setup

**Tujuan:** Proyek NestJS berjalan dengan struktur yang benar, siap untuk development.  
**Deliverable:** NestJS app berjalan, global pipes/filters/interceptors aktif, health check endpoint

### Tasks

**1.1 — Inisialisasi project NestJS**
```bash
cd apps/backend
npm install -g @nestjs/cli
nest new . --package-manager npm --skip-git

# Install core dependencies
npm install \
  @nestjs/typeorm typeorm pg \
  @nestjs/jwt @nestjs/passport passport passport-jwt \
  @nestjs/config class-validator class-transformer \
  bcrypt ioredis \
  @anthropic-ai/sdk \
  helmet

# Install dev dependencies
npm install -D \
  @types/bcrypt @types/passport-jwt \
  jest @types/jest ts-jest \
  @nestjs/testing supertest @types/supertest
```

**1.2 — Struktur direktori awal**
```
src/
├── main.ts
├── app.module.ts
├── config/
│   ├── app.config.ts
│   ├── database.config.ts
│   ├── redis.config.ts
│   └── env.validation.ts
├── modules/          (kosong — diisi per phase)
└── shared/
    ├── decorators/
    │   └── current-user.decorator.ts
    ├── filters/
    │   └── http-exception.filter.ts
    ├── interceptors/
    │   └── response.interceptor.ts
    └── guards/        (kosong — diisi di Phase 2)
```

**1.3 — `main.ts` dengan global setup**
```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { ResponseInterceptor } from './shared/interceptors/response.interceptor';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());
  app.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Error handling
  app.useGlobalFilters(new HttpExceptionFilter());

  // Response wrapping
  app.useGlobalInterceptors(new ResponseInterceptor());

  await app.listen(process.env.APP_PORT ?? 4000);
  console.log(`Backend running on port ${process.env.APP_PORT ?? 4000}`);
}
bootstrap();
```

**1.4 — Health check endpoint**
```typescript
// src/app.controller.ts
@Controller()
export class AppController {
  @Get('health')
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
```

**1.5 — HttpExceptionFilter & ResponseInterceptor**

Implementasikan kedua shared component ini sesuai spec di `08-SKILL-BACKEND.md`.

### Definition of Done
- [ ] `npm run start:dev` berjalan tanpa error
- [ ] `GET /api/health` return `{ status: 'ok' }`
- [ ] Validation pipe aktif — test dengan request body invalid
- [ ] Response selalu terbungkus `{ success: true, data: ... }`

---

## Phase 2 — Auth Module

**Tujuan:** Sistem autentikasi lengkap dengan JWT access token dan refresh token.  
**Deliverable:** Register, login, refresh, logout endpoint; JWT guard siap dipakai modul lain

### Tasks

**2.1 — User entity**
```typescript
// modules/users/entities/user.entity.ts
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true }) email: string;
  @Column({ name: 'password_hash', select: false }) passwordHash: string;
  @Column({ name: 'full_name' }) fullName: string;
  @Column({ type: 'enum', enum: UserPlan, default: UserPlan.FREE }) plan: UserPlan;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
```

**2.2 — RefreshToken entity**
```typescript
@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'user_id' }) userId: string;
  @Column({ name: 'token_hash' }) tokenHash: string;
  @Column({ name: 'expires_at' }) expiresAt: Date;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @Column({ name: 'revoked_at', nullable: true }) revokedAt: Date;
}
```

**2.3 — Register endpoint**

Logic:
1. Cek email sudah ada → throw `BadRequestException`
2. Hash password dengan bcrypt (cost factor 12)
3. Simpan user ke DB
4. Generate access token (JWT, 15 menit) + refresh token (UUID, 7 hari)
5. Hash refresh token, simpan ke `refresh_tokens`
6. Set refresh token di httpOnly cookie
7. Return `{ access_token, user }`

**2.4 — Login endpoint**

Logic:
1. Cari user by email → throw `UnauthorizedException` jika tidak ada
2. Verify password dengan bcrypt → throw `UnauthorizedException` jika salah
3. Generate tokens (sama seperti register)
4. Set cookie, return response

**2.5 — Refresh endpoint**

Logic:
1. Baca refresh token dari cookie
2. Cari di DB, pastikan tidak expired dan tidak revoked
3. Generate access token baru
4. Return `{ access_token }`

**2.6 — Logout endpoint**

Logic:
1. Baca refresh token dari cookie
2. Set `revoked_at = NOW()` di DB
3. Clear cookie
4. Return success

**2.7 — JWT Strategy & Guard**
```typescript
// shared/guards/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

// Decorator untuk ambil user dari request
// shared/decorators/current-user.decorator.ts
export const CurrentUser = createParamDecorator(
  (field: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return field ? request.user?.[field] : request.user;
  },
);
```

**2.8 — Test auth endpoints**
```
POST /api/auth/register  → 201 dengan valid data
POST /api/auth/register  → 400 dengan email duplikat
POST /api/auth/register  → 400 dengan password < 8 char
POST /api/auth/login     → 200 dengan kredensial benar
POST /api/auth/login     → 401 dengan password salah
POST /api/auth/refresh   → 200 dengan cookie valid
POST /api/auth/logout    → 200, cookie dihapus
GET  /api/users/me       → 401 tanpa token
GET  /api/users/me       → 200 dengan token valid
```

### Definition of Done
- [ ] Semua 9 test case di atas pass
- [ ] Password hash tidak ter-expose di response
- [ ] Refresh token ter-hash di database
- [ ] Cookie httpOnly terverifikasi di browser DevTools
- [ ] JwtAuthGuard siap digunakan modul lain

---

## Phase 3 — Core Infrastructure (DB, Redis, Rate Limiting)

**Tujuan:** TypeORM terkonfigurasi, Redis service siap, rate limiting aktif.  
**Deliverable:** Database connection, Redis service injectable, ThrottleGuard

### Tasks

**3.1 — TypeORM configuration**
```typescript
// config/database.config.ts
export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  synchronize: false,                // JANGAN true di production
  logging: process.env.NODE_ENV === 'development',
  extra: {
    max: 20,
    min: 2,
    idleTimeoutMillis: 30000,
  },
};
```

**3.2 — Redis service**

Implementasikan `shared/redis/redis.service.ts` sesuai `08-SKILL-BACKEND.md` dengan methods: `get`, `set`, `del`, `incr`.

**3.3 — Rate limiting guard**
```typescript
// shared/guards/throttle.guard.ts
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
        { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Terlalu banyak request.' } },
        429,
      );
    }

    return true;
  }
}
```

**3.4 — Migration: run schema awal**
```bash
docker compose exec backend npm run migration:run
```

Verifikasi semua tabel terbuat:
```bash
docker compose exec postgres psql -U postgres -d aijobdb -c "\dt"
```

### Definition of Done
- [ ] Koneksi TypeORM ke PostgreSQL berhasil (tidak ada error di startup)
- [ ] Redis service bisa `get`, `set`, `del`, `incr`
- [ ] Rate limiting mengembalikan 429 setelah limit tercapai
- [ ] Semua tabel dari ERD sudah ada di database

---

## Phase 4 — CV Module (Generate & CRUD)

**Tujuan:** User bisa generate CV dari profil menggunakan AI dan melakukan CRUD CV.  
**Deliverable:** Endpoint generate, list, get, update, delete CV

### Tasks

**4.1 — CV entity**

Implementasikan `cvs` entity sesuai ERD dengan semua kolom: `id`, `userId`, `title`, `content` (JSONB), `plainText`, `type`, `parentCvId`, `status`.

**4.2 — CV DTO**
```typescript
// modules/cv/dto/update-cv.dto.ts
export class UpdateCVDto {
  @IsString() @IsOptional() title?: string;
  @IsEnum(CVStatus) @IsOptional() status?: CVStatus;
  @IsObject() @IsOptional() content?: CVContent;
}
```

**4.3 — CV Service — method `generate`**

Logic lengkap:
1. Cek plan user — free tier hanya boleh 1 CV generate per hari
2. Ambil profil user (dengan cache)
3. Build prompt dari profil
4. Panggil AI Service (dengan timeout 30 detik)
5. Parse response AI → struktur `CVContent`
6. Generate `plainText` dari content (untuk ATS matching)
7. Simpan ke DB
8. Invalidate cache `cvs:{userId}`
9. Return CV

**4.4 — CV Service — method `findAll`**

Logic:
1. Cek cache `cvs:{userId}`
2. Jika hit → return cache
3. Jika miss → query DB, set cache (TTL 2 menit)

**4.5 — CV Service — method `findOne`, `update`, `remove`**

Semua method **wajib** verifikasi ownership: `cv.userId === userId`, throw `ForbiddenException` jika tidak match.

**4.6 — AI Service — method `generateCV`**

Implementasikan di `shared/ai/ai.service.ts`:
- Build prompt dari `ProfileData`
- Call Anthropic API dengan model `claude-sonnet-4-20250514`
- Parse JSON response
- Validasi struktur output sebelum return
- Timeout 30 detik, 1x retry

**4.7 — Helper: generate plain text dari CV content**
```typescript
function generatePlainText(content: CVContent): string {
  const parts: string[] = [];

  if (content.summary) parts.push(content.summary);

  content.experiences?.forEach(exp => {
    parts.push(`${exp.position} at ${exp.company}`);
    exp.bullets?.forEach(b => parts.push(b));
  });

  content.educations?.forEach(edu => {
    parts.push(`${edu.degree} ${edu.major} from ${edu.institution}`);
  });

  const allSkills = [
    ...(content.skills?.hard ?? []),
    ...(content.skills?.soft ?? []),
    ...(content.skills?.tools ?? []),
  ];
  if (allSkills.length) parts.push(allSkills.join(', '));

  return parts.join('\n');
}
```

**4.8 — Test endpoint CV**
```
POST /api/cv/generate    → 201, content berisi summary/experience/education/skills
GET  /api/cv             → 200, array CV
GET  /api/cv/:id         → 200 untuk owner, 403 untuk user lain
PUT  /api/cv/:id         → 200, content terupdate
DELETE /api/cv/:id       → 200, CV terhapus
POST /api/cv/generate    → 429 setelah 10x (rate limit)
```

### Definition of Done
- [ ] Generate CV mengembalikan struktur JSON yang valid dalam < 10 detik
- [ ] `plainText` tersimpan di DB (diperlukan ATS di Phase 6)
- [ ] Semua test endpoint pass
- [ ] Cache bekerja — request kedua lebih cepat dari pertama

---

## Phase 5 — Profile Module

**Tujuan:** User bisa menyimpan dan mengupdate data profil lengkap sebagai context AI.  
**Deliverable:** GET dan PUT /profile endpoint dengan nested educations, experiences, skills

### Tasks

**5.1 — Entitas profile, education, experience, skill**

Implementasikan sesuai ERD. Perhatikan relasi:
- `Profile` → one-to-one dengan `User`
- `Profile` → one-to-many dengan `Education`, `Experience`, `Skill`

**5.2 — UpsertProfileDto**
```typescript
export class UpsertProfileDto {
  @IsString() @IsOptional() target_role?: string;
  @IsString() @IsOptional() phone?: string;
  @IsString() @IsOptional() location?: string;
  @IsUrl() @IsOptional() linkedin_url?: string;
  @IsString() @IsOptional() summary?: string;

  @IsArray() @ValidateNested({ each: true }) @Type(() => EducationDto)
  educations: EducationDto[];

  @IsArray() @ValidateNested({ each: true }) @Type(() => ExperienceDto)
  experiences: ExperienceDto[];

  @IsArray() @ValidateNested({ each: true }) @Type(() => SkillDto)
  skills: SkillDto[];
}
```

**5.3 — Profile Service — method `upsert`**

Logic menggunakan database transaction:
1. Cari profile by userId — buat baru jika belum ada
2. Dalam satu transaction:
   - Update field profile
   - Hapus semua education/experience/skill lama
   - Insert yang baru
3. Invalidate cache `profile:{userId}`
4. Return profile lengkap dengan relasi

**5.4 — Profile Service — method `getByUserId`**

Cache-aside pattern (TTL 5 menit). Load semua relasi.

**5.5 — Test endpoint profil**
```
GET  /api/profile   → 404 sebelum profil diisi
PUT  /api/profile   → 200 dengan data lengkap
GET  /api/profile   → 200 setelah diisi, relasi include
PUT  /api/profile   → 200 update sebagian field (educations kosong = hapus semua)
```

### Definition of Done
- [ ] PUT /profile berhasil simpan nested data dalam satu request
- [ ] GET /profile mengambil semua relasi (education, experience, skills)
- [ ] Cache di-invalidate setelah update
- [ ] Transaction: jika insert education gagal, seluruh upsert di-rollback

---

## Phase 6 — ATS Analyzer Module

**Tujuan:** Analisis kesesuaian CV dengan job description, menghasilkan score dan keyword gap.  
**Deliverable:** Endpoint analyze, riwayat analysis, caching untuk JD yang sama

### Tasks

**6.1 — ATSResult entity**

Implementasikan sesuai ERD dengan kolom JSONB untuk `matchedKeywords`, `missingKeywords`, dan `suggestions`.

**6.2 — AnalyzeATSDto**
```typescript
export class AnalyzeATSDto {
  @IsUUID() cv_id: string;

  @IsString()
  @MinLength(100, { message: 'Job description minimal 100 karakter' })
  @MaxLength(10000, { message: 'Job description maksimal 10.000 karakter' })
  job_description: string;
}
```

**6.3 — ATS Service — method `analyze`**

Logic:
1. Hash JD (`SHA-256` dari teks yang di-normalize)
2. Cek cache `ats:{cvId}:{jdHash}` → return jika hit
3. Fetch CV `plainText` dari DB
4. Verifikasi CV ownership
5. Panggil AI Service untuk analisis:
   - Extract keyword dari JD
   - Match keyword dengan CV plainText
   - Generate score (0–100)
   - Generate saran per section
6. Simpan ke DB
7. Set cache (TTL 30 menit)
8. Return result

**6.4 — AI Service — method `analyzeATS`**

Prompt harus menghasilkan JSON dengan struktur:
```json
{
  "job_title": "...",
  "company_name": "...",
  "score": 72,
  "matched_keywords": ["Node.js", "PostgreSQL"],
  "missing_keywords": ["TypeScript", "CI/CD"],
  "suggestions": [
    { "section": "skills", "tip": "..." }
  ]
}
```

**6.5 — Test endpoint ATS**
```
POST /api/ats/analyze   → 201 dengan CV id dan JD valid
POST /api/ats/analyze   → 400 JD kurang dari 100 karakter
POST /api/ats/analyze   → 403 dengan CV milik user lain
POST /api/ats/analyze   → cache hit pada JD yang sama (lebih cepat)
GET  /api/ats/history   → 200 list hasil analysis
GET  /api/ats/:id       → 200 detail hasil analysis
```

### Definition of Done
- [ ] Score di antara 0–100
- [ ] Keyword matching menghasilkan matched dan missing list
- [ ] Cache bekerja: request kedua dengan JD sama tidak hit AI
- [ ] Semua test endpoint pass

---

## Phase 7 — AI Service Hardening

**Tujuan:** AI Service robust terhadap timeout, invalid output, dan API errors.  
**Deliverable:** Retry logic, timeout, output validation, logging

### Tasks

**7.1 — Timeout dan retry**
```typescript
private async callWithRetry(prompt: string, maxRetries = 1): Promise<string> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await this.callWithTimeout(prompt, 30_000);
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
        this.logger.warn(`AI retry attempt ${attempt + 1}/${maxRetries}`);
      }
    }
  }

  throw new ServiceUnavailableException('AI service tidak tersedia. Coba lagi.');
}
```

**7.2 — Output validation**
```typescript
private validateCVContent(parsed: unknown): CVContent {
  if (
    typeof parsed !== 'object' ||
    !parsed ||
    typeof (parsed as any).summary !== 'string' ||
    !Array.isArray((parsed as any).experiences)
  ) {
    throw new ServiceUnavailableException('AI output tidak valid. Coba lagi.');
  }
  return parsed as CVContent;
}
```

**7.3 — Logging setiap AI call**
```typescript
// Log: userId, endpoint, model, duration, token estimate
// JANGAN log: isi CV, job description (PII / data sensitif)
this.logger.log({
  event: 'ai_call',
  endpoint: 'generateCV',
  userId,
  durationMs: Date.now() - start,
  model: process.env.ANTHROPIC_MODEL,
});
```

**7.4 — Graceful degradation**

Jika AI timeout, endpoint mengembalikan `503` dengan pesan yang jelas — tidak crash aplikasi.

### Definition of Done
- [ ] Request AI yang timeout mengembalikan 503 (bukan 500)
- [ ] AI dipanggil ulang 1x setelah timeout sebelum give up
- [ ] Output AI yang tidak valid tidak disimpan ke DB
- [ ] Setiap AI call ter-log dengan duration

---

## Phase 8 — CV Tailoring & PDF Export

**Tujuan:** User bisa rewrite CV sesuai job description dan download hasilnya sebagai PDF.  
**Deliverable:** Endpoint tailor, endpoint export PDF

### Tasks

**8.1 — CV tailor endpoint**

Logic di `cv.service.ts`:
1. Ambil CV original (verifikasi ownership)
2. Panggil `AIService.tailorCV(cv.content, dto.job_description)`
3. Simpan sebagai CV baru dengan `type: 'tailored'` dan `parentCvId: originalId`
4. Generate `plainText` dari CV baru
5. Invalidate cache `cvs:{userId}`
6. Return CV baru

**8.2 — AI Service — method `tailorCV`**

Prompt instruksikan AI untuk:
- Tambahkan keyword relevan dari JD ke CV
- Rewrite bullet points agar lebih sesuai dengan requirements JD
- Jangan ubah data faktual (nama perusahaan, tahun, dll)
- Return format JSON yang sama dengan `generateCV`

**8.3 — Export PDF endpoint**
```typescript
// modules/export/export.controller.ts
@Get(':id/export/pdf')
async exportPDF(
  @Param('id') id: string,
  @CurrentUser('id') userId: string,
  @Res() res: Response,
) {
  const cv = await this.cvService.findOne(id, userId);
  const pdf = await this.exportService.generatePDF(cv);

  const filename = `${cv.content.name ?? 'CV'}_${Date.now()}.pdf`
    .replace(/\s+/g, '_');

  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Content-Length': pdf.length,
  });

  res.send(pdf);
}
```

**8.4 — CV HTML template**

Buat `modules/export/templates/cv.template.html` yang:
- ATS-friendly (plain structure, tidak ada table layout)
- Profesional secara visual
- Support semua field dari `CVContent` JSONB

**8.5 — Test endpoint tailor dan export**
```
POST /api/cv/:id/tailor          → 201 CV baru dengan type 'tailored'
POST /api/cv/:id/tailor          → parentCvId menunjuk ke CV original
GET  /api/cv/:id/export/pdf      → response binary PDF
GET  /api/cv/:id/export/pdf      → Content-Type: application/pdf
GET  /api/cv/:id/export/pdf (user lain) → 403
```

### Definition of Done
- [ ] Tailored CV tersimpan sebagai CV baru (tidak overwrite original)
- [ ] PDF bisa dibuka dan dibaca
- [ ] Filename PDF berisi nama user
- [ ] Export tidak expose data user lain

---

## Phase 9 — Monetization Layer (Free vs Premium)

**Tujuan:** Enforce batasan free tier (1x generate, 1x ATS per hari) tanpa memblokir premium user.  
**Deliverable:** Usage tracking, plan check guard, upgrade endpoint placeholder

### Tasks

**9.1 — Usage tracking**
```typescript
// Simpan usage counter di Redis per user per hari
// Key: usage:{userId}:{YYYY-MM-DD}:{feature}
// TTL: 86400 (24 jam)
// Feature: 'generate' | 'analyze'

async function checkAndIncrementUsage(
  userId: string,
  feature: 'generate' | 'analyze',
  plan: UserPlan,
): Promise<void> {
  if (plan === UserPlan.PREMIUM) return; // Premium tidak dibatasi

  const today = new Date().toISOString().split('T')[0];
  const key = `usage:${userId}:${today}:${feature}`;

  const count = await this.redisService.incr(key, 86400);

  if (count > 1) {
    throw new ForbiddenException(
      'Batas harian free tier tercapai. Upgrade ke Premium untuk akses unlimited.'
    );
  }
}
```

**9.2 — Integrasikan check ke CV generate dan ATS analyze**

Tambahkan `checkAndIncrementUsage` sebelum logic utama di `CVService.generate` dan `ATSService.analyze`.

**9.3 — Endpoint upgrade placeholder**
```typescript
// Placeholder untuk integrasi payment gateway di masa depan
@Post('subscription/upgrade')
async upgrade(@CurrentUser('id') userId: string) {
  // TODO: Integrasi dengan Midtrans / payment gateway
  return { message: 'Fitur upgrade akan segera tersedia' };
}
```

**9.4 — Test batasan free tier**
```
POST /api/cv/generate (free user, pertama kali)    → 201
POST /api/cv/generate (free user, kedua kali)      → 403 dengan pesan upgrade
POST /api/cv/generate (premium user, berkali-kali) → 201 semua
```

### Definition of Done
- [ ] Free user di-blokir setelah 1x generate per hari
- [ ] Premium user tidak pernah di-blokir oleh usage check
- [ ] Usage counter reset keesokan harinya (TTL 24 jam)
- [ ] Pesan error menginformasikan user untuk upgrade

---

## Phase 10 — Hardening, Testing & Deploy Readiness

**Tujuan:** Backend production-ready: security audit, test coverage > 80%, dokumentasi lengkap.  
**Deliverable:** Test suite lengkap, security audit report, deployment checklist

### Tasks

**10.1 — Lengkapi unit tests**

Pastikan test coverage > 80% untuk semua service:
```bash
npm test -- --coverage --coverageReporters=text-summary
```

Service yang wajib di-cover:
- `AuthService` — register, login, refresh, logout
- `ProfileService` — upsert, getByUserId
- `CVService` — generate, findOne, update, tailor
- `ATSService` — analyze (termasuk cache hit)
- `AIService` — timeout, retry, invalid output

**10.2 — Integration tests**

Test setiap endpoint dengan database nyata (test database):
```bash
# Jalankan integration test dengan env khusus
DATABASE_URL=postgresql://postgres:pass@localhost:5432/aijobdb_test \
npm run test:integration
```

**10.3 — Security audit checklist**
```
Auth:
  ✓ Password tidak pernah ter-log
  ✓ Refresh token di-hash di DB
  ✓ JWT secret minimal 256 bit
  ✓ Access token expires dalam 15 menit

API:
  ✓ Semua protected endpoint ada JwtAuthGuard
  ✓ Semua resource endpoint ada ownership check
  ✓ Rate limiting aktif
  ✓ Input max length terkonfigurasi
  ✓ Tidak ada raw SQL tanpa parameterized query

Response:
  ✓ Stack trace tidak ter-expose di response error
  ✓ `password_hash` tidak pernah ada di response
  ✓ Internal error message diganti dengan pesan generik
```

**10.4 — Performance baseline**
```bash
# Ukur response time endpoint utama sebelum go-live
curl -w "@curl-format.txt" -o /dev/null -s "https://api.domain.com/api/health"
# Target: < 100ms untuk health check
```

**10.5 — Backend go-live checklist**
- [ ] `NODE_ENV=production` terkonfigurasi
- [ ] `synchronize: false` di TypeORM config
- [ ] Semua migration sudah di-run
- [ ] Tidak ada `console.log` di kode production
- [ ] Semua env variable terdokumentasi di `.env.example`
- [ ] Health check endpoint return 200
- [ ] Unit test coverage > 80%
- [ ] Integration test semua endpoint pass
- [ ] Rate limiting aktif (verifikasi dengan curl)
- [ ] CORS hanya untuk frontend domain
- [ ] Helmet aktif

### Definition of Done
- [ ] `npm test -- --coverage` menunjukkan > 80%
- [ ] Semua integration test pass
- [ ] Security checklist 100% centang
- [ ] Response time health check < 100ms
- [ ] Zero critical/high severity issue dari security audit
