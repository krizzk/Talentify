# 🧪 SKILL — QA

## AI Job Getting System — Quality Assurance Guide

**Stack:** Vitest · React Testing Library · Supertest · Playwright · k6  
**Context:** Single Engineer (Phase-based cross-role execution)  
**Phase Strategy:** Unit tests per phase + comprehensive E2E at late phases (Phase 8+)  
**Focus:** Backend API contract, validasi, frontend integration via `/api/*`

---

## 1. Skill: Unit Test — Frontend (Custom Hooks)

### Setup
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
});
```

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
import { server } from './mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Test Custom Hook dengan MSW

```typescript
// hooks/__tests__/use-cv.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';
import { useCVList, useGenerateCV } from '../use-cv';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

describe('useCVList', () => {
  it('mengembalikan daftar CV ketika berhasil', async () => {
    server.use(
      http.get('/api/cv', () =>
        HttpResponse.json({ success: true, data: [{ id: 'uuid-1', title: 'My CV' }] })
      )
    );

    const { result } = renderHook(() => useCVList(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].title).toBe('My CV');
  });

  it('menangani error 500 dengan benar', async () => {
    server.use(
      http.get('/api/cv', () => HttpResponse.json({}, { status: 500 }))
    );

    const { result } = renderHook(() => useCVList(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useGenerateCV', () => {
  it('invalidate query cvs setelah generate berhasil', async () => {
    const qc = new QueryClient();
    const invalidateSpy = jest.spyOn(qc, 'invalidateQueries');

    server.use(
      http.post('/api/cv/generate', () =>
        HttpResponse.json({ success: true, data: { id: 'new-uuid', title: 'Generated CV' } })
      )
    );

    const { result } = renderHook(() => useGenerateCV(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={qc}>{children}</QueryClientProvider>
      ),
    });

    result.current.mutate(undefined);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['cvs'] });
  });
});
```

---

## 2. Skill: Unit Test — Frontend (Components)

```typescript
// components/ats/__tests__/ATSScoreCard.test.tsx
import { render, screen } from '@testing-library/react';
import { ATSScoreCard } from '../ATSScoreCard';

const defaultProps = {
  score: 72,
  matchedKeywords: ['Node.js', 'PostgreSQL', 'Docker'],
  missingKeywords: ['TypeScript', 'CI/CD'],
};

describe('ATSScoreCard', () => {
  it('menampilkan score dengan benar', () => {
    render(<ATSScoreCard {...defaultProps} />);
    expect(screen.getByText('72')).toBeInTheDocument();
  });

  it('menampilkan jumlah keyword yang cocok', () => {
    render(<ATSScoreCard {...defaultProps} />);
    expect(screen.getByText(/Keyword Cocok \(3\)/)).toBeInTheDocument();
  });

  it('menampilkan setiap missing keyword', () => {
    render(<ATSScoreCard {...defaultProps} />);
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('CI/CD')).toBeInTheDocument();
  });

  it('menampilkan warna merah untuk score rendah', () => {
    render(<ATSScoreCard {...defaultProps} score={40} />);
    const scoreEl = screen.getByText('40');
    expect(scoreEl).toHaveClass('text-red-500');
  });

  it('menampilkan warna hijau untuk score tinggi', () => {
    render(<ATSScoreCard {...defaultProps} score={85} />);
    const scoreEl = screen.getByText('85');
    expect(scoreEl).toHaveClass('text-green-500');
  });
});
```

---

## 3. Skill: Unit Test — Backend (Service)

```typescript
// modules/cv/__tests__/cv.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CVService } from '../cv.service';
import { CV } from '../entities/cv.entity';
import { AIService } from '../../../shared/ai/ai.service';
import { ProfileService } from '../../profile/profile.service';
import { RedisService } from '../../../shared/redis/redis.service';

const mockCV = { id: 'cv-uuid', userId: 'user-uuid', title: 'Test CV', content: {}, type: 'generated', status: 'draft' };

const mockCVRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
};

const mockAIService = {
  generateCV: jest.fn().mockResolvedValue({ summary: 'Test summary', experiences: [], educations: [], skills: {} }),
};

const mockProfileService = {
  getByUserId: jest.fn().mockResolvedValue({ id: 'profile-uuid', userId: 'user-uuid' }),
};

const mockRedisService = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn(),
  del: jest.fn(),
};

