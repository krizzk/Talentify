# 🦴 Project Skeleton

## AI Job Getting System — Codebase Structure

**Version:** 1.0.0  
**Backend:** NestJS | **Frontend:** Next.js 14

---

## Repository Structure

```
ai-job-system/
├── apps/
│   ├── backend/                # NestJS application
│   └── frontend/               # Next.js application
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
└── README.md
```

---

## Backend Skeleton (`apps/backend/`)

```
apps/backend/
├── package.json
├── tsconfig.json
├── nest-cli.json
├── Dockerfile
│
└── src/
    ├── main.ts
    ├── app.module.ts
    │
    ├── config/
    │   ├── app.config.ts
    │   ├── database.config.ts
    │   └── redis.config.ts
    │
    ├── modules/
    │   ├── auth/
    │   │   ├── auth.module.ts
    │   │   ├── auth.controller.ts
    │   │   ├── auth.service.ts
    │   │   ├── dto/
    │   │   │   ├── register.dto.ts
    │   │   │   └── login.dto.ts
    │   │   ├── entities/
    │   │   │   └── refresh-token.entity.ts
    │   │   ├── guards/
    │   │   │   └── jwt-auth.guard.ts
    │   │   └── strategies/
    │   │       ├── jwt.strategy.ts
    │   │       └── refresh.strategy.ts
    │   │
    │   ├── users/
    │   │   ├── users.module.ts
    │   │   ├── users.service.ts
    │   │   └── entities/
    │   │       └── user.entity.ts
    │   │
    │   ├── profile/
    │   │   ├── profile.module.ts
    │   │   ├── profile.controller.ts
    │   │   ├── profile.service.ts
    │   │   ├── dto/
    │   │   │   └── upsert-profile.dto.ts
    │   │   └── entities/
    │   │       ├── profile.entity.ts
    │   │       ├── education.entity.ts
    │   │       ├── experience.entity.ts
    │   │       └── skill.entity.ts
    │   │
    │   ├── cv/
    │   │   ├── cv.module.ts
    │   │   ├── cv.controller.ts
    │   │   ├── cv.service.ts
    │   │   ├── dto/
    │   │   │   ├── create-cv.dto.ts
    │   │   │   ├── update-cv.dto.ts
    │   │   │   └── tailor-cv.dto.ts
    │   │   └── entities/
    │   │       └── cv.entity.ts
    │   │
    │   ├── ats/
    │   │   ├── ats.module.ts
    │   │   ├── ats.controller.ts
    │   │   ├── ats.service.ts
    │   │   ├── dto/
    │   │   │   └── analyze-ats.dto.ts
    │   │   └── entities/
    │   │       └── ats-result.entity.ts
    │   │
    │   └── export/
    │       ├── export.module.ts
    │       ├── export.controller.ts
    │       ├── export.service.ts
    │       └── templates/
    │           └── cv.template.html
    │
    └── shared/
        ├── ai/
        │   ├── ai.module.ts
        │   ├── ai.service.ts
        │   └── prompts/
        │       ├── cv-generate.prompt.ts
        │       ├── cv-tailor.prompt.ts
        │       └── ats-analyze.prompt.ts
        │
        ├── redis/
        │   ├── redis.module.ts
        │   └── redis.service.ts
        │
        ├── interceptors/
        │   └── response.interceptor.ts
        │
        ├── filters/
        │   └── http-exception.filter.ts
        │
        └── decorators/
            └── current-user.decorator.ts
```

---

## Backend File Contents

### `src/main.ts`
```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { ResponseInterceptor } from './shared/interceptors/response.interceptor';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.enableCors({ origin: process.env.FRONTEND_URL, credentials: true });
  app.setGlobalPrefix('api');

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  await app.listen(process.env.APP_PORT ?? 4000);
}
bootstrap();
```

### `src/modules/auth/auth.service.ts`
```typescript
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private redisService: RedisService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    // 1. Check email exists
    // 2. Hash password (bcrypt, cost=12)
    // 3. Create user
    // 4. Generate tokens
    // 5. Store refresh token hash in DB
    // 6. Return { access_token, refresh_token, user }
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    // 1. Find user by email
    // 2. Verify password
    // 3. Generate tokens
    // 4. Store refresh token hash
    // 5. Return tokens
  }

  async refresh(refreshToken: string): Promise<{ access_token: string }> {
    // 1. Find refresh token in DB
    // 2. Verify not expired or revoked
    // 3. Generate new access token
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    // Mark refresh token as revoked
  }

  private async generateTokens(userId: string) {
    // Return { access_token (JWT 15m), refresh_token (UUID 7d) }
  }
}
```

