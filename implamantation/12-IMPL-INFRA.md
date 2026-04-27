# 🏗️ IMPLEMENTATION PLAN — Infrastructure

> ⚠️ **DEPRECATED** — This document uses the old 3-role structure (Infra Engineer role-based).  
> **NEW UNIFIED ROADMAP:** See `15-IMPL-INTEGRATED.md` for single-engineer, phase-based execution.  
> This file kept for reference only. For current development, follow `15-IMPL-INTEGRATED.md`.

## AI Job Getting System — Infra Roadmap (10 Phases)

**Role:** DevOps / Infrastructure Engineer  
**Timeline:** 5 minggu (paralel dengan Backend & Frontend)  
**Stack:** Docker · Docker Compose · Nginx · PostgreSQL · Redis · Ubuntu 22.04

---

## Overview Timeline

```
Week 1          Week 2          Week 3          Week 4          Week 5
│               │               │               │               │
├─ Phase 1      ├─ Phase 4      ├─ Phase 6      ├─ Phase 8      ├─ Phase 10
│  Local Dev    │  DB Schema    │  Nginx Config  │  Monitoring   │  Go-Live
│  Setup        │  & Migration  │  + SSL         │  + Alerting   │  Checklist
│               │               │               │               │
├─ Phase 2      ├─ Phase 5      ├─ Phase 7      ├─ Phase 9
│  Docker       │  Redis        │  CI/CD         │  Load Test
│  Compose      │  Setup        │  Pipeline      │  + Tuning
│               │               │               │
├─ Phase 3
│  Environment
│  Management
```

---

## Phase 1 — Local Development Environment Setup

**Tujuan:** Semua engineer bisa run project di local dalam satu perintah.  
**Deliverable:** `docker-compose.yml` untuk local dev yang berjalan

### Tasks

**1.1 — Inisialisasi repository monorepo**
```bash
mkdir ai-job-system && cd ai-job-system
git init
mkdir -p apps/backend apps/frontend nginx scripts
touch docker-compose.yml docker-compose.prod.yml .env.example .gitignore README.md
```

**1.2 — Buat `.gitignore`**
```gitignore
# Environment
.env
.env.local
.env.production

# Dependencies
node_modules/
.next/
dist/

# Docker volumes
data/

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
```

**1.3 — Buat `.env.example`**
```bash
# App
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:4000

# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=aijobdb
DB_USER=postgres
DB_PASSWORD=change_this_password

# Redis
REDIS_URL=redis://redis:6379

# JWT
JWT_SECRET=change_this_to_random_256_bit_secret
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-20250514

# Rate limiting
THROTTLE_TTL=900
THROTTLE_LIMIT=100
THROTTLE_AI_LIMIT=10
```

**1.4 — Buat `docker-compose.yml` (development)**
```yaml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    container_name: aijob_postgres
    environment:
      POSTGRES_DB: ${DB_NAME:-aijobdb}
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"       # Expose untuk local DB tools (DBeaver, TablePlus)
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-postgres}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: aijob_redis
    ports:
      - "6379:6379"       # Expose untuk Redis CLI lokal
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  backend:
    build:
      context: ./apps/backend
      dockerfile: Dockerfile.dev
    container_name: aijob_backend
    env_file: .env
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      REDIS_URL: redis://redis:6379
    ports:
      - "4000:4000"
    volumes:
      - ./apps/backend/src:/app/src   # Hot reload
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  frontend:
    build:
      context: ./apps/frontend
      dockerfile: Dockerfile.dev
    container_name: aijob_frontend
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:4000/api
    ports:
      - "3000:3000"
    volumes:
      - ./apps/frontend/src:/app/src  # Hot reload
    depends_on:
      - backend

volumes:
  postgres_data:
  redis_data:
```

**1.5 — Buat `scripts/init.sql`**
```sql
-- Ekstensi yang dibutuhkan
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Untuk full-text search di masa depan
```

**1.6 — Buat `Makefile` untuk shortcut commands**
```makefile
.PHONY: up down reset logs shell-backend shell-db

up:
	docker compose up -d

down:
	docker compose down

reset:
	docker compose down -v && docker compose up -d

logs:
	docker compose logs -f backend

shell-backend:
	docker compose exec backend sh

shell-db:
	docker compose exec postgres psql -U postgres -d aijobdb

migrate:
	docker compose exec backend npm run migration:run

seed:
	docker compose exec backend npm run seed
```

