# 🏗️ Architecture Document

## AI Job Getting System — System Architecture

**Version:** 1.0.0  
**Stack:** Next.js + NestJS + PostgreSQL + Redis + Docker

---

## 1. High-Level Architecture

```
                        ┌─────────────────────────────┐
                        │      CLIENT (Browser)        │
                        │    Next.js (App Router)      │
                        └──────────────┬──────────────┘
                                       │ HTTPS
                        ┌──────────────▼──────────────┐
                        │         Nginx               │
                        │  Reverse Proxy + SSL Term.  │
                        │  Rate Limiting (outer)      │
                        └──────┬───────────┬──────────┘
                               │           │
                 /             │           │ /api/*
              ┌────────────────▼┐         ┌▼────────────────┐
              │   Frontend       │         │   Backend        │
              │   Next.js        │         │   NestJS         │
              │   :3000          │         │   :4000          │
              └────────────────-┘         └────────┬─────────┘
                                                    │
                               ┌────────────────────┤
                               │                    │
                    ┌──────────▼──────┐   ┌─────────▼──────┐
                    │   PostgreSQL    │   │     Redis       │
                    │   :5432         │   │     :6379       │
                    └─────────────────┘   └────────────────-┘

                                    ┌──────────────────────┐
                                    │   Anthropic API      │
                                    │   (External)         │
                                    │   claude-sonnet      │
                                    └──────────────────────┘
                                           ▲
                                           │ HTTPS (from Backend only)
```

---

## 2. Infrastructure Layer

### Docker Compose Services

```yaml
services:
  nginx:       # Reverse proxy, SSL, rate limiting
  frontend:    # Next.js App Router
  backend:     # NestJS REST API
  postgres:    # Primary database
  redis:       # Cache, session, rate limiting store
```

### Network Rules
- `nginx` → expose port 80/443 ke luar
- `frontend` → hanya accessible dari nginx (tidak expose langsung)
- `backend` → hanya accessible dari nginx dan frontend (internal)
- `postgres` + `redis` → hanya accessible dari backend (fully internal)
- Anthropic API dipanggil dari backend saja, **tidak pernah dari frontend**

### Nginx Configuration
```nginx
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=general:10m rate=100r/m;
limit_req_zone $binary_remote_addr zone=ai_endpoints:10m rate=10r/m;

server {
  listen 443 ssl;

  location /api/cv/generate   { limit_req zone=ai_endpoints; proxy_pass http://backend; }
  location /api/cv/tailor     { limit_req zone=ai_endpoints; proxy_pass http://backend; }
  location /api/ats/analyze   { limit_req zone=ai_endpoints; proxy_pass http://backend; }
  location /api/               { limit_req zone=general;     proxy_pass http://backend; }
  location /                   { proxy_pass http://frontend; }
}
```

---

## 3. Backend Architecture (NestJS)

### Module Structure

```
src/
├── main.ts                     # Bootstrap + global pipes/filters
├── app.module.ts               # Root module
│
├── modules/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts  # POST /auth/register, /login, /refresh, /logout
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   └── refresh.strategy.ts
│   │   └── guards/
│   │       └── jwt.guard.ts
│   │
│   ├── profile/
│   │   ├── profile.module.ts
│   │   ├── profile.controller.ts   # GET/PUT /profile
│   │   ├── profile.service.ts
│   │   └── entities/
│   │       ├── profile.entity.ts
│   │       ├── education.entity.ts
│   │       ├── experience.entity.ts
│   │       └── skill.entity.ts
│   │
│   ├── cv/
│   │   ├── cv.module.ts
│   │   ├── cv.controller.ts        # CRUD + generate + tailor
│   │   ├── cv.service.ts
│   │   └── entities/
│   │       └── cv.entity.ts
│   │
│   ├── ats/
│   │   ├── ats.module.ts
│   │   ├── ats.controller.ts       # POST /ats/analyze
│   │   ├── ats.service.ts
│   │   └── entities/
│   │       └── ats-result.entity.ts
│   │
│   └── export/
│       ├── export.module.ts
│       ├── export.controller.ts    # GET /cv/:id/export/pdf
│       └── export.service.ts       # Puppeteer PDF generation
│
├── shared/
│   ├── ai/
│   │   ├── ai.module.ts
│   │   ├── ai.service.ts           # Anthropic API client wrapper
│   │   └── prompts/
│   │       ├── cv-generate.prompt.ts
│   │       ├── cv-tailor.prompt.ts
│   │       └── ats-analyze.prompt.ts
│   │
│   ├── redis/
│   │   └── redis.service.ts        # Cache operations
│   │
│   └── guards/
│       └── throttle.guard.ts
│
└── config/
    ├── database.config.ts
    ├── redis.config.ts
    └── app.config.ts
```

