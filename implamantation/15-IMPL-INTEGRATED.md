# 📋 IMPLEMENTATION ROADMAP — Integrated Phase-Based (Single Engineer)

## AI Job Getting System — MVP Unified Roadmap

**Version:** 2.0.0 (Single Engineer Edition)  
**Timeline:** 5 minggu (Phase 0 → Phase 10)  
**Go-Live:** 30 April 2026  
**Role Model:** Cross-role per phase (Infra + Backend + Frontend + QA executed sequentially within each phase)  
**Stack:** Docker · NestJS · Next.js · PostgreSQL · Redis · Anthropic Claude API

---

## 🎯 Execution Model

**Phase-based, cross-role, sequential:**
- ✅ **One engineer** handles infra + backend + frontend + qa
- ✅ **Per-phase tasks** = infra setup (if needed) → backend implementation → frontend implementation → qa validation
- ✅ **Sequential phases** = Phase 0 → Phase 1 → Phase 2, etc. No skipping
- ✅ **Within-phase parallelization** = backend + frontend can be done together, but audit first
- ✅ **Validation per phase** = Must pass checklist before advancing

**Timeline Overview:**
```
Week 1          Week 2          Week 3          Week 4          Week 5
├─ Phase 0      ├─ Phase 3      ├─ Phase 6      ├─ Phase 8      ├─ Phase 10
│  Audit        │  Core Setup   │  ATS Module   │  PDF Export   │  Go-Live
├─ Phase 1      ├─ Phase 4      ├─ Phase 7      ├─ Phase 9
│  Infra Ready  │  CV Generator │  AI Service   │  Monetization
├─ Phase 2
│  Auth Setup
```

---

## PHASE 0 — PROJECT AUDIT (Mandatory First)

**Duration:** ~2 hours  
**Role:** Auditor (you)  
**Deliverable:** `PROJECT-AUDIT.md` with blockers list + current state matrix

### Tasks

#### 0.1 — Scan Project Structure & Code Status

**Infra/Config:**
- [ ] Check `docker-compose.yml` — exists, validated format
- [ ] Check `.env.example` — all required vars documented
- [ ] Check Dockerfile (backend & frontend) — exists, multi-stage
- [ ] Check nginx config — exists, ready for SSL
- [ ] Check scripts/ directory — init.sql, utility scripts present

**Backend Code:**
- [ ] Check `backend/package.json` — dependencies installed
- [ ] Check `backend/src/main.ts` — global setup present (pipes, guards, CORS)
- [ ] Check `backend/src/config/` — app, database, redis, env validation
- [ ] Check existing modules: count which ones are stubbed vs. complete
  - [ ] auth module
  - [ ] profile module
  - [ ] cv module
  - [ ] ats module
  - [ ] export module
- [ ] Check `backend/src/shared/` — decorators, filters, guards, interceptors status
- [ ] Check database migrations — how many exist, last date

**Frontend Code:**
- [ ] Check `frontend/package.json` — dependencies installed
- [ ] Check `frontend/next.config.ts` — configured for Docker
- [ ] Check `frontend/src/app/` — pages structure (public, protected routes)
- [ ] Check `frontend/src/components/` — component modules created
- [ ] Check `frontend/src/lib/api.ts` — API client configured
- [ ] Check `frontend/src/store/` — auth store (Zustand) implemented
- [ ] Check `frontend/src/hooks/` — custom hooks count

**QA/Testing:**
- [ ] Check test setup files — jest, vitest config present
- [ ] Check test coverage baseline — any existing tests
- [ ] Check MSW setup (frontend) — for mocking API in tests

#### 0.2 — Identify Critical Blockers

**Database Blockers:**
- [ ] PostgreSQL service can start: `docker compose up postgres`
- [ ] Initial schema migration runs without error
- [ ] Seed data (if any) loads successfully

**Backend Blockers:**
- [ ] NestJS app starts: `npm run start:dev` in backend folder
- [ ] Health check endpoint `/health` responds 200
- [ ] Cannot use `synchronize: true` in production config
- [ ] All env vars from `.env.example` are validated