### Definition of Done
- [ ] `make up` berhasil start semua service
- [ ] PostgreSQL accessible di `localhost:5432`
- [ ] Redis accessible di `localhost:6379`
- [ ] Backend hot reload berfungsi
- [ ] Frontend hot reload berfungsi

---

## Phase 2 — Dockerfile Optimization

**Tujuan:** Image Docker yang efisien — build cepat, ukuran kecil, production-ready.  
**Deliverable:** Dockerfile untuk dev dan production masing-masing service

### Tasks

**2.1 — Backend Dockerfile (development)**
```dockerfile
# apps/backend/Dockerfile.dev
FROM node:20-alpine

WORKDIR /app

# Install dependencies dulu (layer cache)
COPY package*.json ./
RUN npm ci

# Source code di-mount via volume (hot reload)
COPY . .

EXPOSE 4000
CMD ["npm", "run", "start:dev"]
```

**2.2 — Backend Dockerfile (production) — multi-stage**
```dockerfile
# apps/backend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# ─── Production stage ───────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Non-root user untuk security
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

RUN chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 4000
CMD ["node", "dist/main.js"]
```

**2.3 — Frontend Dockerfile (development)**
```dockerfile
# apps/frontend/Dockerfile.dev
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]
```

**2.4 — Frontend Dockerfile (production) — multi-stage**
```dockerfile
# apps/frontend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ─── Production stage ───────────────────────────
FROM node:20-alpine AS production

WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
```

**2.5 — `.dockerignore` untuk setiap app**
```dockerignore
node_modules
.next
dist
.env
.env.*
*.log
coverage
.git
README.md
```

### Definition of Done
- [ ] `docker build` berhasil untuk semua Dockerfile
- [ ] Production image backend < 300MB
- [ ] Production image frontend < 200MB
- [ ] Container berjalan sebagai non-root user

---

## Phase 3 — Environment & Secret Management

**Tujuan:** Manajemen environment variable yang aman antara dev, staging, dan production.  
**Deliverable:** Script setup env, dokumentasi secret management

### Tasks

**3.1 — Struktur environment files**
```
.env                  → Local development (git-ignored)
.env.example          → Template untuk semua dev (git-tracked)
.env.staging          → Staging (disimpan di secret manager, TIDAK di repo)
.env.production       → Production (disimpan di secret manager, TIDAK di repo)
```

**3.2 — Script `scripts/setup-env.sh`**
```bash
#!/bin/bash
# Setup environment untuk local dev

if [ -f ".env" ]; then
  echo "⚠️  File .env sudah ada. Tidak di-overwrite."
else
  cp .env.example .env
  
  # Generate JWT secret secara otomatis
  JWT_SECRET=$(openssl rand -hex 32)
  sed -i "s/change_this_to_random_256_bit_secret/$JWT_SECRET/" .env
  
  echo "✅ File .env berhasil dibuat dari .env.example"
  echo "⚠️  Isi ANTHROPIC_API_KEY di .env sebelum menjalankan backend"
fi
```

**3.3 — Validasi environment variable di startup backend**
```typescript
// src/config/env.validation.ts
import { plainToInstance } from 'class-transformer';
import { IsString, IsNumber, validateSync, IsOptional } from 'class-validator';

class EnvironmentVariables {
  @IsString() DATABASE_URL: string;
  @IsString() REDIS_URL: string;
  @IsString() JWT_SECRET: string;
  @IsString() ANTHROPIC_API_KEY: string;
  @IsString() ANTHROPIC_MODEL: string;
  @IsString() @IsOptional() NODE_ENV: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(
      `Environment validation failed:\n${errors.map(e => Object.values(e.constraints ?? {}).join(', ')).join('\n')}`
    );
  }
  return validatedConfig;
}
```

**3.4 — Rotasi secret secara berkala (SOP)**

Dokumentasikan prosedur rotasi:
1. Generate secret baru: `openssl rand -hex 32`
2. Update di secret manager (production)
3. Rolling restart container: `docker compose up -d --no-deps backend`
4. Verifikasi health check