describe('CVService', () => {
  let service: CVService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CVService,
        { provide: getRepositoryToken(CV), useValue: mockCVRepo },
        { provide: AIService, useValue: mockAIService },
        { provide: ProfileService, useValue: mockProfileService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<CVService>(CVService);
    jest.clearAllMocks();
  });

  describe('generate', () => {
    it('generate CV dari profil user', async () => {
      mockCVRepo.save.mockResolvedValue(mockCV);

      const result = await service.generate('user-uuid');

      expect(mockProfileService.getByUserId).toHaveBeenCalledWith('user-uuid');
      expect(mockAIService.generateCV).toHaveBeenCalledTimes(1);
      expect(mockCVRepo.save).toHaveBeenCalledTimes(1);
      expect(result.type).toBe('generated');
    });

    it('throw NotFoundException jika profil belum diisi', async () => {
      mockProfileService.getByUserId.mockRejectedValueOnce(new NotFoundException());

      await expect(service.generate('user-uuid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('return CV jika user adalah owner', async () => {
      mockCVRepo.findOne.mockResolvedValue(mockCV);

      const result = await service.findOne('cv-uuid', 'user-uuid');
      expect(result.id).toBe('cv-uuid');
    });

    it('throw ForbiddenException jika CV bukan milik user', async () => {
      mockCVRepo.findOne.mockResolvedValue({ ...mockCV, userId: 'other-user' });

      await expect(service.findOne('cv-uuid', 'user-uuid'))
        .rejects.toThrow(ForbiddenException);
    });

    it('throw NotFoundException jika CV tidak ada', async () => {
      mockCVRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('cv-uuid', 'user-uuid'))
        .rejects.toThrow(NotFoundException);
    });
  });
});
```

---

## 4. Skill: Integration Test — Backend (Endpoint)

```typescript
// modules/auth/__tests__/auth.integration.spec.ts
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../app.module';

describe('Auth Endpoints (Integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(() => app.close());

  describe('POST /api/auth/register', () => {
    it('201 — register berhasil dengan data valid', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'Password123', full_name: 'Test User' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.access_token).toBeDefined();
      expect(res.body.data.user.email).toBe('test@example.com');
      expect(res.body.data.user).not.toHaveProperty('password_hash');
    });

    it('400 — register gagal dengan email tidak valid', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'bukan-email', password: 'Password123', full_name: 'Test' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('400 — register gagal jika email sudah dipakai', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'duplicate@example.com', password: 'Password123', full_name: 'User 1' });

      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'duplicate@example.com', password: 'Password123', full_name: 'User 2' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('200 — login berhasil', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'Password123' });

      expect(res.status).toBe(200);
      expect(res.body.data.access_token).toBeDefined();
    });

    it('401 — login gagal dengan password salah', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'WrongPassword' });

      expect(res.status).toBe(401);
    });
  });
});
```

---

## 5. Skill: E2E Test — Full User Flow (Playwright)

```typescript
// e2e/cv-generation.spec.ts
import { test, expect, Page } from '@playwright/test';

const TEST_USER = {
  email: `e2e_${Date.now()}@test.com`,
  password: 'TestPassword123',
  fullName: 'E2E Test User',
};

