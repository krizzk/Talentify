# 📏 RULES — Backend

## AI Job Getting System — Backend Standards & Constraints

**Berlaku untuk:** Semua kode di `backend/` (handled by single engineer)  
**Context:** Enforcement per phase as defined in 15-IMPL-INTEGRATED.md  
**Enforcement:** Code tidak boleh committed jika melanggar aturan ini

---

## RULE 1 — Module & Architecture

### R1.1 — Backend hanya API, frontend hanya konsumen
Backend hanya boleh expose endpoint REST. Semua UI, routing, dan state management diselesaikan di frontend.

### R1.2 — API contract harus sesuai frontend
Pastikan endpoint backend sesuai path dan response wrapper yang dipakai frontend:
- Base path: `/api/*`
- Success response: `{ success: true, data: ... }`
- Error response: `{ success: false, error: { code, message } }`
- Auth refresh: `/api/auth/refresh`
- CORS origin: `process.env.FRONTEND_URL`


### R1.3 — Satu module, satu domain
Setiap module hanya boleh bertanggung jawab untuk satu domain bisnis. Module tidak boleh langsung import repository dari module lain — gunakan service yang di-ekspor.

```typescript
// ✅ BENAR — gunakan service yang diekspor
@Module({
  imports: [ProfileModule], // Import module, bukan repository langsung
})
export class CVModule {}

// ❌ SALAH — import repository domain lain
@Module({
  imports: [TypeOrmModule.forFeature([Profile])], // Ini milik ProfileModule!
})
export class CVModule {}
```

### R1.4 — Shared code ke `shared`
Kode yang digunakan lebih dari satu module (AI service, Redis service, decorator, guard, filter) harus ada di `src/shared/`, bukan di dalam module tertentu.

### R1.5 — API contract harus cocok dengan frontend
Backend harus menjaga path dan format response agar frontend bisa bekerja tanpa custom parsing. CORS hanya untuk frontend origin.

### R1.6 — Controller hanya routing
Controller tidak boleh berisi logika bisnis. Semua logika ada di service.

```typescript
// ✅ BENAR — controller tipis
@Post('generate')
generate(@CurrentUser('id') userId: string) {
  return this.cvService.generate(userId);
}

// ❌ SALAH — logika di controller
@Post('generate')
async generate(@CurrentUser('id') userId: string) {
  const profile = await this.profileRepo.findOne({ where: { userId } });
  if (!profile) throw new NotFoundException();
  const ai = new Anthropic();
  const result = await ai.messages.create(...);
  // ...
}
```

---

## RULE 2 — Data Validation

### R2.1 — Wajib DTO + class-validator untuk semua input
Setiap endpoint yang menerima body, query, atau param harus menggunakan DTO dengan decorator `class-validator`. Jangan trust raw input.

```typescript
// ✅ BENAR
@Post('analyze')
analyze(@Body() dto: AnalyzeATSDto) { ... }

// ❌ SALAH — body any tanpa validasi
@Post('analyze')
analyze(@Body() body: any) { ... }
```

### R2.2 — Global Validation Pipe di `main.ts`
```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,      // Strip property yang tidak ada di DTO
  forbidNonWhitelisted: true, // Throw jika ada property extra
  transform: true,      // Auto-transform tipe (string ke number, dll)
}));
```

### R2.3 — Panjang input dibatasi
Semua field string yang di-input user harus punya `@MaxLength`. Terutama untuk `job_description` (max 10.000 char) dan konten CV yang diedit.

---

## RULE 3 — Authorization

### R3.1 — Setiap protected endpoint wajib `JwtAuthGuard`
Semua endpoint kecuali `/auth/register`, `/auth/login`, dan `/auth/refresh` harus dilindungi dengan `@UseGuards(JwtAuthGuard)`.

```typescript
// ✅ BENAR — guard di level controller (berlaku untuk semua endpoint)
@Controller('cv')
@UseGuards(JwtAuthGuard)
export class CVController {}
```

### R3.2 — Resource ownership wajib dicek di service
Setiap aksi pada resource spesifik (CV, ATS result) harus memverifikasi bahwa resource milik user yang request.

