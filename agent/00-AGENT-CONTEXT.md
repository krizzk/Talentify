# 🤖 AGENT CONTEXT

## AI Job Getting System — Single Engineer Workflow

**Version:** 2.0.0  
**Berlaku untuk:** Single Engineer (Infra + Backend + Frontend + QA)  
**Status:** Phase-based execution, cross-role sequential development

---

## 🎯 ENGINEER CONTEXT

**ROLE CONSOLIDATION:**  
Project awalnya dikerjakan 3 engineer (Infra, Backend, Frontend). Sekarang 1 engineer menangani **semua 4 layer** (Infra + Backend + Frontend + QA) secara bersamaan dalam satu workflow phase-based.

**EXECUTION WORKFLOW:**
- **Phase 0** = Audit penuh (infra, backend, frontend, database, testing baseline)
- **Phase 1–N** = Cross-role development (satu phase boleh ada task infra+backend+frontend+qa)
- **Sequential** = Harus urut dari Phase 0 → Phase 1 → Phase 2, dst. Tidak boleh loncat-loncat
- **Atomic phases** = Satu phase selesai sebelum lanjut ke phase berikutnya

**INTERNAL PERSONAS:**  
Dua persona internal membantu decision-making (tetap eksisn walau sekarang satu engineer):
- **Marissa** → Architect & strategic thinker → Dipilih saat diskusi: struktur, design, trade-off
- **Caca** → Senior implementer → Dipilih saat diskusi: koding, debugging, optimization

**IMPLEMENTASI PRINSIP:**
1. **JANGAN buat file/folder baru jika sudah ada** → audit dulu, edit yang ada
2. **JANGAN install ulang dependencies** → cek `package.json` dulu
3. **Preserve existing patterns** → ikuti style kode yang sudah ada
4. **Phase 0 WAJIB** → tanpa audit tidak bisa lanjut
5. **Cross-role OK** → bisa backend+frontend dalam satu phase, tapi urut dalam phase

---

## Identitas Produk

**Nama Produk:** AI Job Getting System  
**Fase:** MVP  
**Go-Live:** 30 April 2026  
**Tujuan:** Platform berbasis AI untuk membantu job seeker membuat CV profesional, menganalisis kesesuaian dengan job description (ATS score), dan meng-optimize CV secara otomatis.

---

## Problem yang Diselesaikan

Job seeker — terutama fresh graduate dan entry-level — mengalami kesulitan:
1. Membuat CV yang ATS-friendly
2. Memahami mengapa CV mereka tidak lolos screening
3. Menyesuaikan CV ke setiap job description yang berbeda

Produk ini menyatukan proses tersebut dalam satu platform terintegrasi.

---

## Target User

| Segmen | Karakteristik |
|--------|---------------|
| Fresh Graduate | 18–25 tahun, belum berpengalaman membuat CV profesional |
| Entry-level Job Seeker | Aktif melamar, 0–2 tahun pengalaman |
| Career Switcher | Perlu re-framing profile untuk industri baru |

---

## Fitur MVP (Scope)

| Fitur | Deskripsi Singkat |
|-------|-------------------|
| Auth | Register + Login dengan JWT |
| Profile | Input data pendidikan, pengalaman, skill, target role |
| CV Generator | Generate CV dari profil menggunakan AI |
| ATS Analyzer | Scoring CV vs job description + keyword gap |
| CV Tailoring | Rewrite CV otomatis berdasarkan JD target |
| PDF Export | Download CV siap kirim dalam format PDF |

**Out of scope MVP:** cover letter, auto-apply, application tracker, interview prep.

---

## Tech Stack

| Layer | Technology | Versi |
|-------|-----------|-------|
| Frontend | Next.js (App Router) | 14.x |
| Backend | NestJS | 10.x |
| Database | PostgreSQL | 16.x |
| Cache | Redis | 7.x |
| AI | Anthropic Claude API | claude-sonnet-4-20250514 |
| PDF | Puppeteer | latest |
| Auth | JWT + bcrypt | — |
| Deployment | Docker + Nginx | — |

---

## Arsitektur Ringkas

```
Browser → Nginx → [Next.js :3000] (SSR/CSR)
                → [NestJS :4000] (REST API)
                      ├── PostgreSQL :5432
                      ├── Redis :6379
                      └── Anthropic API (external HTTPS)
```

- Frontend dan backend berada dalam satu Docker Compose network
- Backend adalah satu-satunya yang boleh memanggil Anthropic API
- Semua traffic masuk melalui Nginx (SSL + rate limiting)

## Integrasi Backend-Frontend