### Definition of Done
- [ ] `scripts/setup-env.sh` berjalan tanpa error
- [ ] Backend crash dengan pesan jelas jika env var tidak ada
- [ ] Tidak ada secret yang ter-commit ke git
- [ ] SOP rotasi secret terdokumentasi

---

## Phase 4 — Database Schema & Migration

**Tujuan:** Database siap pakai dengan schema lengkap dan seed data untuk development.  
**Deliverable:** Migration files, seed script, rollback procedure

### Tasks

**4.1 — Buat migration awal**
```bash
# Di dalam backend container
docker compose exec backend npm run migration:generate -- --name=InitSchema
```

**4.2 — File migration lengkap**

Pastikan migration ini mencakup semua tabel dari `02-ERD.md`:
- `users`
- `profiles`
- `educations`
- `experiences`
- `skills`
- `cvs`
- `ats_results`
- `refresh_tokens`

Serta semua index yang didefinisikan di ERD.

**4.3 — Seed data untuk development**
```typescript
// scripts/seed.ts
// Data seed untuk mempercepat development dan testing:
// - 3 user (free, premium, admin)
// - Masing-masing user punya profil lengkap
// - 2 CV per user (1 generated, 1 tailored)
// - 1 ATS result per CV
```

**4.4 — Buat `npm scripts` di `package.json` backend**
```json
{
  "scripts": {
    "migration:generate": "typeorm migration:generate",
    "migration:run": "typeorm migration:run",
    "migration:revert": "typeorm migration:revert",
    "migration:show": "typeorm migration:show",
    "seed": "ts-node scripts/seed.ts"
  }
}
```

**4.5 — Database backup script**
```bash
#!/bin/bash
# scripts/backup-db.sh
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"

mkdir -p $BACKUP_DIR

docker compose exec postgres pg_dump \
  -U postgres \
  -d aijobdb \
  --clean \
  --if-exists \
  -f "/tmp/backup_$TIMESTAMP.sql"

docker compose cp postgres:/tmp/backup_$TIMESTAMP.sql $BACKUP_DIR/

echo "✅ Backup selesai: $BACKUP_DIR/backup_$TIMESTAMP.sql"
```

### Definition of Done
- [ ] `make migrate` berhasil jalankan semua migration
- [ ] `make seed` berhasil isi data awal
- [ ] `migration:revert` berhasil rollback satu step
- [ ] Backup script berjalan dan menghasilkan file `.sql`

---

## Phase 5 — Redis Configuration & Cache Strategy

**Tujuan:** Redis siap dengan konfigurasi yang optimal untuk use case caching dan session.  
**Deliverable:** Redis config, persistence setup, monitoring dasar

### Tasks

**5.1 — Redis configuration file**
```conf
# redis/redis.conf
bind 0.0.0.0
protected-mode no

# Memory management
maxmemory 256mb
maxmemory-policy allkeys-lru    # Hapus key yang paling lama tidak diakses

# Persistence — RDB snapshot
save 900 1                       # Save jika ada 1 perubahan dalam 15 menit
save 300 10                      # Save jika ada 10 perubahan dalam 5 menit
save 60 10000                    # Save jika ada 10000 perubahan dalam 1 menit

# Logging
loglevel notice
logfile ""

# Slow log (query > 100ms masuk slow log)
slowlog-log-slower-than 100000
slowlog-max-len 128
```

**5.2 — Update docker-compose untuk mount config**
```yaml
redis:
  image: redis:7-alpine
  command: redis-server /usr/local/etc/redis/redis.conf
  volumes:
    - redis_data:/data
    - ./redis/redis.conf:/usr/local/etc/redis/redis.conf
```

**5.3 — Cache key inventory**

Dokumentasikan semua cache key yang digunakan:

| Key Pattern | TTL | Invalidate Trigger |
|-------------|-----|--------------------|
| `profile:{userId}` | 300s (5 menit) | PUT /profile |
| `cvs:{userId}` | 120s (2 menit) | POST /cv/generate, DELETE /cv/:id |
| `cv:{id}` | 120s (2 menit) | PUT /cv/:id |
| `ats:{cvId}:{jdHash}` | 1800s (30 menit) | Tidak ada (immutable) |
| `rl:ai:{userId}` | 900s (15 menit) | Auto-expire (rate limit counter) |
| `rl:general:{userId}` | 900s (15 menit) | Auto-expire |