**Frontend Blockers:**
- [ ] Next.js app builds: `npm run build` in frontend folder
- [ ] Next.js app runs: `npm run dev`
- [ ] API client can reach backend (configure API_URL correctly)
- [ ] TypeScript compiles without errors

**Infra Blockers:**
- [ ] Docker Compose v2+ installed locally
- [ ] All services can start: `docker compose up -d`
- [ ] No port conflicts on 3000, 4000, 5432, 6379
- [ ] Nginx config valid syntax: `docker compose exec nginx nginx -t`

#### 0.3 — Generate Audit Report

Create `PROJECT-AUDIT.md` with following sections:

**Section 1: Current Code Status**
```markdown
| Layer | Component | Status | Notes |
|-------|-----------|--------|-------|
| Infra | docker-compose.yml | ✅ Complete | [ready/needs-work] |
| Infra | .env.example | ✅ Complete | all vars documented |
| Infra | nginx.conf | ✅ Complete | SSL ready |
| Backend | main.ts | ✅ Complete | pipes, guards, CORS setup |
| Backend | auth module | ⚠️ Partial | entities done, service needs JWT |
| Backend | profile module | ⚠️ Partial | DTOs + controller, service missing |
| ... | ... | ... | ... |
```

**Section 2: Dependencies Baseline**
- Backend: List all npm packages installed (run: `npm list --depth=0`)
- Frontend: List all npm packages installed (run: `npm list --depth=0`)
- Mark any missing critical deps

**Section 3: Critical Blockers (Priority Order)**
```markdown
**BLOCKER 1 (HIGH):** [Description]
- Impact: blocks Phase X
- Solution: [action]
- Status: pending/fixed

**BLOCKER 2 (MEDIUM):** ...
```

**Section 4: Test Coverage Baseline**
- Backend unit test coverage: X%
- Frontend unit test coverage: X%
- E2E test count: X test scenarios

**Section 5: Go-Live Readiness**
- [ ] All Phase 0 blockers resolved
- [ ] Ready to proceed to Phase 1 (Infra + Auth)

### Validation Checklist (Phase 0)

- ✅ `PROJECT-AUDIT.md` created with all sections filled
- ✅ All critical blockers identified and ranked
- ✅ Current code status matrix complete
- ✅ No Phase 0 blockers remain

---

## PHASE 1 — Infrastructure & Auth Foundation (Week 1)

**Duration:** ~4-5 hours  
**Cross-role:** Infra setup + Auth backend + Auth frontend + Auth tests  
**Goal:** Project runs locally in one command, auth flow works

### Tasks

#### **1.1 [INFRA]** — Verify Docker Compose & Environment

**Tasks:**
- [ ] Validate `docker-compose.yml` (local dev version)
  - [ ] All services defined: postgres, redis, backend, frontend, nginx
  - [ ] Networks configured correctly
  - [ ] Volumes mounted for dev hot-reload
  - [ ] Ports exposed: 3000 (frontend), 4000 (backend), 5432 (postgres), 6379 (redis)
- [ ] Validate `.env.example`
  - [ ] All vars documented with descriptions
  - [ ] No hardcoded secrets in examples
  - [ ] Default values appropriate for local dev
- [ ] Test: `docker compose up -d` → all services running
- [ ] Test: `docker compose logs backend` → no startup errors
- [ ] Test: Health check `/api/health` → returns 200

**Verification:**
```bash
docker compose up -d
# Wait 5 seconds
curl http://localhost:4000/api/health
# Expected: { "success": true, "data": { "status": "ok" } }
```

#### **1.2 [INFRA]** — Database Initial Schema & Migration

**Tasks:**
- [ ] Verify initial migration file exists: `backend/src/migrations/1776318789976-InitialSchema.ts`
  - [ ] Creates `users` table with columns: id, email, password_hash, full_name, plan, created_at, updated_at
  - [ ] Creates `refresh_tokens` table with columns: id, user_id, token_hash, expires_at, revoked_at, created_at
  - [ ] Creates other base entities: profiles, educations, experiences, skills, cvs, ats_results
  - [ ] All tables have proper indexes on user_id, created_at
