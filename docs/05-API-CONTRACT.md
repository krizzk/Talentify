# 📡 API Contract

## AI Job Getting System — REST API Specification

**Version:** 1.0.0  
**Base URL:** `https://api.yourdomain.com/api`  
**Auth:** Bearer JWT (access token)  
**Content-Type:** `application/json`

---

## Response Format

Semua response menggunakan format standar berikut:

### Success
```json
{
  "success": true,
  "data": { },
  "meta": { }
}
```

### Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email already registered",
    "details": []
  }
}
```

### Error Codes
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Input tidak valid |
| `UNAUTHORIZED` | 401 | Token tidak ada atau expired |
| `FORBIDDEN` | 403 | Tidak punya akses ke resource |
| `NOT_FOUND` | 404 | Resource tidak ditemukan |
| `RATE_LIMIT_EXCEEDED` | 429 | Terlalu banyak request |
| `AI_TIMEOUT` | 503 | AI service timeout |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Authentication

### POST `/auth/register`

Register akun baru.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Min8CharPassword!",
  "full_name": "Budi Santoso"
}
```

**Validation:**
- `email` — valid email format, max 255 chars
- `password` — min 8 chars, harus ada huruf dan angka
- `full_name` — min 2 chars, max 255 chars

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "full_name": "Budi Santoso",
      "plan": "free"
    }
  }
}
```
> `refresh_token` dikirim via `Set-Cookie: refresh_token=...; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`

**Error `400`:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email already registered"
  }
}
```

---

### POST `/auth/login`

Login dengan email dan password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Min8CharPassword!"
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "full_name": "Budi Santoso",
      "plan": "free"
    }
  }
}
```

**Error `401`:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid email or password"
  }
}
```

---

### POST `/auth/refresh`

Dapatkan access token baru menggunakan refresh token dari cookie.

**Request:** Tidak perlu body. Refresh token dibaca dari cookie `refresh_token`.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiJ9..."
  }
}
```

---

### POST `/auth/logout`

Logout dan invalidate session.

**Auth:** Bearer Token required

**Response `200`:**
```json
{
  "success": true,
  "data": { "message": "Logged out successfully" }
}
```

---

## Profile

### GET `/profile`

Ambil profil user yang sedang login.

**Auth:** Bearer Token required

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "target_role": "Backend Engineer",
    "phone": "08123456789",
    "location": "Jakarta",
    "linkedin_url": "https://linkedin.com/in/budi",
    "portfolio_url": null,
    "summary": "Passionate backend engineer...",
    "educations": [
      {
        "id": "uuid",
        "institution": "Universitas Indonesia",
        "degree": "S1",
        "major": "Teknik Informatika",
        "gpa": 3.75,
        "start_year": 2018,
        "end_year": 2022
      }
    ],
    "experiences": [
      {
        "id": "uuid",
        "company": "Tokopedia",
        "position": "Software Engineer",
        "start_date": "2022-07-01",
        "end_date": null,
        "is_current": true,
        "description": "Developed and maintained..."
      }
    ],
    "skills": [
      { "id": "uuid", "name": "Node.js", "category": "hard", "level": "advanced" },
      { "id": "uuid", "name": "PostgreSQL", "category": "tool", "level": "intermediate" }
    ],
    "updated_at": "2026-04-01T10:00:00Z"
  }
}
```

**Response `404`:** Jika belum pernah membuat profil.

---

### PUT `/profile`

Buat atau update profil (upsert). Mengganti seluruh data profil termasuk educations, experiences, dan skills.

**Auth:** Bearer Token required