### `src/modules/cv/cv.service.ts`
```typescript
@Injectable()
export class CVService {
  constructor(
    @InjectRepository(CV) private cvRepo: Repository<CV>,
    private profileService: ProfileService,
    private aiService: AIService,
    private redisService: RedisService,
  ) {}

  async generate(userId: string): Promise<CV> {
    // 1. Get user profile (with cache)
    // 2. Build prompt from profile
    // 3. Call AIService.generateCV(profile)
    // 4. Save CV to DB (status: 'draft')
    // 5. Invalidate cvs:{userId} cache
    // 6. Return CV
  }

  async tailor(cvId: string, userId: string, dto: TailorCVDto): Promise<CV> {
    // 1. Fetch original CV
    // 2. Call AIService.tailorCV(cv.content, dto.jobDescription)
    // 3. Save as new CV (type: 'tailored', parent_cv_id: cvId)
    // 4. Return new CV
  }

  async findAll(userId: string): Promise<CV[]> {
    // Check cache → DB fallback
  }

  async findOne(id: string, userId: string): Promise<CV> { }

  async update(id: string, userId: string, dto: UpdateCVDto): Promise<CV> { }
}
```

### `src/modules/ats/ats.service.ts`
```typescript
@Injectable()
export class ATSService {
  constructor(
    private cvService: CVService,
    private aiService: AIService,
    private redisService: RedisService,
    @InjectRepository(ATSResult) private atsRepo: Repository<ATSResult>,
  ) {}

  async analyze(userId: string, dto: AnalyzeATSDto): Promise<ATSResult> {
    const { cvId, jobDescription } = dto;

    // 1. Hash JD for cache key
    const jdHash = this.hashJD(jobDescription);
    const cacheKey = `ats:${cvId}:${jdHash}`;

    // 2. Check cache
    const cached = await this.redisService.get(cacheKey);
    if (cached) return JSON.parse(cached);

    // 3. Fetch CV plain text
    const cv = await this.cvService.findOne(cvId, userId);

    // 4. AI analysis
    const result = await this.aiService.analyzeATS(cv.plain_text, jobDescription);

    // 5. Save to DB
    const atsResult = await this.atsRepo.save({ cvId, userId, ...result });

    // 6. Cache result (30 min TTL)
    await this.redisService.set(cacheKey, JSON.stringify(atsResult), 1800);

    return atsResult;
  }

  private hashJD(jd: string): string {
    // SHA-256 hash of normalized JD text
  }
}
```

### `src/shared/ai/ai.service.ts`
```typescript
@Injectable()
export class AIService {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async generateCV(profile: ProfileData): Promise<CVContent> {
    const prompt = buildCVGeneratePrompt(profile);
    const response = await this.callWithTimeout(prompt, 30000);
    return this.parseCVResponse(response);
  }

  async tailorCV(cvContent: CVContent, jobDescription: string): Promise<CVContent> {
    const prompt = buildCVTailorPrompt(cvContent, jobDescription);
    const response = await this.callWithTimeout(prompt, 30000);
    return this.parseCVResponse(response);
  }

  async analyzeATS(cvText: string, jobDescription: string): Promise<ATSAnalysis> {
    const prompt = buildATSAnalyzePrompt(cvText, jobDescription);
    const response = await this.callWithTimeout(prompt, 20000);
    return this.parseATSResponse(response);
  }

  private async callWithTimeout(prompt: string, timeoutMs: number): Promise<string> {
    // Anthropic API call with timeout + 1 retry
  }

  private parseCVResponse(raw: string): CVContent { }
  private parseATSResponse(raw: string): ATSAnalysis { }
}
```

---

## Frontend Skeleton (`apps/frontend/`)

```
apps/frontend/
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── Dockerfile
│
└── src/
    ├── app/
    │   ├── layout.tsx              # Root layout (fonts, providers)
    │   ├── page.tsx                # Landing page
    │   │
    │   ├── auth/
    │   │   ├── login/
    │   │   │   └── page.tsx
    │   │   └── register/
    │   │       └── page.tsx
    │   │
    │   └── (protected)/
    │       ├── layout.tsx          # Auth check wrapper
    │       ├── dashboard/
    │       │   └── page.tsx
    │       ├── profile/
    │       │   └── page.tsx
    │       ├── cv/
    │       │   ├── new/
    │       │   │   └── page.tsx    # Generate CV
    │       │   └── [id]/
    │       │       ├── page.tsx    # CV detail + edit
    │       │       ├── ats/
    │       │       │   └── page.tsx
    │       │       └── optimize/
    │       │           └── page.tsx
    │       └── settings/
    │           └── page.tsx
    │
    ├── components/
    │   ├── cv/
    │   │   ├── CVPreview.tsx
    │   │   ├── CVEditor.tsx
    │   │   └── CVDiffView.tsx
    │   ├── ats/
    │   │   ├── ATSScoreCard.tsx
    │   │   ├── KeywordBadge.tsx
    │   │   └── SuggestionList.tsx
    │   ├── profile/
    │   │   └── ProfileForm.tsx
    │   └── ui/
    │       ├── Button.tsx
    │       ├── Input.tsx
    │       ├── Card.tsx
    │       ├── Badge.tsx
    │       └── LoadingSkeleton.tsx
    │
    ├── lib/
    │   ├── api.ts                  # Axios instance
    │   ├── auth.ts                 # Token management
    │   └── utils.ts
    │
    ├── hooks/
    │   ├── useCV.ts
    │   ├── useATS.ts
    │   └── useProfile.ts
    │
    ├── store/
    │   └── auth.store.ts           # Zustand auth state
    │
    └── types/
        ├── cv.types.ts
        ├── ats.types.ts
        └── profile.types.ts
```