- [ ] Run migration: `npm run migration:run` in backend
- [ ] Verify tables exist: `docker compose exec postgres psql -U postgres -d aijobdb -c "\dt"`

**Verification:**
```bash
npm run migration:show
# Expected: shows Initial migration as EXECUTED
```

#### **1.3 [BACKEND]** — Auth Module Setup

**Tasks:**
- [ ] Auth module structure complete:
  ```
  backend/src/modules/auth/
  ├── auth.module.ts
  ├── auth.controller.ts
  ├── auth.service.ts
  ├── jwt.strategy.ts
  ├── dto/
  │   ├── register.dto.ts
  │   ├── login.dto.ts
  │   └── refresh.dto.ts
  └── entities/
      └── (none — uses users from shared)
  ```
- [ ] `auth.service.ts` implements:
  - [ ] `register(email, password, fullName)` → hash password, create user, return user + tokens
  - [ ] `login(email, password)` → verify password, return user + tokens
  - [ ] `refresh(refreshToken)` → validate token, generate new access token
  - [ ] `logout(userId, refreshToken)` → mark refresh token as revoked
  - [ ] All methods call `UsersService` to manage users
- [ ] `auth.controller.ts` implements:
  - [ ] POST `/api/auth/register` → validate DTO, call service, return response
  - [ ] POST `/api/auth/login` → validate DTO, call service, return response
  - [ ] POST `/api/auth/refresh` → validate DTO, call service, return response
  - [ ] POST `/api/auth/logout` → @UseGuards(JwtAuthGuard), call service
- [ ] JWT strategy configured:
  - [ ] `JwtStrategy` extracts token from `Authorization: Bearer ...` header
  - [ ] Validates token using `JWT_SECRET` env var
  - [ ] Returns user info (id, email, full_name) in `req.user`
- [ ] Error handling:
  - [ ] `VALIDATION_ERROR` for invalid input
  - [ ] `UNAUTHORIZED` for wrong password / invalid token
  - [ ] `NOT_FOUND` for user not exists during login
  - [ ] `RATE_LIMIT_EXCEEDED` for too many failed attempts (optional but good)

**Verification:**
```bash
# In backend folder
npm run start:dev

# In another terminal, test endpoints
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123","full_name":"Test User"}'

# Expected: { "success": true, "data": { "id": "uuid", "email": "test@test.com", "access_token": "jwt...", "refresh_token": "jwt..." } }

curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'

# Expected: same as above
```

#### **1.4 [FRONTEND]** — Auth Pages & Flow

**Tasks:**
- [ ] Pages created:
  ```
  frontend/src/app/
  ├── (public)/
  │   ├── layout.tsx
  │   ├── register/
  │   │   └── page.tsx
  │   └── login/
  │       └── page.tsx
  ├── (protected)/
  │   ├── layout.tsx → redirect to login if no token
  │   └── dashboard/
  │       └── page.tsx
  └── api/
      └── auth/
          └── route.ts → callback for Google OAuth (stub for now)
  ```
- [ ] Components created:
  ```
  frontend/src/components/
  ├── auth/
  │   ├── RegisterForm.tsx → 'use client', form with React Hook Form + Zod
  │   ├── LoginForm.tsx → 'use client', form with React Hook Form + Zod
  │   └── LogoutButton.tsx → 'use client'
  └── layout/
      └── Navbar.tsx → shows user email + logout button
  ```
- [ ] Zustand store configured: `frontend/src/store/auth.store.ts`
  - [ ] Stores: `accessToken`, `refreshToken`, `user` (id, email, full_name)
  - [ ] Methods: `setAuth()`, `logout()`, `refresh()`
  - [ ] Persist to `sessionStorage` (NOT `localStorage`)