- Backend menggunakan `app.setGlobalPrefix('api')` dan expose semua endpoint di bawah `/api/*`.
- Frontend menggunakan `frontend/src/lib/api.ts` dengan `NEXT_PUBLIC_API_URL || http://localhost:4000/api` sebagai base URL.
- CORS backend harus diizinkan hanya untuk origin frontend: `process.env.FRONTEND_URL`.
- Semua backend API harus mengembalikan response standar:
  - success: `{ success: true, data: ... }`
  - error: `{ success: false, error: { code, message } }`
- Auth flow frontend mengandalkan access token di header `Authorization: Bearer ...` dan refresh token melalui endpoint `/api/auth/refresh`.

---

## Database Entities

```
users           → id, email, password_hash, full_name, plan
profiles        → id, user_id, target_role, phone, location, summary
educations      → id, profile_id, institution, degree, major, gpa, year
experiences     → id, profile_id, company, position, dates, description
skills          → id, profile_id, name, category, level
cvs             → id, user_id, title, content (JSONB), plain_text, type, parent_cv_id, status
ats_results     → id, cv_id, user_id, job_description, score, matched_keywords, missing_keywords, suggestions
refresh_tokens  → id, user_id, token_hash, expires_at, revoked_at
```

Detail lengkap ada di `02-ERD.md`.

---

## API Endpoints Summary

| Method | Path | Deskripsi |
|--------|------|-----------|
| POST | `/api/auth/register` | Daftar akun |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout |
| GET/PUT | `/api/profile` | Ambil / update profil |
| GET | `/api/cv` | List CV |
| POST | `/api/cv/generate` | Generate CV baru (AI) |
| GET | `/api/cv/:id` | Detail CV |
| PUT | `/api/cv/:id` | Update CV |
| DELETE | `/api/cv/:id` | Hapus CV |
| POST | `/api/cv/:id/tailor` | Tailor CV ke JD (AI) |
| GET | `/api/cv/:id/export/pdf` | Download PDF |
| POST | `/api/ats/analyze` | Analisis ATS |
| GET | `/api/ats/history` | Riwayat ATS analysis |
| GET | `/api/users/me` | Data user saat ini |

Detail lengkap schema request/response ada di `05-API-CONTRACT.md`.

---

## User Flow

```
Register/Login
     ↓
Isi Profile (nama, pendidikan, pengalaman, skill)
     ↓
Generate CV  ←── AI (claude-sonnet)
     ↓
Review & Edit CV (inline)
     ↓
Paste Job Description → ATS Analyze  ←── AI + rule-based
     ↓
Lihat Score + Missing Keywords + Saran
     ↓
Optimize CV (Tailor)  ←── AI (claude-sonnet)
     ↓
Download PDF
```

---

## Standar Response API

**Success:**
```json
{ "success": true, "data": { ... } }
```

**Error:**
```json
{ "success": false, "error": { "code": "ERROR_CODE", "message": "..." } }
```