---

## Frontend File Contents

### `src/lib/api.ts`
```typescript
import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? '/api',
  withCredentials: true,
});

// Request interceptor: attach access token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      // Attempt token refresh
      // On success: retry original request
      // On fail: redirect to /auth/login
    }
    return Promise.reject(error);
  }
);

export default api;
```

### `src/store/auth.store.ts`
```typescript
import { create } from 'zustand';

interface AuthState {
  accessToken: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  setAuth: (accessToken, user) => set({ accessToken, user }),
  clearAuth: () => set({ accessToken: null, user: null }),
}));
```

### `src/hooks/useCV.ts`
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export function useCVList() {
  return useQuery({
    queryKey: ['cvs'],
    queryFn: () => api.get('/cv').then(r => r.data),
  });
}

export function useGenerateCV() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/cv/generate').then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cvs'] }),
  });
}

export function useTailorCV(cvId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (jobDescription: string) =>
      api.post(`/cv/${cvId}/tailor`, { jobDescription }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cvs'] }),
  });
}
```

### `src/app/(protected)/layout.tsx`
```typescript
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const hasRefreshToken = cookieStore.has('refresh_token');

  if (!hasRefreshToken) {
    redirect('/auth/login');
  }

  return <>{children}</>;
}
```

---

## Docker Compose

### `docker-compose.yml`
```yaml
version: '3.9'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/certs:/etc/nginx/certs
    depends_on:
      - frontend
      - backend

  frontend:
    build:
      context: ./apps/frontend
      dockerfile: Dockerfile
    environment:
      - NEXT_PUBLIC_API_URL=/api
    depends_on:
      - backend

  backend:
    build:
      context: ./apps/backend
      dockerfile: Dockerfile
    environment:
      - DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@postgres:5432/aijobdb
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: aijobdb
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

---

## Database Migration Skeleton

```sql
-- migrations/001_init.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE user_plan AS ENUM ('free', 'premium');
CREATE TYPE skill_category AS ENUM ('hard', 'soft', 'language', 'tool');
CREATE TYPE skill_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE cv_type AS ENUM ('generated', 'tailored');
CREATE TYPE cv_status AS ENUM ('draft', 'finalized');

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(255) NOT NULL,
  plan          user_plan DEFAULT 'free',
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  target_role   VARCHAR(255),
  phone         VARCHAR(50),
  location      VARCHAR(255),
  linkedin_url  VARCHAR(500),
  portfolio_url VARCHAR(500),
  summary       TEXT,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE educations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  institution VARCHAR(255) NOT NULL,
  degree      VARCHAR(100),
  major       VARCHAR(255),
  gpa         DECIMAL(3,2),
  start_year  INT,
  end_year    INT,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE experiences (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  company     VARCHAR(255) NOT NULL,
  position    VARCHAR(255) NOT NULL,
  start_date  DATE NOT NULL,
  end_date    DATE,
  is_current  BOOLEAN DEFAULT false,
  description TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE skills (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  category    skill_category NOT NULL,
  level       skill_level,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE cvs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  title        VARCHAR(255) NOT NULL,
  content      JSONB NOT NULL,
  plain_text   TEXT,
  type         cv_type NOT NULL DEFAULT 'generated',
  parent_cv_id UUID REFERENCES cvs(id),
  status       cv_status DEFAULT 'draft',
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ats_results (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_id             UUID REFERENCES cvs(id) ON DELETE CASCADE,
  user_id           UUID REFERENCES users(id),
  job_description   TEXT NOT NULL,
  job_title         VARCHAR(255),
  company_name      VARCHAR(255),
  score             INT CHECK (score >= 0 AND score <= 100),
  matched_keywords  JSONB,
  missing_keywords  JSONB,
  suggestions       JSONB,
  created_at        TIMESTAMP DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) NOT NULL,
  expires_at  TIMESTAMP NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW(),
  revoked_at  TIMESTAMP
);
```