- [ ] API integration:
  - [ ] `useRegister()` hook → calls POST `/api/auth/register`, stores token + user
  - [ ] `useLogin()` hook → calls POST `/api/auth/login`, stores token + user
  - [ ] `useLogout()` hook → calls POST `/api/auth/logout`, clears store
  - [ ] Redirect to dashboard after successful login
  - [ ] Redirect to login if token expires
- [ ] Error handling:
  - [ ] Show error toast for validation failures
  - [ ] Show error toast for network errors
  - [ ] Disable submit button while loading

**Verification:**
```bash
# In frontend folder
npm run dev

# Open http://localhost:3000 → redirects to /login
# Register test account
# Login with created account
# Should see dashboard with user email in navbar
```

#### **1.5 [QA]** — Auth Unit Tests (Backend)

**Tasks:**
- [ ] Test file: `backend/src/modules/auth/auth.service.spec.ts`
  - [ ] `register` happy path: creates user, hashes password, returns tokens
  - [ ] `register` error: duplicate email throws `ConflictException`
  - [ ] `register` error: weak password throws `ValidationException`
  - [ ] `login` happy path: returns tokens for valid credentials
  - [ ] `login` error: wrong password throws `UnauthorizedException`
  - [ ] `login` error: user not found throws `NotFoundException`
  - [ ] `refresh` happy path: returns new access token
  - [ ] `refresh` error: invalid token throws `UnauthorizedException`
- [ ] Test file: `backend/src/modules/auth/auth.controller.spec.ts`
  - [ ] POST `/api/auth/register` returns 201 with tokens
  - [ ] POST `/api/auth/login` returns 200 with tokens
  - [ ] POST `/api/auth/refresh` returns 200 with new token
  - [ ] POST `/api/auth/logout` requires @UseGuards(JwtAuthGuard)

**Coverage Target:** 80% statements

**Verification:**
```bash
npm test -- auth.service.spec.ts --coverage
# Expected: >80% coverage on auth.service.ts
```

#### **1.6 [QA]** — Auth Integration Test (Full Flow)

**Tasks:**
- [ ] E2E test file: `backend/test/auth.e2e-spec.ts`
  - [ ] Full registration → login → refresh → logout flow
  - [ ] Token validation at protected endpoints
  - [ ] Error cases: invalid input, duplicate email, wrong password

**Verification:**
```bash
npm run test:e2e -- auth.e2e-spec.ts
# Expected: all tests pass
```

### Validation Checklist (Phase 1)

- ✅ Docker Compose health check passes
- ✅ Database migrations run successfully
- ✅ Auth endpoints (register, login, refresh, logout) work
- ✅ Frontend auth pages display correctly
- ✅ Full auth flow works: register → login → dashboard
- ✅ Auth unit tests >80% coverage
- ✅ Auth integration tests pass
- ✅ No phase 1 blockers remain

---

## PHASE 2 — User Profile Module (Week 1–2)

**Duration:** ~3-4 hours  
**Cross-role:** Backend profile module + Frontend profile form + Tests  
**Goal:** Users can input & save their profile data

### Tasks

#### **2.1 [BACKEND]** — Profile Entity & Service

**Tasks:**
- [ ] Profile entity: `backend/src/modules/profile/entities/profile.entity.ts`
  - Columns: id, user_id (FK), target_role, phone, location, summary, created_at, updated_at
- [ ] Profile DTO: `backend/src/modules/profile/dto/upsert-profile.dto.ts`
  - Fields: target_role, phone, location, summary (all optional for partial updates)
- [ ] Profile service with methods:
  - [ ] `getProfile(userId)` → returns cached profile or fetch from DB
  - [ ] `upsertProfile(userId, dto)` → create/update profile, invalidate cache
- [ ] Profile controller:
  - [ ] GET `/api/profile` → returns user's profile (protected)
  - [ ] PUT `/api/profile` → updates profile (protected)

#### **2.2 [FRONTEND]** — Profile Page & Form

