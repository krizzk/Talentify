# 📏 RULES — QA

## AI Job Getting System — Quality Assurance Standards & Constraints

**Berlaku untuk:** Semua testing activities di `backend/`, `frontend/`, dan `e2e/` (handled by single engineer)  
**Strategy:** Per-phase unit tests + comprehensive testing at late phases  
**Enforcement:** CI pipeline hijau wajib sebelum phase advances

---

## RULE 1 — Coverage Minimum

### R1.1 — Coverage threshold wajib dipenuhi
| Layer | Minimum Coverage |
|-------|-----------------|
| Backend Services | 80% statement coverage |
| Frontend Hooks | 80% statement coverage |
| Frontend Components (kritis) | 70% branch coverage |
| E2E happy path | 100% user flow utama |

"Kritis" = komponen yang menangani uang, auth, atau data user (LoginForm, ProfileForm, CVEditor).

### R1.2 — Coverage check di CI
```yaml
# .github/workflows/test.yml
- name: Run backend tests
  run: |
    cd apps/backend
    npm test -- --coverage --coverageThreshold='{"global":{"statements":80}}'

- name: Run frontend tests
  run: |
    cd apps/frontend
    npm test -- --coverage --coverageThreshold='{"global":{"statements":80}}'
```

### R1.3 — Coverage tidak boleh turun
Jika PR menurunkan coverage dari baseline saat ini, PR harus ditolak sampai test ditambahkan.

---

## RULE 2 — Test Pyramid

### R2.1 — Proporsi test yang tepat
```
        /\
       /  \
      / E2E \          ← Sedikit, hanya happy path & critical flows
     /--------\
    / Integration\     ← Sedang, per endpoint API
   /--------------\
  /   Unit Tests   \   ← Banyak, semua service, hook, util
 /------------------\
```

Jangan menggantikan banyak unit test dengan satu E2E test. E2E lambat dan fragile — gunakan untuk memvalidasi flow, bukan logika.

### R2.2 — Tidak ada test yang skip di CI
```typescript
// ❌ SALAH — test di-skip tanpa alasan dan tiket
it.skip('harusnya handle AI timeout', () => { ... });
test.skip('download PDF flow', async () => { ... });

// ✅ BENAR — skip dengan alasan dan TODO
it.todo('handle AI streaming response — waiting for backend impl (JIRA-123)');
```

---

## RULE 3 — Unit Test Standards

### R3.1 — Satu `describe` per file yang di-test
```typescript
// ✅ BENAR
describe('CVService', () => {
  describe('generate', () => { ... });
  describe('tailor', () => { ... });
  describe('findOne', () => { ... });
});

// ❌ SALAH — describe tidak terstruktur
describe('CV tests', () => { ... });
describe('more CV tests', () => { ... });
```

### R3.2 — Nama test harus deskriptif dengan format BDD
Format: `[kondisi] → [hasil yang diharapkan]`

```typescript
// ✅ BENAR — jelas apa yang diuji
it('mengembalikan ForbiddenException jika CV bukan milik user', ...)
it('menampilkan score berwarna merah untuk nilai di bawah 60', ...)
it('tidak memanggil AI service jika profil belum diisi', ...)

// ❌ SALAH — tidak informatif
it('test 1', ...)
it('should work', ...)
it('error case', ...)
```

### R3.3 — Tidak ada real network call di unit test
Unit test harus berjalan offline. Semua network call di-mock dengan MSW (frontend) atau jest.fn() (backend).

### R3.4 — Setiap test bersifat independent
Test tidak boleh bergantung pada urutan eksekusi atau state dari test lain.

```typescript
// ✅ BENAR — state di-reset setiap test
beforeEach(() => {
  jest.clearAllMocks();
  mockCVRepo.findOne.mockResolvedValue(mockCV); // Reset ke default
});

// ❌ SALAH — state bocor antar test
let sharedCV: CV;
it('test A', () => { sharedCV = ...; });
it('test B', () => { expect(sharedCV.id).toBe(...); }); // Bergantung test A!
```

---

## RULE 4 — Integration Test Standards

### R4.1 — Wajib test setiap endpoint API
Setiap endpoint yang dibuat harus punya minimal:
- 1 test happy path (success response)
- 1 test validation error (400)
- 1 test unauthorized (401) jika protected
- 1 test not found / forbidden jika ada resource ownership

