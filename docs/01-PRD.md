# 📄 Product Requirements Document (PRD)

## AI Job Getting System — MVP

**Version:** 1.0.0  
**Status:** Draft  
**Go-Live Target:** 30 April 2026  
**Author:** Engineering Team

---

## 1. Objective

Membangun MVP yang memungkinkan user membuat CV secara cepat dan profesional, serta mengoptimasi CV agar sesuai dengan job description (ATS-friendly).

**Tujuan utama:**
- Mengurangi kesulitan dalam membuat CV
- Meningkatkan peluang CV lolos screening ATS
- Menyediakan satu platform terintegrasi — tidak perlu tools berbeda

---

## 2. Target User

### Primary User
| Segmen | Deskripsi |
|--------|-----------|
| Fresh Graduate | Usia 18–25 tahun, baru lulus, tidak ada pengalaman membuat CV profesional |
| Entry-level Job Seeker | Sedang aktif melamar pekerjaan, 0–1 tahun pengalaman |
| Mahasiswa Tingkat Akhir | Mulai menyiapkan diri masuk dunia kerja |

### Secondary User
| Segmen | Deskripsi |
|--------|-----------|
| Career Switcher | Pindah industri, perlu re-framing CV |
| Active Job Seeker | 1–3 tahun pengalaman, ingin meningkatkan hit rate interview |

---

## 3. Problem Statement

### Pain Points User Saat Ini

1. **Tidak tahu format CV yang benar** — banyak template yang beredar tidak ATS-friendly
2. **Tidak memahami cara kerja ATS** — mengirim CV sama ke semua job tanpa optimasi
3. **Menggunakan banyak tools berbeda** — Canva untuk desain, ChatGPT untuk teks, tools lain untuk export
4. **CV tidak relevan dengan job description** — keyword tidak match, peluang dipanggil rendah

### Akibat
- CV tidak lolos screening awal (ATS rejection rate ~75% untuk non-optimized CV)
- Waktu terbuang membuat CV dari nol setiap apply
- Frustrasi karena tidak ada feedback kenapa CV ditolak

---

## 4. Solution Overview

MVP menyediakan satu platform terintegrasi untuk:

```
Profile Input → CV Generate → ATS Analyze → CV Tailor → Export PDF
```

| Fitur | Deskripsi |
|-------|-----------|
| CV Generator | Generate CV berbasis AI dari input profil user |
| ATS Analyzer | Analisis kesesuaian CV dengan job description + scoring |
| CV Tailoring | Rewrite CV otomatis sesuai keyword job description |
| PDF Export | Download CV dalam format PDF siap kirim |

---

## 5. Scope MVP

### ✅ In Scope

#### 5.1 Authentication
- Register dengan email + password
- Login dan session management (JWT)
- Google OAuth (Required, Priority: Low) — wajib ada tapi implementasi bisa ditunda jika perlu

#### 5.2 Profile Input
User mengisi data profil yang digunakan sebagai context AI:
- Data personal (nama, kontak, target role)
- Pendidikan (institusi, jurusan, tahun, IPK)
- Pengalaman kerja (perusahaan, posisi, durasi, deskripsi)
- Skill (hard skill, soft skill)

#### 5.3 CV Generator
- Generate CV dari profil user menggunakan AI
- Format ATS-friendly (plain text structure, no complex layout)
- Editable sebelum disimpan
- Response time < 10 detik

#### 5.4 ATS Optimizer
Input: paste job description  
Output:
- ATS Score (0–100)
- Missing keywords list
- Matched keywords list
- Saran perbaikan spesifik

#### 5.5 CV Tailoring
- Rewrite CV secara otomatis sesuai job description
- Tambahkan keyword relevan dari JD
- Improve bullet points agar lebih impactful
- Highlight perubahan dari CV original

#### 5.6 CV Export
- Download CV dalam format PDF
- Layout profesional dan rapi
- File name: `{nama}_{target_role}_CV.pdf`

### ❌ Out of Scope (Future Roadmap)
- Cover letter generator
- Career coaching / mentorship
- Application tracking (status per lamaran)
- Auto-apply ke job boards
- Interview preparation
- LinkedIn profile optimizer

---

## 6. User Flow

```
[Register / Login]
       ↓
[Isi Profile] → (nama, pendidikan, pengalaman, skill, target role)
       ↓
[Generate CV] → AI generate draft CV
       ↓
[Review & Edit CV] → user bisa edit inline
       ↓
[Paste Job Description] → input ke ATS Analyzer
       ↓
[Lihat ATS Score + Insight] → score, missing keywords, saran
       ↓
[Klik "Optimize CV"] → AI rewrite CV sesuai JD
       ↓
[Review Tailored CV]
       ↓
[Download PDF]
```

---

## 7. Functional Requirements