**5.4 — Script monitoring Redis**
```bash
#!/bin/bash
# scripts/redis-monitor.sh
echo "=== Redis Memory Usage ==="
docker compose exec redis redis-cli INFO memory | grep used_memory_human

echo "=== Total Keys ==="
docker compose exec redis redis-cli DBSIZE

echo "=== Slow Log ==="
docker compose exec redis redis-cli SLOWLOG GET 10

echo "=== Key Distribution ==="
for prefix in profile cvs cv ats rl; do
  count=$(docker compose exec redis redis-cli --scan --pattern "${prefix}:*" | wc -l)
  echo "  $prefix:* → $count keys"
done
```

### Definition of Done
- [ ] Redis start dengan config custom
- [ ] Persistence RDB aktif (verifikasi ada file `dump.rdb`)
- [ ] `maxmemory` terkonfigurasi
- [ ] Cache key inventory terdokumentasi
- [ ] Monitor script berjalan tanpa error

---

## Phase 6 — Nginx Configuration & SSL

**Tujuan:** Nginx sebagai reverse proxy dengan SSL, rate limiting, dan security headers.  
**Deliverable:** Nginx config lengkap, SSL certificate setup

### Tasks

**6.1 — Struktur nginx directory**
```
nginx/
├── nginx.conf              # Main config
├── conf.d/
│   ├── upstream.conf       # Upstream definitions
│   ├── rate-limit.conf     # Rate limiting zones
│   └── aijob.conf          # Server block
└── certs/                  # SSL certificates (git-ignored)
    ├── fullchain.pem
    └── privkey.pem
```

**6.2 — `nginx/conf.d/rate-limit.conf`**
```nginx
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=general:10m     rate=100r/m;
limit_req_zone $binary_remote_addr zone=auth:10m        rate=10r/m;
limit_req_zone $binary_remote_addr zone=ai_endpoint:10m rate=10r/m;

# Connection limiting
limit_conn_zone $binary_remote_addr zone=conn_limit:10m;
```

**6.3 — `nginx/conf.d/aijob.conf`**
```nginx
# HTTP → HTTPS redirect
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL
    ssl_certificate     /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;
    ssl_session_cache   shared:SSL:10m;

    # Security headers
    add_header X-Frame-Options           "DENY"              always;
    add_header X-Content-Type-Options    "nosniff"           always;
    add_header X-XSS-Protection          "1; mode=block"     always;
    add_header Referrer-Policy           "no-referrer"       always;
    add_header Strict-Transport-Security "max-age=31536000"  always;

    # Connection limit
    limit_conn conn_limit 20;

    # Client body size (max upload)
    client_max_body_size 1M;

    # AI endpoints — strict rate limit
    location ~ ^/api/(cv/generate|cv/.+/tailor|ats/analyze) {
        limit_req zone=ai_endpoint burst=3 nodelay;
        limit_req_status 429;

        proxy_pass         http://backend;
        proxy_http_version 1.1;
        proxy_read_timeout 60s;   # AI butuh waktu lebih lama
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }

    # Auth endpoints — moderate rate limit
    location ~ ^/api/auth/ {
        limit_req zone=auth burst=5 nodelay;
        limit_req_status 429;

        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Other API endpoints
    location /api/ {
        limit_req zone=general burst=20 nodelay;
        limit_req_status 429;

        proxy_pass         http://backend;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }

    # Frontend (Next.js)
    location / {
        proxy_pass         http://frontend;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # PDF export — no body size limit
    location ~ ^/api/cv/.+/export/pdf {
        proxy_pass          http://backend;
        proxy_read_timeout  30s;
        proxy_buffer_size   128k;
        proxy_buffers       4 256k;
    }
}
```

**6.4 — SSL Certificate dengan Let's Encrypt**
```bash
#!/bin/bash
# scripts/setup-ssl.sh
DOMAIN="yourdomain.com"
EMAIL="admin@yourdomain.com"

# Install certbot
apt-get update && apt-get install -y certbot

# Generate certificate
certbot certonly \
  --standalone \
  --preferred-challenges http \
  --email $EMAIL \
  --agree-tos \
  --no-eff-email \
  -d $DOMAIN \
  -d www.$DOMAIN

# Copy ke nginx/certs
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ./nginx/certs/
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem   ./nginx/certs/

echo "✅ SSL certificate berhasil di-setup"
```