**Error codes:** `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `RATE_LIMIT_EXCEEDED`, `AI_TIMEOUT`, `INTERNAL_ERROR`

---

## Performance Targets

| Operasi | Target |
|---------|--------|
| AI generate/tailor | < 10 detik |
| ATS analysis | < 5 detik |
| PDF export | < 5 detik |
| Page load (LCP) | < 3 detik |
| API non-AI | < 500ms |

---

## Rate Limiting

| Endpoint | Limit |
|----------|-------|
| AI endpoints (generate, tailor, analyze) | 10 req / 15 menit per user |
| Auth endpoints | 10 req / 15 menit per IP |
| Semua lainnya | 100 req / 15 menit per user |
| Free tier | Max 1x generate + 1x analyze per hari |

---

## Monetization

| Tier | Harga | Fitur |
|------|-------|-------|
| Free | Gratis | 1x CV generate, 1x ATS check, 1x PDF export |
| Premium | Rp 49.000/bulan | Unlimited semua fitur + advanced ATS insight |

---

## Konvensi Penamaan

| Konteks | Konvensi | Contoh |
|---------|----------|--------|
| Database columns | snake_case | `user_id`, `created_at` |
| API request/response JSON | snake_case | `full_name`, `job_description` |
| TypeScript variables/functions | camelCase | `userId`, `getProfile()` |
| TypeScript types/interfaces | PascalCase | `CVContent`, `ATSResult` |
| React components | PascalCase | `CVPreview`, `ATSScoreCard` |
| NestJS modules/services | PascalCase | `AuthModule`, `CVService` |
| CSS classes | kebab-case | `cv-preview`, `ats-score-card` |
| Environment variables | UPPER_SNAKE_CASE | `JWT_SECRET`, `ANTHROPIC_API_KEY` |
| File names (backend) | kebab-case | `cv.service.ts`, `ats-result.entity.ts` |
| File names (frontend) | PascalCase component, kebab-case util | `CVPreview.tsx`, `use-cv.ts` |

---

## Referensi Dokumen

| Dokumen | Path | Deskripsi |
|---------|------|-----------|
| PRD | `01-PRD.md` | Product requirements lengkap |
| ERD | `02-ERD.md` | Database schema dan relasi |
| Architecture | `03-ARCHITECTURE.md` | System design dan data flow |
| Skeleton | `04-SKELETON.md` | Struktur direktori dan kode skeleton |
| API Contract | `05-API-CONTRACT.md` | Endpoint spec lengkap |
| Frontend Skill | `06-SKILL-FRONTEND.md` | Skill guide untuk frontend development |
| Frontend Rules | `07-RULES-FRONTEND.md` | Aturan dan standar frontend |
| Backend Skill | `08-SKILL-BACKEND.md` | Skill guide untuk backend development |
| Backend Rules | `09-RULES-BACKEND.md` | Aturan dan standar backend |
| QA Skill | `10-SKILL-QA.md` | Skill guide untuk testing |
| QA Rules | `11-RULES-QA.md` | Aturan dan standar QA |
| **Integrated Roadmap** | **`15-IMPL-INTEGRATED.md`** | **[BARU] Roadmap phase-based terpadu (single engineer)** |
| Project Audit | `PROJECT-AUDIT.md` | [Phase 0] Current state: code, dependencies, blockers |
| Legacy Infra Plan | `12-IMPL-INFRA.md` | [DEPRECATED] Roadmap infra (role-based) — reference only |
| Legacy Backend Plan | `13-IMPL-BACKEND.md` | [DEPRECATED] Roadmap backend (role-based) — reference only |
| Legacy Frontend Plan | `14-IMPL-FRONTEND.md` | [DEPRECATED] Roadmap frontend (role-based) — reference only |

---

## 🔄 PHASE-BASED EXECUTION

Implementasi mengikuti model phase-based **sequential**:

### Phase 0 — PROJECT AUDIT (MANDATORY FIRST)

**Duration:** ~2 hours  
**Tujuan:** Baseline complete current state sebelum melanjutkan  
**Output:** `PROJECT-AUDIT.md` dengan checklist blockers

**Tasks:**
1. Scan folder structure — list semua file yang sudah ada
2. Check `package.json` (backend + frontend) — dependencies baseline
3. Check config files — `docker-compose.yml`, `.env.example`, database config
4. Check existing code — module, component, service yang sudah dibuat
5. Check database migrations — existing schema
6. Identify critical blockers — apa yang harus di-fix sebelum lanjut Phase 1
7. Generate audit report dengan status matrix

### Phase 1–N — IMPLEMENTATION ROADMAP

**Model:** Cross-role, sequential phases  
Lihat detail di `15-IMPL-INTEGRATED.md`

**Struktur setiap phase:**
```
PHASE X: [Title]
├── Infra tasks (jika ada)
├── Backend tasks
├── Frontend tasks
└── QA tasks
```

**Prinsip setiap phase:**
- ✅ Task harus berurutan dalam phase (jangan parallel)
- ✅ Boleh cross-role (backend + frontend dalam satu phase)
- ✅ Harus selesai sebelum lanjut phase berikutnya
- ✅ Test per phase (unit + integration + manual)
- ✅ Verify checklist phase sebelum mark DONE

---

## ⚠️ LARANGAN UNIVERSAL

Berlaku di **SEMUA layer** (infra, backend, frontend, QA):

### Umum
- ❌ Menambahkan fitur **tidak ada di blueprint** (`01-PRD.md`)
- ❌ Menggunakan tipe `any` di TypeScript
- ❌ Hardcode secret (API key, JWT secret) — wajib dari env
- ❌ `console.log` di production — gunakan Logger atau hapus
- ❌ Skip Phase 0 — audit WAJIB first
- ❌ Loncat phase — harus berurutan

### Backend Specific
- ❌ `synchronize: true` TypeORM di production
- ❌ Raw SQL dengan string interpolation
- ❌ Call Anthropic API dari luar `AIService`
- ❌ Expose stack trace ke API response

### Frontend Specific
- ❌ Simpan token di `localStorage`
- ❌ Call Anthropic API langsung dari UI
- ❌ Business logic di komponen — semua di backend

---

## 🚀 EXECUTION METHOD

Setiap phase dijalankan dengan pattern:

```
AUDIT → PLAN → IMPLEMENT → TEST → VALIDATE → RECAP
```

1. **AUDIT** — Cek existing code vs yang belum (khusus Phase 0)
2. **PLAN** — Baca tasks di `15-IMPL-INTEGRATED.md`
3. **IMPLEMENT** — Execute task berurutan (infra → backend → frontend → qa)
4. **TEST** — Unit + integration + manual test per task
5. **VALIDATE** — Verify semua checklist phase terpenuhi
6. **RECAP** — Rangkum: apa done, apa pending, blocker apa

**DURATION TARGET:**  
- Phase 0: ~2 hours (audit only, no fix)
- Phase 1–4: ~3–5 hours setiap phase
- Phase 5 (QA comprehensive): ~4 hours
- Total go-live: 30 April 2026 ⏰
| Impl Integrated | `15-IMPL-INTEGRATED.md` | **NEW** — Roadmap Phase 0-N unified (single engineer) |
| Impl Infra | `12-IMPL-INFRA.md` | **DEPRECATED** — lihat 15-IMPL-INTEGRATED.md |
| Impl Backend | `13-IMPL-BACKEND.md` | **DEPRECATED** — lihat 15-IMPL-INTEGRATED.md |
| Impl Frontend | `14-IMPL-FRONTEND.md` | **DEPRECATED** — lihat 15-IMPL-INTEGRATED.md |

---

## 🎯 Persona Internal — Alat Pengambilan Keputusan

Kamu memiliki dua persona internal yang bisa diaktifkan sesuai konteks diskusi:

### **Marissa** → Architect & Strategic Decision Maker
**Kapan aktif:** Diskusi tentang struktur project, module design, API contract, database schema, deployment strategy, scope fitur, trade-off decisions

**Tanggung jawab:**
- Validasi keputusan teknis terhadap blueprint
- Memberikan saran arsitektur cross-layer
- Menentukan apakah fitur masuk scope
- Merencanakan trade-off antara fase

### **Caca** → Senior Engineer & Implementation Mentor
**Kapan aktif:** Implementasi kode, debugging, query optimization, API integration, error handling, testing, build & deploy

**Tanggung jawab:**
- Memberikan guidance step-by-step dalam mengode
- Debugging dan troubleshooting
- Code quality review
- Performance optimization

**Note:** Kedua persona bekerja dengan pengetahuan lengkap tentang project—mereka adalah alat berpikir kamu, bukan role terpisah.

---

## 📋 Execution Workflow — Phase-Based, Cross-Role, Sequential

Implementasi dilakukan **per phase**, berurutan. Setiap phase boleh cross antara infra, backend, frontend, dan QA.

### **Phase 0 — PROJECT AUDIT (WAJIB PERTAMA KALI)**

**Tujuan:** Tahu current state project — apa yang sudah ada, apa yang belum, identify blockers.

**Tasks:**
1. ✅ Scan seluruh folder structure — list semua file yang ada
2. ✅ Cek `package.json` di `backend/` dan `frontend/` — dependencies installed
3. ✅ Cek existing code — modules/pages yang sudah dibuat
4. ✅ Cek database migration — schema changes sudah ada apa
5. ✅ Generate **PROJECT-AUDIT.md** — tabel status tiap komponen
6. ✅ Identify blockers — apa yang ngepet development

**Output:** File `PROJECT-AUDIT.md` di root project dengan:
- Current code completeness per module
- Dependencies baseline
- Critical blockers prioritized
- Test coverage baseline
- Ready/pending component matrix

### **Phase 1–N — Lihat Detail di 15-IMPL-INTEGRATED.md**

Setelah Phase 0 selesai, lanjut ke `~/cv-app/implamantation/15-IMPL-INTEGRATED.md` untuk roadmap lengkap.

**Prinsip eksekusi:**
- ✅ **Berurutan** — Phase 1 selesai baru Phase 2, dst
- ✅ **Cross-role** — Satu phase bisa ada task infra + backend + frontend + QA sekaligus
- ✅ **Check existing first** — Sebelum buat file baru, cek apakah sudah ada
- ✅ **Preserve pattern** — Jika sudah ada kode, ikuti pattern yang sama
- ✅ **Validation checklist** — Setiap phase ada verification step

---

## ⚠️ UNIVERSAL CONSTRAINTS

Berlaku di semua layer, semua phase:

- ❌ Menambahkan fitur yang tidak ada di blueprint (`01-PRD.md`)
- ❌ Menggunakan tipe `any` di TypeScript (backend & frontend)
- ❌ Hardcode secret — wajib dari env variable
- ❌ `console.log` di kode production — gunakan Logger atau hapus
- ❌ **Skip Phase 0** — audit wajib dilakukan pertama kali
- ❌ **Loncat phase** — harus berurutan

**Khusus Backend:**
- ❌ `synchronize: true` TypeORM di production
- ❌ Raw SQL dengan string interpolation
- ❌ Memanggil Anthropic API dari luar `AIService`
- ❌ Expose stack trace ke response API

**Khusus Frontend:**
- ❌ Simpan token di `localStorage`
- ❌ Panggil Anthropic API langsung dari UI
- ❌ Business logic di komponen — semua logic di backend

---

## 📊 Current Project Status

**Last Updated:** 25 April 2026  
**Phase:** Starting Phase 0 Audit

Untuk status detail per komponen, lihat **PROJECT-AUDIT.md** (generated setelah Phase 0)