### Request Lifecycle

```
HTTP Request
     │
     ▼
[Nginx] → Rate Limiting → Proxy
     │
     ▼
[NestJS Global Middleware]
  - Helmet (security headers)
  - CORS
  - Request logging
     │
     ▼
[Guards]
  - JwtAuthGuard (verify token)
  - ThrottleGuard (per-user rate limit)
     │
     ▼
[Validation Pipe]
  - class-validator + class-transformer
  - Auto-sanitize input
     │
     ▼
[Controller] → [Service] → [Repository/DB]
                    │
                    ├── AI Service (if needed)
                    └── Redis Service (cache check first)
     │
     ▼
[Response Interceptor]
  - Standardize response format
  - Strip sensitive fields
     │
     ▼
JSON Response
```

### AI Service Design

```typescript
// Semua AI call melalui satu service untuk konsistensi
class AIService {
  async generateCV(profile: ProfileData): Promise<CVContent>
  async tailorCV(cv: CVContent, jobDescription: string): Promise<CVContent>
  async analyzeATS(cvText: string, jobDescription: string): Promise<ATSResult>
}

// Timeout: 30 detik per request
// Retry: 1x retry dengan exponential backoff
// Streaming: tersedia untuk generate dan tailor (SSE ke frontend)
```

### Caching Strategy

| Data | Cache Key | TTL | Strategy |
|------|-----------|-----|----------|
| User profile | `profile:{userId}` | 5 menit | Cache-aside |
| CV list | `cvs:{userId}` | 2 menit | Cache-aside, invalidate on write |
| ATS result | `ats:{cvId}:{jdHash}` | 30 menit | Cache-aside (JD yang sama tidak re-analyze) |
| Rate limit counters | `rl:{userId}:{endpoint}` | 15 menit | Redis INCR |

---

## 4. Frontend Architecture (Next.js)

### Directory Structure

```
app/
├── (public)/
│   ├── page.tsx                # Landing page
│   └── auth/
│       ├── login/page.tsx
│       └── register/page.tsx
│
├── (protected)/                # Layout dengan AuthGuard
│   ├── layout.tsx              # Check JWT, redirect if unauthenticated
│   ├── dashboard/page.tsx
│   ├── profile/page.tsx
│   ├── cv/
│   │   ├── new/page.tsx        # Generate CV
│   │   └── [id]/
│   │       ├── page.tsx        # CV detail + edit
│   │       ├── ats/page.tsx    # ATS analyzer
│   │       └── optimize/page.tsx  # CV tailoring + download
│   └── settings/page.tsx
│
components/
├── cv/
│   ├── CVPreview.tsx           # Render CV content (ATS-friendly format)
│   ├── CVEditor.tsx            # Inline editable CV
│   └── CVDiffView.tsx          # Show changes (original vs tailored)
│
├── ats/
│   ├── ATSScoreCard.tsx        # Donut chart score
│   ├── KeywordBadge.tsx        # Matched/missing keyword pill
│   └── SuggestionList.tsx      # Section-level suggestions
│
├── profile/
│   └── ProfileForm.tsx         # Multi-step form
│
└── ui/                         # Generic components (Button, Input, etc.)

lib/
├── api.ts                      # Axios instance + interceptors
├── auth.ts                     # JWT storage + refresh logic
└── hooks/
    ├── useCV.ts
    ├── useATS.ts
    └── useProfile.ts
```