```typescript
// Template checklist per endpoint
describe('POST /api/cv/:id/tailor', () => {
  it('201 — tailor berhasil dengan JD valid', ...)       // ✓ Happy path
  it('400 — gagal jika job_description kosong', ...)     // ✓ Validation
  it('400 — gagal jika job_description terlalu pendek', ...)
  it('401 — gagal tanpa auth token', ...)                // ✓ Auth
  it('403 — gagal jika CV bukan milik user', ...)        // ✓ Ownership
  it('404 — gagal jika CV tidak ditemukan', ...)         // ✓ Not found
});
```

### R4.2 — Gunakan test database terpisah
Integration test menggunakan database PostgreSQL berbeda dari development. Konfigurasi via environment variable:
```
DATABASE_URL=postgresql://user:pass@localhost:5432/aijobdb_test
```

### R4.3 — Cleanup setelah setiap test suite
```typescript
afterAll(async () => {
  await dataSource.query('TRUNCATE users, cvs, ats_results CASCADE');
  await app.close();
});
```

---

## RULE 5 — E2E Test Standards

### R5.1 — E2E hanya untuk critical user flows
E2E test hanya ditulis untuk:
1. Register → isi profil → generate CV → download PDF (full happy path)
2. Login → ATS analyze → tailor CV
3. Gagal login dengan kredensial salah

Jangan tulis E2E untuk setiap edge case — itu tugas unit dan integration test.

### R5.2 — E2E test wajib independen
Setiap test E2E harus membuat user baru dan tidak bergantung pada data yang dibuat test lain.

```typescript
// ✅ BENAR — user unik per test run
const TEST_EMAIL = `e2e_${Date.now()}@test.com`;

// ❌ SALAH — shared state antar test
const TEST_EMAIL = 'shared_test@example.com'; // Bisa konflik
```

### R5.3 — Gunakan `data-testid` untuk selector
Jangan gunakan CSS class atau text selector untuk E2E test — brittle terhadap UI change.

```typescript
// ✅ BENAR — stable selector
await page.click('[data-testid="generate-cv-btn"]');
await expect(page.getByTestId('cv-preview')).toBeVisible();

// ❌ SALAH — brittle selector
await page.click('.btn-primary'); // Bisa berubah saat refactor
await page.click('text=Generate CV dengan AI'); // Bisa berubah saat copy berubah
```

### R5.4 — Timeout yang realistis untuk AI operations
AI response bisa lambat. Gunakan timeout yang cukup di E2E untuk AI endpoints.

```typescript
// ✅ BENAR — timeout cukup untuk AI
await expect(page.getByTestId('cv-preview')).toBeVisible({ timeout: 15_000 });

// ❌ SALAH — timeout default 5 detik tidak cukup untuk AI
await expect(page.getByTestId('cv-preview')).toBeVisible(); // Default 5 detik
```

---

## RULE 6 — Testing AI Features

### R6.1 — Unit test tidak boleh memanggil Anthropic API real
Semua unit dan integration test menggunakan mock AI service. Real AI call hanya di E2E dan performance test (dan harus ada di environment khusus).

```typescript
// ✅ BENAR — mock AI response
{ provide: AIService, useValue: { generateCV: jest.fn().mockResolvedValue(mockCVContent) } }
```

### R6.2 — Test AI timeout handling
Setiap fitur yang memanggil AI harus punya test untuk skenario timeout.

```typescript
it('mengembalikan ServiceUnavailableException jika AI timeout', async () => {
  mockAIService.generateCV.mockRejectedValueOnce(
    new ServiceUnavailableException('AI timeout. Coba lagi.')
  );

  await expect(service.generate('user-uuid'))
    .rejects.toThrow(ServiceUnavailableException);
});
```

### R6.3 — Test invalid AI output
Test untuk skenario di mana AI mengembalikan output yang tidak valid.

```typescript
it('mengembalikan error jika AI output tidak bisa di-parse', async () => {
  mockAIService.generateCV.mockRejectedValueOnce(
    new ServiceUnavailableException('AI response tidak valid')
  );

  await expect(service.generate('user-uuid'))
    .rejects.toThrow(ServiceUnavailableException);
});
```

---

## RULE 7 — Performance Test Standards