```typescript
// ✅ BENAR — ownership check
async findOne(id: string, userId: string): Promise<CV> {
  const cv = await this.cvRepo.findOne({ where: { id } });

  if (!cv) throw new NotFoundException('CV tidak ditemukan');
  if (cv.userId !== userId) throw new ForbiddenException('Akses ditolak');

  return cv;
}

// ❌ SALAH — tidak cek ownership
async findOne(id: string): Promise<CV> {
  return this.cvRepo.findOne({ where: { id } });
}
```

### R3.3 — Jangan expose internal error ke client
Error message untuk `500` tidak boleh berisi stack trace atau detail DB query.

```typescript
// ✅ BENAR — pesan generik
throw new InternalServerErrorException('Terjadi kesalahan. Coba lagi.');

// ❌ SALAH — expose detail internal
throw new Error(`DB error: relation "users" column "emal" does not exist`);
```

---

## RULE 4 — Database

### R4.1 — Selalu gunakan parameterized query
Jangan pernah string interpolation untuk query — gunakan TypeORM query builder atau find options.

```typescript
// ✅ BENAR — TypeORM parameterized
const cv = await this.cvRepo.findOne({ where: { id, userId } });

// ✅ BENAR — Query builder dengan parameter
const cvs = await this.cvRepo
  .createQueryBuilder('cv')
  .where('cv.userId = :userId', { userId })
  .getMany();

// ❌ SALAH — string interpolation
const cvs = await this.cvRepo.query(
  `SELECT * FROM cvs WHERE user_id = '${userId}'` // SQL injection!
);
```

### R4.2 — Eager loading hanya jika diperlukan
Jangan load semua relasi secara default. Load relasi hanya jika endpoint tersebut membutuhkannya.

```typescript
// ✅ BENAR — load relasi saat diperlukan
const profile = await this.profileRepo.findOne({
  where: { userId },
  relations: ['educations', 'experiences', 'skills'], // Eksplisit
});

// ❌ SALAH — eager: true di entity (selalu load)
@OneToMany(() => Education, { eager: true }) // Ini load setiap kali
educations: Education[];
```

### R4.3 — Gunakan transaction untuk operasi multi-tabel
```typescript
// ✅ BENAR — upsert profile + hapus lama dalam transaction
async upsert(userId: string, dto: UpsertProfileDto): Promise<Profile> {
  return this.dataSource.transaction(async (manager) => {
    // Hapus data lama
    await manager.delete(Education, { profileId: profile.id });
    // Insert baru
    await manager.save(Education, newEducations);
    // Update profile
    return manager.save(Profile, updatedProfile);
  });
}
```

---

## RULE 5 — AI Service

### R5.1 — Semua panggilan AI melalui `AIService`
Dilarang instantiate `Anthropic` client di luar `AIService`. Semua modul yang butuh AI harus inject `AIService`.

### R5.2 — Selalu ada timeout untuk AI call
Setiap panggilan ke Anthropic API harus memiliki timeout maksimal 30 detik. Jangan biarkan request menggantung.

### R5.3 — Validasi output AI sebelum disimpan
Output AI berupa JSON harus diparse dan divalidasi strukturnya sebelum disimpan ke DB. Jangan langsung `JSON.parse` tanpa try/catch dan validasi.

```typescript
// ✅ BENAR — parse + validate + fallback
private parseCVContent(raw: string): CVContent {
  try {
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    if (!parsed.summary || !Array.isArray(parsed.experiences)) {
      throw new Error('Invalid CV structure from AI');
    }
    return parsed as CVContent;
  } catch {
    throw new ServiceUnavailableException('AI response tidak valid. Coba lagi.');
  }
}
```

### R5.4 — Log setiap AI call (tanpa PII)
Setiap AI call harus di-log dengan: timestamp, model, estimated tokens, duration. Jangan log isi CV atau job description (data sensitif user).

---

## RULE 6 — Caching

### R6.1 — Gunakan cache key yang konsisten
Format cache key: `{entity}:{identifier}` atau `{entity}:{id1}:{id2}` untuk composite key.