**Tasks:**
- [ ] Page: `frontend/src/app/(protected)/profile/page.tsx`
- [ ] Component: `frontend/src/components/profile/ProfileForm.tsx` (client component)
  - [ ] Form fields: target_role, phone, location, summary
  - [ ] React Hook Form + Zod validation
  - [ ] Fetch current profile on mount
  - [ ] Save on submit
  - [ ] Show loading state while saving

#### **2.3 [QA]** — Profile Tests

**Tasks:**
- [ ] Backend unit tests for profile service (80% coverage)
- [ ] Frontend component test for ProfileForm
- [ ] Verify profile data persists across page reload

---

## PHASE 3 — CV Generator Module (Week 2)

**Duration:** ~5-6 hours  
**Cross-role:** Backend CV module + AI service integration + Frontend CV page  
**Goal:** Users can generate CV from profile using AI

### Tasks

#### **3.1 [BACKEND]** — CV Module & AI Service

**Tasks:**
- [ ] CV entity with all fields from ERD
- [ ] AIService in `backend/src/shared/ai/ai.service.ts`
  - [ ] Calls Anthropic Claude API
  - [ ] Timeout 30s with AbortController
  - [ ] Retry with exponential backoff
  - [ ] Rate limiting (10 req / 15 min per user)
- [ ] CV service: `generate()` method
  - [ ] Fetches user profile
  - [ ] Calls AIService with profile data
  - [ ] Validates AI output (structure, length)
  - [ ] Saves CV to DB
  - [ ] Returns generated CV
- [ ] CV controller: POST `/api/cv/generate` → calls service

#### **3.2 [FRONTEND]** — CV Generator Page

**Tasks:**
- [ ] Page: `frontend/src/app/(protected)/cv/generate/page.tsx`
- [ ] Component: `frontend/src/components/cv/GenerateCVClient.tsx`
  - [ ] Show user profile summary
  - [ ] "Generate CV" button with loading state
  - [ ] Show generated CV in preview
  - [ ] "Save" and "Edit" options
- [ ] Hook: `useGenerateCV()` → calls backend, handles loading + error

#### **3.3 [QA]** — Tests

**Tasks:**
- [ ] Backend tests for CV generation (mock AI service)
- [ ] Frontend tests for GenerateCVClient component
- [ ] E2E: full flow register → profile → generate CV

---

## PHASE 4 — ATS Analyzer Module (Week 3)

**Duration:** ~5-6 hours  
**Cross-role:** Backend ATS module + AI scoring + Frontend ATS page  
**Goal:** Users can analyze CV against job description

### Tasks

#### **4.1 [BACKEND]** — ATS Module

**Tasks:**
- [ ] ATS Result entity
- [ ] ATS service: `analyze(cvId, jobDescription)`
  - [ ] Fetches CV from DB
  - [ ] Parses CV + JD using AI
  - [ ] Scores compatibility (0-100)
  - [ ] Extracts matched + missing keywords
  - [ ] Caches results for 30 min
- [ ] ATS controller: POST `/api/ats/analyze` → returns score + analysis

#### **4.2 [FRONTEND]** — ATS Analyzer Page

**Tasks:**
- [ ] Page: `frontend/src/app/(protected)/ats/analyze/page.tsx`
- [ ] Component: `frontend/src/components/ats/ATSAnalyzer.tsx`
  - [ ] Form: paste job description
  - [ ] Select CV to analyze
  - [ ] Show ATS score with color (green >70, yellow 50-70, red <50)
  - [ ] List matched + missing keywords

#### **4.3 [QA]** — Tests

---

## PHASE 5 — CV Tailoring Module (Week 3)

**Duration:** ~4-5 hours  
**Cross-role:** Backend tailoring + AI rewrite + Frontend UI  
**Goal:** Users can optimize CV for specific job description

### Tasks

#### **5.1 [BACKEND]** — Tailoring Service

**Tasks:**
- [ ] CV service: `tailor(cvId, jobDescription)`
  - [ ] Fetches CV + profile
  - [ ] Calls AI to rewrite CV for specific JD
  - [ ] Validates output
  - [ ] Creates new CV with type = 'tailored'
