# 🗃️ Entity Relationship Diagram (ERD)

## AI Job Getting System — Database Schema

**Version:** 1.0.0  
**Database:** PostgreSQL  
**ORM:** TypeORM / Prisma

---

## Diagram

```
┌─────────────────────────────┐
│           users             │
├─────────────────────────────┤
│ id             UUID  PK     │
│ email          VARCHAR(255) │
│ password_hash  VARCHAR(255) │
│ full_name      VARCHAR(255) │
│ plan           ENUM         │◄── 'free' | 'premium'
│ created_at     TIMESTAMP    │
│ updated_at     TIMESTAMP    │
└─────────────┬───────────────┘
              │ 1
              │
              │ 1
┌─────────────▼───────────────┐
│           profiles          │
├─────────────────────────────┤
│ id             UUID  PK     │
│ user_id        UUID  FK     │
│ target_role    VARCHAR(255) │
│ phone          VARCHAR(50)  │
│ location       VARCHAR(255) │
│ linkedin_url   VARCHAR(500) │
│ portfolio_url  VARCHAR(500) │
│ summary        TEXT         │
│ created_at     TIMESTAMP    │
│ updated_at     TIMESTAMP    │
└──────┬──────────────────────┘
       │
       ├──────────────────────────────────────────────────┐
       │ 1                                                 │ 1
       │ has many                                          │ has many
       │ N                                                 │ N
┌──────▼────────────────────┐           ┌─────────────────▼──────────────┐
│        educations         │           │          experiences            │
├───────────────────────────┤           ├────────────────────────────────┤
│ id           UUID  PK     │           │ id             UUID  PK        │
│ profile_id   UUID  FK     │           │ profile_id     UUID  FK        │
│ institution  VARCHAR(255) │           │ company        VARCHAR(255)    │
│ degree       VARCHAR(100) │           │ position       VARCHAR(255)    │
│ major        VARCHAR(255) │           │ start_date     DATE            │
│ gpa          DECIMAL(3,2) │           │ end_date       DATE (nullable) │
│ start_year   INT          │           │ is_current     BOOLEAN         │
│ end_year     INT          │           │ description    TEXT            │
│ created_at   TIMESTAMP    │           │ created_at     TIMESTAMP       │
└───────────────────────────┘           └────────────────────────────────┘

┌─────────────────────────────┐
│           skills            │
├─────────────────────────────┤
│ id           UUID  PK       │
│ profile_id   UUID  FK       │
│ name         VARCHAR(100)   │
│ category     ENUM           │◄── 'hard' | 'soft' | 'language' | 'tool'
│ level        ENUM (nullable)│◄── 'beginner' | 'intermediate' | 'advanced'
│ created_at   TIMESTAMP      │
└─────────────────────────────┘

              users
                │ 1
                │ has many
                │ N
┌───────────────▼─────────────────────┐
│                 cvs                 │
├─────────────────────────────────────┤
│ id              UUID  PK            │
│ user_id         UUID  FK            │
│ title           VARCHAR(255)        │◄── e.g. "Backend Dev CV - Tokopedia"
│ content         JSONB               │◄── structured CV content
│ plain_text      TEXT                │◄── for ATS keyword matching
│ type            ENUM                │◄── 'generated' | 'tailored'
│ parent_cv_id    UUID  FK (nullable) │◄── FK ke cvs (self-reference)
│ status          ENUM                │◄── 'draft' | 'finalized'
│ created_at      TIMESTAMP           │
│ updated_at      TIMESTAMP           │
└───────────────┬─────────────────────┘
                │ 1
                │ has many
                │ N
┌───────────────▼─────────────────────┐
│            ats_results              │
├─────────────────────────────────────┤
│ id                UUID  PK          │
│ cv_id             UUID  FK          │
│ user_id           UUID  FK          │
│ job_description   TEXT              │
│ job_title         VARCHAR(255)      │
│ company_name      VARCHAR(255)      │
│ score             INT               │◄── 0–100
│ matched_keywords  JSONB             │◄── string[]
│ missing_keywords  JSONB             │◄── string[]
│ suggestions       JSONB             │◄── { section: string, tip: string }[]
│ created_at        TIMESTAMP         │
└─────────────────────────────────────┘

              users
                │ 1
                │ has many
                │ N
┌───────────────▼─────────────────────┐
│         refresh_tokens              │
├─────────────────────────────────────┤
│ id           UUID  PK               │
│ user_id      UUID  FK               │
│ token_hash   VARCHAR(255)           │
│ expires_at   TIMESTAMP              │
│ created_at   TIMESTAMP              │
│ revoked_at   TIMESTAMP (nullable)   │
└─────────────────────────────────────┘
```

---

## Entity Definitions

### `users`
Menyimpan data akun user.

| Column | Type | Constraint | Description |
|--------|------|------------|-------------|
| id | UUID | PK, default gen_random_uuid() | Unique identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Email untuk login |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt hash |
| full_name | VARCHAR(255) | NOT NULL | Nama lengkap |
| plan | ENUM('free','premium') | DEFAULT 'free' | Tier berlangganan |
| created_at | TIMESTAMP | DEFAULT NOW() | Waktu register |
| updated_at | TIMESTAMP | AUTO UPDATE | Waktu update terakhir |

---

### `profiles`
Satu user memiliki tepat satu profil (one-to-one). Berisi data yang digunakan sebagai context AI.