```typescript
const profileKey = `profile:${userId}`;
const cvListKey  = `cvs:${userId}`;
const atsKey     = `ats:${cvId}:${jdHash}`;
```

### R6.2 — Invalidate cache saat data berubah
Setiap write operation harus invalidate cache yang relevan.

```typescript
async updateProfile(userId: string, dto: UpsertProfileDto) {
  const updated = await this.profileRepo.save(...);
  await this.redisService.del(`profile:${userId}`); // ← Wajib
  return updated;
}
```

### R6.3 — TTL wajib untuk semua cache entry
Dilarang menyimpan cache tanpa TTL (bisa memory leak). TTL minimum 1 menit, maksimum 1 jam untuk MVP.

---

## RULE 7 — Error Handling

### R7.1 — Gunakan NestJS built-in exceptions
```typescript
// Gunakan exception yang tepat
throw new NotFoundException('CV tidak ditemukan');
throw new ForbiddenException('Akses ditolak');
throw new BadRequestException('Input tidak valid');
throw new UnauthorizedException('Token tidak valid');
throw new ServiceUnavailableException('AI timeout');
```

### R7.2 — Jangan catch dan ignore error
```typescript
// ❌ SALAH — error diabaikan
try {
  await this.redisService.set(key, value);
} catch {} // Diam-diam gagal

// ✅ BENAR — log error, tapi jangan crash untuk non-critical
try {
  await this.redisService.set(key, value);
} catch (err) {
  this.logger.warn(`Cache write failed for key ${key}:`, err.message);
  // Lanjut tanpa cache — degraded mode
}
```

### R7.3 — Gunakan NestJS Logger, bukan console.log
```typescript
import { Logger } from '@nestjs/common';

@Injectable()
export class CVService {
  private readonly logger = new Logger(CVService.name);

  async generate(userId: string) {
    this.logger.log(`Generating CV for user ${userId}`);
    // ...
  }
}
```

---

## RULE 8 — Security

### R8.1 — Helmet wajib aktif di `main.ts`
```typescript
app.use(helmet());
```

### R8.2 — CORS hanya untuk origin yang diizinkan
```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
});
```

### R8.3 — Rate limiting di Nginx + Guards
Rate limiting dikonfigurasi di dua level:
- Nginx: per IP untuk semua traffic
- NestJS `ThrottleGuard`: per user untuk AI endpoints

### R8.4 — Refresh token disimpan sebagai hash
Jangan simpan refresh token plaintext di DB. Selalu hash dengan bcrypt atau SHA-256.

---

## RULE 9 — Testing

### R9.1 — Unit test untuk setiap service method
Setiap method di service harus punya unit test. Gunakan Jest + `@nestjs/testing`.

### R9.2 — Mock dependency external
AI service dan Redis service harus di-mock di unit test — jangan panggil service real.

```typescript
// ✅ BENAR — mock AI service
const module = await Test.createTestingModule({
  providers: [
    CVService,
    { provide: AIService, useValue: { generateCV: jest.fn().mockResolvedValue(mockCVContent) } },
    { provide: getRepositoryToken(CV), useValue: mockCVRepository },
  ],
}).compile();
```

---

## RULE 10 — Git & Code Review

### R10.1 — Branch naming
```
feature/cv-tailor-endpoint
fix/ats-cache-invalidation
chore/update-nestjs-deps
```

### R10.2 — Commit message
Format: `type(scope): deskripsi singkat`
```
feat(cv): add CV tailor endpoint
fix(ats): fix cache key collision for same JD hash
perf(profile): add Redis cache for profile GET
test(auth): add unit tests for JWT refresh flow
```

### R10.3 — PR checklist sebelum minta review
- [ ] Semua endpoint baru ada DTO dengan validasi
- [ ] Ownership check ada di setiap resource endpoint
- [ ] Tidak ada `console.log` tertinggal (gunakan Logger)
- [ ] Error handling tidak expose detail internal
- [ ] Cache di-invalidate di setiap write operation
- [ ] AI call ada timeout
- [ ] Unit test ada untuk semua service method baru
- [ ] Tidak ada query tanpa parameterized (SQL injection check)