**Request Body:**
```json
{
  "target_role": "Backend Engineer",
  "phone": "08123456789",
  "location": "Jakarta",
  "linkedin_url": "https://linkedin.com/in/budi",
  "portfolio_url": null,
  "summary": "Passionate backend engineer with 2+ years experience.",
  "educations": [
    {
      "institution": "Universitas Indonesia",
      "degree": "S1",
      "major": "Teknik Informatika",
      "gpa": 3.75,
      "start_year": 2018,
      "end_year": 2022
    }
  ],
  "experiences": [
    {
      "company": "Tokopedia",
      "position": "Software Engineer",
      "start_date": "2022-07-01",
      "end_date": null,
      "is_current": true,
      "description": "Developed and maintained high-traffic microservices."
    }
  ],
  "skills": [
    { "name": "Node.js", "category": "hard", "level": "advanced" },
    { "name": "PostgreSQL", "category": "tool", "level": "intermediate" },
    { "name": "Communication", "category": "soft" }
  ]
}
```

**Response `200`:** Profile object (sama dengan GET /profile)

---

## CV

### GET `/cv`

List semua CV milik user.

**Auth:** Bearer Token required

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Backend Engineer CV - Tokopedia",
      "type": "tailored",
      "status": "finalized",
      "parent_cv_id": "uuid",
      "created_at": "2026-04-01T10:00:00Z",
      "updated_at": "2026-04-01T12:00:00Z"
    }
  ]
}
```

---

### POST `/cv/generate`

Generate CV baru dari profil user menggunakan AI.

**Auth:** Bearer Token required  
**Rate Limit:** 10 requests per 15 menit per user

**Request Body:** _(tidak perlu, data diambil dari profil user)_
```json
{}
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Budi Santoso - Backend Engineer CV",
    "type": "generated",
    "status": "draft",
    "content": {
      "summary": "Experienced backend engineer with...",
      "experiences": [
        {
          "company": "Tokopedia",
          "position": "Software Engineer",
          "duration": "Jul 2022 - Present",
          "bullets": [
            "Developed high-traffic REST APIs serving 1M+ daily requests",
            "Reduced database query time by 40% through indexing optimization"
          ]
        }
      ],
      "educations": [
        {
          "institution": "Universitas Indonesia",
          "degree": "S1 Teknik Informatika",
          "year": "2018 - 2022",
          "gpa": "3.75"
        }
      ],
      "skills": {
        "hard": ["Node.js", "NestJS", "PostgreSQL"],
        "soft": ["Communication", "Problem Solving"],
        "tools": ["Docker", "Redis", "Git"]
      }
    },
    "created_at": "2026-04-01T10:00:00Z"
  }
}
```

**Error `404`:** Profil belum diisi.  
**Error `503`:** AI service timeout.

---

### GET `/cv/:id`

Ambil detail satu CV.

**Auth:** Bearer Token required

**Response `200`:** CV object lengkap (sama dengan response generate)

**Error `403`:** CV bukan milik user yang request.  
**Error `404`:** CV tidak ditemukan.

---

### PUT `/cv/:id`

Update CV (setelah user edit manual).

**Auth:** Bearer Token required

**Request Body:**
```json
{
  "title": "Backend Engineer CV - Updated",
  "status": "finalized",
  "content": {
    "summary": "Updated summary...",
    "experiences": [...],
    "educations": [...],
    "skills": { ... }
  }
}
```

**Response `200`:** CV object yang sudah diupdate.

---

### POST `/cv/:id/tailor`

Generate versi tailored dari CV berdasarkan job description.

**Auth:** Bearer Token required  
**Rate Limit:** 10 requests per 15 menit per user

**Request Body:**
```json
{
  "job_description": "We are looking for a Backend Engineer with experience in Node.js, PostgreSQL, and microservices architecture. The ideal candidate should have 2+ years of experience...",
  "title": "Backend Engineer CV - Gojek"
}
```

**Validation:**
- `job_description` — min 100 chars, max 10.000 chars
- `title` — opsional, auto-generated jika kosong

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-new",
    "title": "Backend Engineer CV - Gojek",
    "type": "tailored",
    "parent_cv_id": "uuid-original",
    "status": "draft",
    "content": { ... },
    "created_at": "2026-04-01T14:00:00Z"
  }
}
```

---

### DELETE `/cv/:id`

Hapus CV.

**Auth:** Bearer Token required

**Response `200`:**
```json
{
  "success": true,
  "data": { "message": "CV deleted successfully" }
}
```