### 7.1 Authentication
| ID | Requirement |
|----|-------------|
| FR-AUTH-01 | User dapat register dengan email dan password |
| FR-AUTH-02 | User dapat login dan mendapatkan JWT access token |
| FR-AUTH-03 | Session di-refresh otomatis dengan refresh token |
| FR-AUTH-04 | Password di-hash menggunakan bcrypt (min. cost factor 12) |
| FR-AUTH-05 | User dapat logout dan invalidate session |

### 7.2 Profile
| ID | Requirement |
|----|-------------|
| FR-PROF-01 | User dapat membuat profil baru |
| FR-PROF-02 | User dapat mengupdate profil yang sudah ada |
| FR-PROF-03 | Profil mendukung multiple entri untuk pendidikan dan pengalaman |
| FR-PROF-04 | Data profil digunakan sebagai context untuk CV generation |

### 7.3 CV Generator
| ID | Requirement |
|----|-------------|
| FR-CV-01 | System generate CV dari data profil dalam < 10 detik |
| FR-CV-02 | CV memiliki struktur: Summary, Experience, Education, Skills |
| FR-CV-03 | User dapat mengedit CV yang sudah di-generate |
| FR-CV-04 | CV tersimpan ke database setelah user confirm |
| FR-CV-05 | User dapat memiliki lebih dari satu versi CV |

### 7.4 ATS Analyzer
| ID | Requirement |
|----|-------------|
| FR-ATS-01 | System dapat mengekstrak keyword penting dari job description |
| FR-ATS-02 | System menghitung ATS Score (0–100) berdasarkan keyword match |
| FR-ATS-03 | System menampilkan missing keywords dan matched keywords |
| FR-ATS-04 | System memberikan saran perbaikan spesifik per section |

### 7.5 CV Tailoring
| ID | Requirement |
|----|-------------|
| FR-TAIL-01 | System me-rewrite CV berdasarkan job description target |
| FR-TAIL-02 | Keyword dari JD ditambahkan secara natural ke CV |
| FR-TAIL-03 | Bullet points di-improve agar lebih impactful dan relevan |
| FR-TAIL-04 | Versi tailored disimpan sebagai CV baru (tidak overwrite original) |

### 7.6 Export
| ID | Requirement |
|----|-------------|
| FR-EXP-01 | User dapat download CV dalam format PDF |
| FR-EXP-02 | Layout PDF rapi, profesional, dan ATS-readable |
| FR-EXP-03 | PDF dapat di-generate dalam < 5 detik |

---

## 8. Non-Functional Requirements

### 8.1 Performance
| Metrik | Target |
|--------|--------|
| AI response time (generate/tailor) | < 10 detik |
| ATS analysis response time | < 5 detik |
| Page load time (LCP) | < 3 detik |
| PDF generation time | < 5 detik |
| API response time (non-AI) | < 500ms |

### 8.2 Scalability
- Mendukung 1.000–10.000 active user pada fase awal
- Arsitektur modular untuk memudahkan penambahan fitur
- Stateless backend untuk horizontal scaling

### 8.3 Security
- Password hashing dengan bcrypt
- JWT dengan expiry (access: 15m, refresh: 7d)
- Input validation & sanitization di semua endpoint
- Rate limiting: 100 req/15min per IP (umum), 10 req/15min per user (AI endpoint)
- HTTPS enforced

### 8.4 Availability
- Uptime target: 99%
- Graceful error handling — AI timeout tidak crash aplikasi

---

## 9. Success Metrics (KPI)

| Metrik | Target MVP (bulan pertama) |
|--------|--------------------------|
| Registered users | 500 |
| CV generated | 300 |
| ATS checks performed | 200 |
| CV downloads (PDF) | 150 |
| Premium conversion rate | 5% |
| D7 retention | > 20% |

---

## 10. Monetization

### Free Tier
- 1x CV generation
- 1x ATS check
- 1x PDF export

### Premium Tier (Rp 49.000/bulan)
- Unlimited CV generation
- Unlimited ATS check
- Unlimited CV tailoring
- Advanced ATS insight (section-level scoring)
- Priority AI response

---

## 11. Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router) |
| Backend | NestJS |
| Database | PostgreSQL |
| Cache | Redis |
| AI | Anthropic Claude API (claude-sonnet) |
| PDF | Puppeteer |
| Auth | JWT + bcrypt |
| Deployment | Docker + Nginx |

---

## 12. Timeline

| Week | Milestone |
|------|-----------|
| Week 1 | Project setup, Auth module, Profile module |
| Week 2 | CV Generator |
| Week 3 | ATS Analyzer |
| Week 4 | CV Tailoring |
| Week 5 | PDF Export, Testing, Deploy |

---

## 13. Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| AI output terlalu generic | Medium | High | Prompt engineering + user context injection |
| ATS score tidak akurat | Medium | High | Keyword-based + rule-based hybrid scoring |
| AI response lambat (> 10 detik) | Low | Medium | Streaming response + loading state UX |
| User tidak paham flow | Medium | Medium | Onboarding guided tour + progress indicator |
| Anthropic API down | Low | High | Retry mechanism + fallback error message |