| Column | Type | Constraint | Description |
|--------|------|------------|-------------|
| id | UUID | PK | |
| user_id | UUID | FK → users.id, UNIQUE | Satu user satu profil |
| target_role | VARCHAR(255) | | Posisi yang ditarget |
| phone | VARCHAR(50) | | No. telepon |
| location | VARCHAR(255) | | Kota/lokasi |
| linkedin_url | VARCHAR(500) | | URL LinkedIn |
| portfolio_url | VARCHAR(500) | | URL portfolio |
| summary | TEXT | | Professional summary |

---

### `educations`
One-to-many dari profiles. User bisa punya lebih dari satu riwayat pendidikan.

| Column | Type | Constraint | Description |
|--------|------|------------|-------------|
| id | UUID | PK | |
| profile_id | UUID | FK → profiles.id | |
| institution | VARCHAR(255) | NOT NULL | Nama institusi |
| degree | VARCHAR(100) | | S1, S2, D3, etc. |
| major | VARCHAR(255) | | Jurusan |
| gpa | DECIMAL(3,2) | | IPK (contoh: 3.75) |
| start_year | INT | | |
| end_year | INT | | |

---

### `experiences`
One-to-many dari profiles. Mendukung multiple pengalaman kerja.

| Column | Type | Constraint | Description |
|--------|------|------------|-------------|
| id | UUID | PK | |
| profile_id | UUID | FK → profiles.id | |
| company | VARCHAR(255) | NOT NULL | Nama perusahaan |
| position | VARCHAR(255) | NOT NULL | Jabatan |
| start_date | DATE | NOT NULL | |
| end_date | DATE | nullable | NULL jika masih bekerja |
| is_current | BOOLEAN | DEFAULT false | |
| description | TEXT | | Deskripsi pekerjaan |

---

### `skills`
One-to-many dari profiles. Dikategorikan untuk membantu prompt engineering.

| Column | Type | Constraint | Description |
|--------|------|------------|-------------|
| id | UUID | PK | |
| profile_id | UUID | FK → profiles.id | |
| name | VARCHAR(100) | NOT NULL | Nama skill |
| category | ENUM | NOT NULL | hard / soft / language / tool |
| level | ENUM | nullable | beginner / intermediate / advanced |

---

### `cvs`
Menyimpan CV hasil generate dan hasil tailoring. `content` disimpan sebagai JSONB untuk fleksibilitas struktur.

| Column | Type | Constraint | Description |
|--------|------|------------|-------------|
| id | UUID | PK | |
| user_id | UUID | FK → users.id | |
| title | VARCHAR(255) | NOT NULL | Label CV |
| content | JSONB | NOT NULL | Struktur CV (summary, experience, education, skills) |
| plain_text | TEXT | | Versi plain text untuk ATS matching |
| type | ENUM | NOT NULL | 'generated' atau 'tailored' |
| parent_cv_id | UUID | FK → cvs.id, nullable | Referensi ke CV asal (untuk tailored) |
| status | ENUM | DEFAULT 'draft' | 'draft' atau 'finalized' |

**Struktur `content` JSONB:**
```json
{
  "summary": "string",
  "experiences": [
    {
      "company": "string",
      "position": "string",
      "duration": "string",
      "bullets": ["string"]
    }
  ],
  "educations": [
    {
      "institution": "string",
      "degree": "string",
      "major": "string",
      "year": "string"
    }
  ],
  "skills": {
    "hard": ["string"],
    "soft": ["string"],
    "tools": ["string"]
  }
}
```

---

### `ats_results`
Menyimpan hasil analisis ATS per job description. Satu CV bisa dianalisis untuk banyak JD.

| Column | Type | Constraint | Description |
|--------|------|------------|-------------|
| id | UUID | PK | |
| cv_id | UUID | FK → cvs.id | |
| user_id | UUID | FK → users.id | Redundant untuk query efisiensi |
| job_description | TEXT | NOT NULL | Raw JD yang di-paste user |
| job_title | VARCHAR(255) | | Extracted dari JD |
| company_name | VARCHAR(255) | | Extracted dari JD |
| score | INT | CHECK (0–100) | ATS match score |
| matched_keywords | JSONB | | Array keyword yang match |
| missing_keywords | JSONB | | Array keyword yang hilang |
| suggestions | JSONB | | Array saran per section |

---

### `refresh_tokens`
Menyimpan refresh token untuk session management yang aman.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | PK |
| user_id | UUID | FK → users.id |
| token_hash | VARCHAR(255) | bcrypt hash dari token |
| expires_at | TIMESTAMP | Waktu expired (7 hari) |
| revoked_at | TIMESTAMP | Nullable — diisi saat logout |

---

## Relationships Summary

```
users        1 ──── 1    profiles
users        1 ──── N    cvs
users        1 ──── N    ats_results
users        1 ──── N    refresh_tokens
profiles     1 ──── N    educations
profiles     1 ──── N    experiences
profiles     1 ──── N    skills
cvs          1 ──── N    ats_results
cvs          1 ──── N    cvs (self-reference: parent → tailored versions)
```

---

## Indexes

```sql
-- Auth lookup
CREATE UNIQUE INDEX idx_users_email ON users(email);

-- Profile lookup
CREATE UNIQUE INDEX idx_profiles_user_id ON profiles(user_id);

-- CV listing per user
CREATE INDEX idx_cvs_user_id ON cvs(user_id);
CREATE INDEX idx_cvs_parent_cv_id ON cvs(parent_cv_id);

-- ATS lookup
CREATE INDEX idx_ats_results_cv_id ON ats_results(cv_id);
CREATE INDEX idx_ats_results_user_id ON ats_results(user_id);

-- Token lookup & cleanup
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
```