- [ ] Controller: POST `/api/cv/:id/tailor` → returns tailored CV

#### **5.2 [FRONTEND]** — Tailoring UI

**Tasks:**
- [ ] Page: `frontend/src/app/(protected)/cv/tailor/page.tsx`
- [ ] Component shows:
  - [ ] Original CV side-by-side with tailored CV
  - [ ] Diff highlighting changes
  - [ ] Save tailored CV

#### **5.3 [QA]** — Tests

---

## PHASE 6 — PDF Export Module (Week 4)

**Duration:** ~3-4 hours  
**Cross-role:** Backend PDF generation + Frontend download  
**Goal:** Users can download CV as PDF

### Tasks

#### **6.1 [BACKEND]** — PDF Generation

**Tasks:**
- [ ] PDF service using Puppeteer
  - [ ] Converts CV HTML to PDF
  - [ ] Styling included (fonts, colors, layout)
  - [ ] 30s timeout
- [ ] CV controller: GET `/api/cv/:id/export/pdf` → returns PDF file

#### **6.2 [FRONTEND]** — Download Button

**Tasks:**
- [ ] "Download PDF" button in CV preview
- [ ] Calls backend endpoint
- [ ] Browser downloads file as `cv-{name}-{date}.pdf`

#### **6.3 [QA]** — Tests

---

## PHASE 7 — CV History & Management (Week 4)

**Duration:** ~3-4 hours  
**Cross-role:** Backend CRUD endpoints + Frontend list/edit/delete  
**Goal:** Users can manage multiple CVs

### Tasks

#### **7.1 [BACKEND]** — CV CRUD

**Tasks:**
- [ ] GET `/api/cv` → list user's CVs
- [ ] GET `/api/cv/:id` → get specific CV
- [ ] PUT `/api/cv/:id` → update CV title/content
- [ ] DELETE `/api/cv/:id` → delete CV

#### **7.2 [FRONTEND]** — CV Management

**Tasks:**
- [ ] Page: `frontend/src/app/(protected)/cv/list/page.tsx`
- [ ] Table showing: title, type (generated/tailored), created_at, actions (view, edit, download, delete)
- [ ] Can rename, delete CVs

#### **7.3 [QA]** — Tests

---

## PHASE 8 — Monetization & Rate Limiting (Week 4–5)

**Duration:** ~3-4 hours  
**Cross-role:** Backend billing logic + Frontend tier selection  
**Goal:** Implement free vs. premium tiers

### Tasks

#### **8.1 [BACKEND]** — User Plan & Rate Limiting

**Tasks:**
- [ ] Users table: add `plan` column (free / premium)
- [ ] Implement rate limiting at endpoint level
  - [ ] AI endpoints: 10 req / 15 min per user (free: 1/day, premium: unlimited)
  - [ ] Auth endpoints: 10 req / 15 min per IP
- [ ] Plan upgrade endpoint: POST `/api/users/plan` → updates plan

#### **8.2 [FRONTEND]** — Plan UI

**Tasks:**
- [ ] Dashboard shows current plan
- [ ] "Upgrade" button redirects to payment (stub for now)

#### **8.3 [QA]** — Tests

---

## PHASE 9 — Error Handling & Hardening (Week 5)

**Duration:** ~3-4 hours  
**Cross-role:** Comprehensive error handling + logging + validation  
**Goal:** Production-ready error handling

### Tasks

#### **9.1 [BACKEND]** — Global Error Handling

**Tasks:**
- [ ] Global HTTP exception filter — catches all errors, formats response
- [ ] Global validation pipe — validates all inputs
- [ ] Error codes standardized (VALIDATION_ERROR, UNAUTHORIZED, etc.)
- [ ] Logging for all errors (Logger, not console.log)
- [ ] No stack traces in response

#### **9.2 [FRONTEND]** — Error UI