test.describe('CV Generation Flow', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    // Register user
    await page.goto('/auth/register');
    await page.fill('[data-testid="email-input"]', TEST_USER.email);
    await page.fill('[data-testid="password-input"]', TEST_USER.password);
    await page.fill('[data-testid="fullname-input"]', TEST_USER.fullName);
    await page.click('[data-testid="register-btn"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test.afterAll(() => page.close());

  test('1 — user bisa isi profil', async () => {
    await page.goto('/profile');
    await page.fill('[data-testid="target-role-input"]', 'Backend Engineer');
    await page.fill('[data-testid="institution-input"]', 'Universitas Indonesia');
    await page.fill('[data-testid="degree-input"]', 'S1');
    await page.click('[data-testid="next-step-btn"]');

    await page.fill('[data-testid="company-input"]', 'Tokopedia');
    await page.fill('[data-testid="position-input"]', 'Software Engineer');
    await page.click('[data-testid="submit-profile-btn"]');

    await expect(page.getByText('Profil berhasil disimpan')).toBeVisible();
  });

  test('2 — user bisa generate CV', async () => {
    await page.goto('/cv/new');
    await page.click('[data-testid="generate-cv-btn"]');

    // Tunggu loading selesai (max 15 detik)
    await expect(page.getByTestId('cv-preview')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Backend Engineer')).toBeVisible();
  });

  test('3 — user bisa analisis ATS', async () => {
    // Ambil CV ID dari URL
    await page.waitForURL(/\/cv\/([a-z0-9-]+)/);
    const cvId = page.url().split('/cv/')[1];

    await page.goto(`/cv/${cvId}/ats`);
    await page.fill('[data-testid="jd-textarea"]', `
      We are looking for a Backend Engineer with experience in Node.js,
      PostgreSQL, Docker, and microservices. The candidate should have
      strong knowledge of REST API design and CI/CD pipelines.
    `);
    await page.click('[data-testid="analyze-btn"]');

    // Tunggu hasil ATS muncul (max 10 detik)
    await expect(page.getByTestId('ats-score')).toBeVisible({ timeout: 10_000 });

    const score = await page.getByTestId('ats-score').textContent();
    expect(Number(score)).toBeGreaterThan(0);
    expect(Number(score)).toBeLessThanOrEqual(100);
  });

  test('4 — user bisa download PDF', async () => {
    const cvId = page.url().split('/cv/')[1].split('/')[0];
    await page.goto(`/cv/${cvId}/optimize`);

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('[data-testid="download-pdf-btn"]'),
    ]);

    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });
});
```

---

## 6. Skill: Performance Test (k6)

```javascript
// k6/cv-generate.test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const aiResponseTime = new Trend('ai_response_time');
const errorRate = new Rate('error_rate');

export const options = {
  stages: [
    { duration: '1m', target: 10 },   // Ramp up ke 10 user
    { duration: '3m', target: 50 },   // Hold di 50 concurrent users
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<10000'],  // 95% request < 10 detik
    ai_response_time:  ['p(95)<10000'],  // AI spesifik
    error_rate:        ['rate<0.05'],    // Error rate < 5%
  },
};

export default function () {
  // Login dulu
  const loginRes = http.post(
    `${__ENV.BASE_URL}/api/auth/login`,
    JSON.stringify({ email: __ENV.TEST_EMAIL, password: __ENV.TEST_PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } },
  );

  check(loginRes, { 'login berhasil': (r) => r.status === 200 });
  const token = loginRes.json('data.access_token');

  // Generate CV
  const start = Date.now();
  const genRes = http.post(
    `${__ENV.BASE_URL}/api/cv/generate`,
    '{}',
    { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } },
  );
  aiResponseTime.add(Date.now() - start);

  const success = check(genRes, {
    'generate CV 201': (r) => r.status === 201,
    'response ada data': (r) => r.json('data.id') !== undefined,
  });

  errorRate.add(!success);
  sleep(2);
}
```

---

## 7. Skill: MSW Mock Server Setup

```typescript
// src/test/mocks/handlers.ts
import { http, HttpResponse } from 'msw';
import { mockCVList, mockATSResult } from './fixtures';

export const handlers = [
  http.get('/api/cv', () =>
    HttpResponse.json({ success: true, data: mockCVList })
  ),

  http.post('/api/cv/generate', () =>
    HttpResponse.json({ success: true, data: mockCVList[0] }, { status: 201 })
  ),

  http.post('/api/ats/analyze', () =>
    HttpResponse.json({ success: true, data: mockATSResult })
  ),

  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as any;
    if (body.password === 'wrong') {
      return HttpResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } },
        { status: 401 }
      );
    }
    return HttpResponse.json({
      success: true,
      data: { access_token: 'mock-token', user: { id: 'uuid', email: body.email } }
    });
  }),
];
```

```typescript
// src/test/mocks/fixtures.ts
export const mockCVList = [
  {
    id: 'cv-uuid-1',
    title: 'Backend Engineer CV',
    type: 'generated',
    status: 'draft',
    content: {
      summary: 'Experienced backend engineer...',
      experiences: [],
      educations: [],
      skills: { hard: ['Node.js'], soft: [], tools: [] },
    },
    created_at: '2026-04-01T10:00:00Z',
  },
];

export const mockATSResult = {
  id: 'ats-uuid-1',
  cv_id: 'cv-uuid-1',
  score: 72,
  matched_keywords: ['Node.js', 'PostgreSQL'],
  missing_keywords: ['TypeScript', 'CI/CD'],
  suggestions: [
    { section: 'skills', tip: 'Tambahkan TypeScript ke daftar skill' },
  ],
};
```