**6.5 — Cron untuk auto-renew SSL**
```bash
# Tambahkan ke crontab: crontab -e
0 3 * * * certbot renew --quiet && docker compose exec nginx nginx -s reload
```

### Definition of Done
- [ ] HTTP redirect ke HTTPS berfungsi
- [ ] SSL certificate valid (verifikasi di browser)
- [ ] Rate limiting aktif — test 429 response
- [ ] Security headers terverifikasi (gunakan securityheaders.com)
- [ ] AI endpoint timeout 60 detik (bukan default 60)

---

## Phase 7 — CI/CD Pipeline

**Tujuan:** Deployment otomatis yang aman dengan rollback capability.  
**Deliverable:** GitHub Actions workflow, deploy script, rollback script

### Tasks

**7.1 — GitHub Actions workflow**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install & Test Backend
        working-directory: apps/backend
        run: |
          npm ci
          npm run lint
          npm test -- --coverage

      - name: Install & Test Frontend
        working-directory: apps/frontend
        run: |
          npm ci
          npm run lint
          npm test -- --coverage

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build Docker images
        run: |
          docker build -t aijob-backend:${{ github.sha }} ./apps/backend
          docker build -t aijob-frontend:${{ github.sha }} ./apps/frontend

      - name: Deploy to VPS
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/ai-job-system
            git pull origin main
            docker compose -f docker-compose.prod.yml pull
            docker compose -f docker-compose.prod.yml up -d --no-deps backend frontend
            docker compose -f docker-compose.prod.yml exec backend npm run migration:run
            echo "✅ Deploy selesai: $(date)"
```

**7.2 — Deploy script manual**
```bash
#!/bin/bash
# scripts/deploy.sh
set -e

COMPOSE_FILE="docker-compose.prod.yml"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🚀 Memulai deployment — $TIMESTAMP"

# 1. Backup database sebelum deploy
echo "📦 Backup database..."
bash scripts/backup-db.sh

# 2. Pull kode terbaru
echo "📥 Pull kode terbaru..."
git pull origin main

# 3. Build image baru
echo "🔨 Build Docker images..."
docker compose -f $COMPOSE_FILE build --no-cache backend frontend

# 4. Run migrations
echo "🗄️  Running migrations..."
docker compose -f $COMPOSE_FILE run --rm backend npm run migration:run

# 5. Rolling restart (zero downtime)
echo "🔄 Restart services..."
docker compose -f $COMPOSE_FILE up -d --no-deps --force-recreate backend frontend

# 6. Health check
echo "🏥 Health check..."
sleep 10
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/api/health)
if [ "$HEALTH" != "200" ]; then
  echo "❌ Health check gagal! Rollback..."
  bash scripts/rollback.sh
  exit 1
fi

echo "✅ Deploy berhasil — $TIMESTAMP"
```

**7.3 — Rollback script**
```bash
#!/bin/bash
# scripts/rollback.sh
COMPOSE_FILE="docker-compose.prod.yml"

echo "⏮️  Rollback ke versi sebelumnya..."

# Rollback image ke tag sebelumnya
docker compose -f $COMPOSE_FILE stop backend frontend
docker tag aijob-backend:previous aijob-backend:latest
docker tag aijob-frontend:previous aijob-frontend:latest
docker compose -f $COMPOSE_FILE up -d --no-deps backend frontend

# Rollback migration jika perlu
# docker compose -f $COMPOSE_FILE exec backend npm run migration:revert