### Auth Flow (Client-side)

```
User Login
    │
    ▼
POST /api/auth/login
    │
    ▼
Simpan access_token di memory (Zustand/Context)
Simpan refresh_token di httpOnly cookie
    │
    ▼
Axios interceptor: attach access_token ke setiap request
    │
    ▼
Jika 401 → auto-refresh via refresh_token
    │
    ├── Sukses → retry original request
    └── Gagal → redirect ke /auth/login
```

### State Management

- **Server state:** React Query (TanStack Query) — untuk semua data dari API
- **Client state:** Zustand — untuk auth state, current CV draft
- **Form state:** React Hook Form + Zod — semua form input

---

## 5. Data Flow — CV Generation

```
User klik "Generate CV"
         │
         ▼
[Frontend] POST /api/cv/generate
         │
         ▼
[AuthGuard] verify JWT
         │
         ▼
[ThrottleGuard] check rate limit (10 req/15min per user)
         │
         ▼
[CVController] → CVService.generateCV(userId)
         │
         ▼
[ProfileService] getProfile(userId)
  → check Redis cache
  → if miss: query PostgreSQL → set cache
         │
         ▼
[AIService] buildPrompt(profile) → call Anthropic API
  → claude-sonnet model
  → structured output: CV JSON
         │
         ▼
[CVService] save CV to PostgreSQL
  → invalidate cvs:{userId} cache
         │
         ▼
HTTP 201 → CV object
         │
         ▼
[Frontend] render CVPreview, enable inline edit
```

---

## 6. Data Flow — ATS Analysis

```
User paste JD, klik "Analyze"
         │
         ▼
POST /api/ats/analyze { cvId, jobDescription }
         │
         ▼
[ATSService]
  1. Hash JD → check Redis cache (ats:{cvId}:{jdHash})
  │
  ├── Cache HIT → return cached result (fast)
  │
  └── Cache MISS →
        2. Fetch CV plain_text dari DB
        3. AIService.analyzeATS(cvText, jd)
           → Extract keywords dari JD (rule-based + AI)
           → Match keywords vs CV
           → Score: (matched / total_keywords) * 100
           → Generate suggestions per section
        4. Save ats_result ke PostgreSQL
        5. Set Redis cache (TTL 30 menit)
        6. Return result
         │
         ▼
[Frontend] render ATSScoreCard + KeywordBadge + SuggestionList
```

---

## 7. Security Architecture

### Authentication Flow
```
Register: email + password → bcrypt hash (cost=12) → store in DB
Login:    verify hash → generate access_token (JWT, 15m) + refresh_token (UUID, 7d)
Refresh:  verify refresh_token → generate new access_token
Logout:   mark refresh_token as revoked in DB
```

### Security Headers (via Helmet)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security`
- `Content-Security-Policy`

### Input Validation
- Semua DTO menggunakan `class-validator`
- Job description dan CV content di-strip dari HTML tags
- Max payload size: 50KB (kecuali JD yang max 10KB)

---

## 8. Deployment Architecture

```
VPS (Ubuntu 22.04)
├── Docker Engine
├── docker-compose.yml
│   ├── nginx (exposed: 80, 443)
│   ├── frontend (internal: 3000)
│   ├── backend (internal: 4000)
│   ├── postgres (internal: 5432, volume: /data/postgres)
│   └── redis (internal: 6379, volume: /data/redis)
│
├── /etc/nginx/certs/          # SSL certificates (Let's Encrypt)
├── /data/postgres/            # Persistent DB volume
├── /data/redis/               # Persistent Redis volume
└── .env.production            # Secret injection
```

### Environment Variables

```bash
# App
NODE_ENV=production
APP_PORT=4000

# Database
DATABASE_URL=postgresql://user:pass@postgres:5432/aijobdb

# Redis
REDIS_URL=redis://redis:6379

# JWT
JWT_SECRET=<random-256-bit>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Anthropic
ANTHROPIC_API_KEY=<api-key>
ANTHROPIC_MODEL=claude-sonnet-4-20250514
```