---

### GET `/cv/:id/export/pdf`

Download CV sebagai PDF.

**Auth:** Bearer Token required

**Response:** Binary PDF file
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="Budi_Santoso_Backend_Engineer_CV.pdf"
```

**Error `503`:** PDF generation timeout.

---

## ATS

### POST `/ats/analyze`

Analisis kesesuaian CV dengan job description.

**Auth:** Bearer Token required  
**Rate Limit:** 10 requests per 15 menit per user

**Request Body:**
```json
{
  "cv_id": "uuid",
  "job_description": "We are looking for a Backend Engineer with experience in Node.js, Docker, PostgreSQL, and REST API design. The candidate must have strong knowledge of microservices and CI/CD pipelines..."
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "cv_id": "uuid",
    "score": 72,
    "job_title": "Backend Engineer",
    "company_name": null,
    "matched_keywords": [
      "Node.js",
      "PostgreSQL",
      "REST API",
      "Docker",
      "microservices"
    ],
    "missing_keywords": [
      "CI/CD",
      "Kubernetes",
      "unit testing",
      "TypeScript"
    ],
    "suggestions": [
      {
        "section": "summary",
        "tip": "Tambahkan mention tentang pengalaman CI/CD dan testing untuk meningkatkan relevansi"
      },
      {
        "section": "skills",
        "tip": "Tambahkan TypeScript dan unit testing ke daftar skill jika kamu memilikinya"
      },
      {
        "section": "experience",
        "tip": "Highlight pengalaman deploy atau setup pipeline di bullet points experience kamu"
      }
    ],
    "created_at": "2026-04-01T14:30:00Z"
  }
}
```

---

### GET `/ats/history`

List semua hasil ATS analysis milik user.

**Auth:** Bearer Token required

**Query Params:**
- `cv_id` (opsional) — filter berdasarkan CV tertentu
- `limit` (default: 20, max: 100)
- `offset` (default: 0)

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "cv_id": "uuid",
      "job_title": "Backend Engineer",
      "score": 72,
      "created_at": "2026-04-01T14:30:00Z"
    }
  ],
  "meta": {
    "total": 5,
    "limit": 20,
    "offset": 0
  }
}
```

---

### GET `/ats/:id`

Ambil detail satu hasil ATS analysis.

**Auth:** Bearer Token required

**Response `200`:** ATS result object lengkap.

---

## Users

### GET `/users/me`

Ambil data user yang sedang login.

**Auth:** Bearer Token required

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "Budi Santoso",
    "plan": "free",
    "created_at": "2026-03-01T00:00:00Z"
  }
}
```

---

## Rate Limiting Summary

| Endpoint Group | Limit | Window |
|----------------|-------|--------|
| `POST /auth/register` | 5 req | 15 menit per IP |
| `POST /auth/login` | 10 req | 15 menit per IP |
| `POST /cv/generate` | 10 req | 15 menit per user |
| `POST /cv/:id/tailor` | 10 req | 15 menit per user |
| `POST /ats/analyze` | 10 req | 15 menit per user |
| Semua endpoint lain | 100 req | 15 menit per user |

> Free tier tambahan: max 1x `/cv/generate` dan 1x `/ats/analyze` per hari (enforced di service layer).

---

## Pagination

Endpoint yang mengembalikan list menggunakan cursor-based pagination:

**Query Params:**
- `limit` — jumlah item per page (default: 20, max: 100)
- `offset` — offset untuk skip (default: 0)

**Meta object:**
```json
{
  "meta": {
    "total": 25,
    "limit": 20,
    "offset": 0,
    "has_next": true
  }
}
```

---

## Webhook (Future)

Untuk notifikasi async (misalnya jika AI processing dikerjakan secara background):

```
POST /webhooks/cv-ready
{
  "event": "cv.generated",
  "cv_id": "uuid",
  "user_id": "uuid",
  "timestamp": "2026-04-01T10:00:00Z"
}
```

_Belum diimplementasi di MVP._