echo "✅ Rollback selesai"
```

**7.4 — Health check endpoint**
```typescript
// Backend: GET /api/health
@Get('health')
health() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
  };
}
```

### Definition of Done
- [ ] Push ke `main` trigger GitHub Actions
- [ ] Test gagal = deploy tidak jalan
- [ ] Deploy script berjalan end-to-end
- [ ] Rollback script berjalan dan restore service
- [ ] Health check endpoint return 200

---

## Phase 8 — Monitoring & Logging

**Tujuan:** Visibilitas penuh terhadap kesehatan sistem dan error di production.  
**Deliverable:** Logging terpusat, uptime monitoring, alert dasar

### Tasks

**8.1 — Structured logging untuk backend**
```typescript
// Konfigurasi logger di NestJS dengan format JSON untuk production
// Format: { timestamp, level, context, message, ...meta }
// Di development: pretty print
// Di production: JSON (mudah di-parse oleh log aggregator)
```

**8.2 — Log rotation**
```yaml
# docker-compose.prod.yml — tambahkan logging config ke semua service
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "50m"
        max-file: "5"

  frontend:
    logging:
      driver: "json-file"
      options:
        max-size: "20m"
        max-file: "3"
```

**8.3 — Monitoring script harian**
```bash
#!/bin/bash
# scripts/health-check.sh — jalankan tiap 5 menit via cron

WEBHOOK_URL="${SLACK_WEBHOOK_URL}"  # Opsional: alert ke Slack

check_service() {
  local name=$1
  local url=$2
  local status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url")

  if [ "$status" != "200" ]; then
    echo "❌ $name DOWN (HTTP $status)"
    if [ -n "$WEBHOOK_URL" ]; then
      curl -s -X POST "$WEBHOOK_URL" \
        -H 'Content-type: application/json' \
        -d "{\"text\":\"🚨 ALERT: $name down! HTTP $status\"}"
    fi
    return 1
  fi
  echo "✅ $name UP"
}

check_service "Backend API" "http://localhost:4000/api/health"
check_service "Frontend"    "http://localhost:3000"

# Cek disk usage
DISK=$(df -h / | awk 'NR==2 {print $5}' | tr -d '%')
if [ "$DISK" -gt 80 ]; then
  echo "⚠️  Disk usage tinggi: ${DISK}%"
fi

# Cek memory
FREE_MEM=$(free -m | awk 'NR==2 {print $4}')
if [ "$FREE_MEM" -lt 256 ]; then
  echo "⚠️  Memory rendah: ${FREE_MEM}MB tersisa"
fi
```

**8.4 — Cron setup untuk monitoring**
```bash
# crontab -e
*/5 * * * * /opt/ai-job-system/scripts/health-check.sh >> /var/log/aijob-health.log 2>&1
0 2 * * * /opt/ai-job-system/scripts/backup-db.sh >> /var/log/aijob-backup.log 2>&1
```

### Definition of Done
- [ ] Log tersimpan di file dengan rotation
- [ ] Health check script berjalan setiap 5 menit
- [ ] Backup DB berjalan setiap hari jam 02.00
- [ ] Alert berfungsi ketika service down

---

## Phase 9 — Load Testing & Performance Tuning

**Tujuan:** Sistem mampu menangani 50 concurrent users tanpa degradasi signifikan.  
**Deliverable:** Load test report, tuning recommendations, kapasitas terdokumentasi

### Tasks

**9.1 — Jalankan k6 load test**
```bash
# Install k6
brew install k6  # macOS

# Run load test
k6 run \
  --env BASE_URL=https://yourdomain.com \
  --env TEST_EMAIL=loadtest@example.com \
  --env TEST_PASSWORD=LoadTest123 \
  k6/cv-generate.test.js
```

**9.2 — PostgreSQL connection pooling**
```typescript
// apps/backend/src/config/database.config.ts
export const databaseConfig = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  extra: {
    max: 20,          // Max connections di pool
    min: 2,           // Min connections (selalu siap)
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
};
```

**9.3 — Redis connection pooling**
```typescript
// ioredis sudah built-in connection pooling
// Konfigurasi tambahan:
const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 100, 3000),
  lazyConnect: true,
});
```

**9.4 — Nginx worker tuning**
```nginx
# nginx/nginx.conf
worker_processes auto;          # Sesuai jumlah CPU core
worker_rlimit_nofile 65535;

events {
  worker_connections 1024;
  use epoll;
  multi_accept on;
}