### R7.1 — Performance test wajib dijalankan sebelum go-live
Sebelum deploy ke production, wajib run k6 performance test untuk:
- CV Generate endpoint (target: p95 < 10 detik)
- ATS Analyze endpoint (target: p95 < 5 detik)
- PDF Export (target: p95 < 5 detik)

### R7.2 — Load test scenario minimum
```
Ramp up: 0 → 50 concurrent users dalam 2 menit
Hold:    50 concurrent users selama 5 menit
Ramp down: 50 → 0 dalam 1 menit
```

### R7.3 — Threshold wajib lolos
| Metrik | Threshold |
|--------|-----------|
| `http_req_duration p(95)` | < 10.000ms |
| `http_req_failed` | < 5% |
| `ai_response_time p(95)` | < 10.000ms |

---

## RULE 8 — Security Testing

### R8.1 — Test rate limiting
Setiap AI endpoint harus punya test bahwa rate limit benar-benar bekerja.

```typescript
it('mengembalikan 429 setelah melebihi rate limit', async () => {
  // Hit endpoint 11 kali (limit = 10 per 15 menit)
  for (let i = 0; i < 10; i++) {
    await request(app.getHttpServer())
      .post('/api/cv/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({});
  }

  const res = await request(app.getHttpServer())
    .post('/api/cv/generate')
    .set('Authorization', `Bearer ${token}`)
    .send({});

  expect(res.status).toBe(429);
  expect(res.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
});
```

### R8.2 — Test bahwa response tidak mengandung data sensitif
```typescript
it('response register tidak mengandung password_hash', async () => {
  const res = await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({ email: 'sec@test.com', password: 'Password123', full_name: 'Test' });

  expect(res.body.data.user).not.toHaveProperty('password_hash');
  expect(res.body.data.user).not.toHaveProperty('password');
});
```

### R8.3 — Test IDOR (Insecure Direct Object Reference)
```typescript
it('user A tidak bisa akses CV milik user B', async () => {
  // Login sebagai user B, buat CV
  const cvB = await createCVForUser('user-b-uuid');

  // Coba akses sebagai user A
  const res = await request(app.getHttpServer())
    .get(`/api/cv/${cvB.id}`)
    .set('Authorization', `Bearer ${tokenUserA}`);

  expect(res.status).toBe(403);
});
```

---

## RULE 9 — CI/CD Pipeline

### R9.1 — Urutan pipeline yang wajib diikuti
```
Commit Push
    │
    ▼
[Lint] → ESLint + TypeScript check (gagal = stop)
    │
    ▼
[Unit Test] → Vitest + Jest (gagal = stop)
    │
    ▼
[Integration Test] → Supertest + test DB (gagal = stop)
    │
    ▼
[Build] → next build + nest build (gagal = stop)
    │
    ▼
[E2E Test] → Playwright (hanya di branch main/staging)
    │
    ▼
Deploy
```

### R9.2 — PR tidak boleh di-merge jika CI merah

### R9.3 — Flaky test wajib diperbaiki atau dihapus
Test yang gagal secara intermiten (flaky) lebih berbahaya daripada tidak ada test. Jika test flaky ditemukan, langsung buat tiket prioritas tinggi dan tandai sebagai `.skip` sampai diperbaiki.

---

## RULE 10 — Bug Reporting

### R10.1 — Format laporan bug
Setiap bug yang ditemukan harus dilaporkan dengan format:

```
**Judul:** [Module] Deskripsi singkat bug

**Severity:** Critical / High / Medium / Low

**Steps to Reproduce:**
1. ...
2. ...
3. ...

**Expected Result:** Apa yang seharusnya terjadi

**Actual Result:** Apa yang terjadi

**Environment:** Staging / Production | Browser | OS

**Screenshot/Log:** (jika ada)
```

### R10.2 — Severity classification
| Severity | Definisi | Response Time |
|----------|----------|---------------|
| Critical | Aplikasi crash, data loss, security breach | Fix dalam 4 jam |
| High | Fitur utama tidak berfungsi, error 500 di production | Fix dalam 1 hari kerja |
| Medium | Fitur berfungsi tapi ada edge case yang salah | Fix dalam sprint ini |
| Low | UI issue, copy salah, minor UX problem | Fix di sprint berikutnya |