**Tasks:**
- [ ] Error boundaries for components
- [ ] Toast notifications for all errors
- [ ] Graceful error states in forms
- [ ] Retry logic for failed requests

#### **9.3 [QA]** — Error Tests

---

## PHASE 10 — Comprehensive QA & Go-Live (Week 5)

**Duration:** ~4-5 hours  
**Role:** QA focused  
**Goal:** Full test coverage, production readiness

### Tasks

#### **10.1 [QA]** — Unit Test Coverage

**Tasks:**
- [ ] Backend: all services >80% coverage
- [ ] Frontend: all hooks + critical components >70% coverage

#### **10.2 [QA]** — Integration Tests

**Tasks:**
- [ ] All endpoints tested with real DB
- [ ] Auth flow + protected routes
- [ ] CV generation + tailoring
- [ ] ATS analysis
- [ ] PDF export

#### **10.3 [QA]** — E2E Tests (Playwright)

**Tasks:**
- [ ] User registration → login → profile fill → CV generate → ATS analyze → PDF export
- [ ] Error cases: wrong password, invalid input, network error
- [ ] Cross-browser: Chrome, Firefox, Safari

#### **10.4 [QA]** — Performance Tests (k6)

**Tasks:**
- [ ] Load test: 100 concurrent users
- [ ] AI endpoint: <10s response
- [ ] Non-AI endpoints: <500ms
- [ ] Database queries: analyze slow queries

#### **10.5 [QA]** — Manual Smoke Test

**Tasks:**
- [ ] Test in all browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test on mobile (iOS Safari, Android Chrome)
- [ ] Network throttling: slow 3G, offline handling

#### **10.6 [INFRA]** — Production Deployment Prep

**Tasks:**
- [ ] SSL certificate ready
- [ ] Environment variables configured
- [ ] Database backups configured
- [ ] Monitoring + alerting set up (optional but recommended)
- [ ] Docker images built and tagged

#### **10.7 — GO-LIVE CHECKLIST**

**BACKEND:**
- ✅ All endpoints per API contract
- ✅ Response format: `{ "success": true, "data": ... }`
- ✅ No console.log, use Logger
- ✅ No stack traces in errors
- ✅ Rate limiting active
- ✅ CORS configured
- ✅ Unit tests >80%
- ✅ Integration tests pass

**FRONTEND:**
- ✅ All pages responsive
- ✅ Dark mode (if applicable)
- ✅ Loading + error states
- ✅ Lighthouse score >90
- ✅ Build succeeds
- ✅ No console errors
- ✅ Unit tests >80%

**INFRA:**
- ✅ Docker Compose up successfully
- ✅ All services healthy
- ✅ Database migrations pass
- ✅ Nginx SSL working
- ✅ Health check endpoints return 200

**QA:**
- ✅ All E2E tests pass
- ✅ Performance tests OK
- ✅ Manual smoke test pass
- ✅ No known blockers

---

## 📊 Tracking Template (for PROJECT-AUDIT.md)

Copy this table to PROJECT-AUDIT.md and update as phases complete:

```markdown
| Phase | Status | Tasks Completed | Blockers | Notes |
|-------|--------|-----------------|----------|-------|
| 0 | ⏳ In Progress | 4/6 | None | Audit ongoing |
| 1 | ⏳ Not Started | 0/6 | Database schema | Awaiting Phase 0 completion |
| 2 | ⏳ Not Started | 0/3 | — | — |
| ... | ... | ... | ... | ... |
| 10 | 🔴 Not Started | 0/7 | — | Final QA & go-live |
```

---

## 📝 Notes

- **Each phase** has clear deliverables and verification steps
- **Cross-role within phase** = backend + frontend work in parallel, then test together
- **Test early and often** = unit tests per phase, integration tests per phase, E2E at end
- **No loncat** = must complete Phase 0 before Phase 1, etc.
- **Blocking issues** = document in PROJECT-AUDIT.md and resolve before advancing

---

**Reference:** See `00-AGENT-CONTEXT.md` for detailed execution rules and constraints