http {
  keepalive_timeout 65;
  keepalive_requests 100;
  sendfile on;
  tcp_nopush on;
  tcp_nodelay on;
  gzip on;
  gzip_types text/plain application/json;
}
```

### Definition of Done
- [ ] Load test report tersimpan sebagai artifact
- [ ] p95 response time memenuhi target (AI < 10s, non-AI < 500ms)
- [ ] Error rate < 5% pada 50 concurrent users
- [ ] Tidak ada memory leak setelah 10 menit load test

---

## Phase 10 — Go-Live Checklist & Production Hardening

**Tujuan:** Validasi final sebelum domain publik dibuka.  
**Deliverable:** Go-live report, runbook operasional

### Tasks

**10.1 — Security hardening checklist**
```bash
#!/bin/bash
# scripts/security-check.sh

echo "=== Security Checklist ==="

# 1. Tidak ada port DB yang expose ke publik
if ss -tlnp | grep -q ":5432"; then
  echo "⚠️  Port 5432 (PostgreSQL) expose ke publik!"
else
  echo "✅ PostgreSQL tidak expose ke publik"
fi

# 2. Container tidak berjalan sebagai root
BACKEND_USER=$(docker compose exec backend whoami)
if [ "$BACKEND_USER" = "root" ]; then
  echo "⚠️  Backend container berjalan sebagai root!"
else
  echo "✅ Backend berjalan sebagai user: $BACKEND_USER"
fi

# 3. ENV vars tidak ada di image
if docker inspect aijob-backend | grep -q "ANTHROPIC_API_KEY"; then
  echo "⚠️  API key bisa jadi ada di Docker image!"
else
  echo "✅ Tidak ada hardcoded env di image"
fi

# 4. SSL aktif
SSL_STATUS=$(curl -Is https://yourdomain.com | head -1)
echo "SSL status: $SSL_STATUS"
```

**10.2 — Final go-live checklist**

**Infra:**
- [ ] Docker Compose production berjalan di VPS
- [ ] SSL certificate valid dan auto-renew terkonfigurasi
- [ ] HTTP redirect ke HTTPS aktif
- [ ] Rate limiting terverifikasi (test manual dengan curl)
- [ ] Semua port internal tidak expose ke publik (5432, 6379, 3000, 4000)
- [ ] Backup otomatis aktif dan tested restore
- [ ] Monitoring + alert aktif
- [ ] Log rotation terkonfigurasi
- [ ] Non-root user di semua container
- [ ] Health check endpoint `/api/health` return 200

**Database:**
- [ ] Semua migration sudah di-run di production
- [ ] Index ada dan diverifikasi dengan `EXPLAIN ANALYZE`
- [ ] Connection pool terkonfigurasi
- [ ] Backup manual dilakukan sebelum go-live

**Performance:**
- [ ] Load test passed (p95 < target, error < 5%)
- [ ] PostgreSQL connection pool tidak exhausted di load test
- [ ] Redis memory usage di bawah 80% dari `maxmemory`

**10.3 — Runbook operasional**

Dokumentasikan prosedur rutin:

| Situasi | Langkah |
|---------|---------|
| Backend down | `docker compose restart backend` → cek log → cek DB connection |
| Database penuh | Cek dengan `df -h` → archive data lama → expand volume |
| Redis penuh | `redis-cli FLUSHDB` (hati-hati!) atau scale up memory |
| Deploy gagal | Jalankan `scripts/rollback.sh` |
| SSL expired | `certbot renew` → `nginx -s reload` |
| High CPU | Cek `docker stats` → identifikasi container → restart jika perlu |

**10.4 — Soft launch procedure**
```
Hari H-1:
  ✓ Final deploy ke production
  ✓ Smoke test semua endpoint
  ✓ Backup database
  ✓ Semua alert aktif

Hari H (Go-Live):
  ✓ Buka akses ke early users (50 user pertama)
  ✓ Monitor dashboard selama 2 jam pertama
  ✓ Standby untuk rollback jika ada issue kritis
  
Hari H+1:
  ✓ Review logs dari hari pertama
  ✓ Periksa error rate dan response time
  ✓ Tindak lanjut bug yang ditemukan
```

### Definition of Done
- [ ] Security check script berjalan tanpa warning
- [ ] Go-live checklist 100% centang
- [ ] Runbook terdokumentasi dan accessible oleh semua engineer
- [ ] Tim siap standby selama 2 jam pertama go-live
