CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "email" character varying(255) NOT NULL UNIQUE,
    "password_hash" character varying(255),
    "full_name" character varying(255) NOT NULL,
    "public_slug" character varying(255) UNIQUE,
    "plan" character varying(20) NOT NULL DEFAULT 'free',
    "role" character varying(20) NOT NULL DEFAULT 'user',
    "created_at" TIMESTAMP NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

ALTER TABLE "users"
    ADD COLUMN IF NOT EXISTS "role" character varying(20) NOT NULL DEFAULT 'user';

ALTER TABLE "users"
    ADD COLUMN IF NOT EXISTS "public_slug" character varying(255);

-- Create refresh_tokens table
CREATE TABLE IF NOT EXISTS "refresh_tokens" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "token_hash" character varying(255) NOT NULL,
    "expires_at" TIMESTAMP NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT now(),
    "revoked_at" TIMESTAMP,
    PRIMARY KEY ("id")
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS "profiles" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
    "target_role" character varying(255),
    "phone" character varying(50),
    "location" character varying(255),
    "linkedin_url" character varying(500),
    "portfolio_url" character varying(500),
    "summary" text,
    "created_at" TIMESTAMP NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

-- Create educations table
CREATE TABLE IF NOT EXISTS "educations" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "profile_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
    "institution" character varying(255) NOT NULL,
    "degree" character varying(100),
    "major" character varying(255),
    "gpa" numeric(3,2),
    "start_year" integer,
    "end_year" integer,
    "created_at" TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

-- Create experiences table
CREATE TABLE IF NOT EXISTS "experiences" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "profile_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
    "company" character varying(255) NOT NULL,
    "position" character varying(255) NOT NULL,
    "start_date" date NOT NULL,
    "end_date" date,
    "is_current" boolean NOT NULL DEFAULT false,
    "description" text,
    "created_at" TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

-- Create skills table
CREATE TABLE IF NOT EXISTS "skills" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "profile_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
    "name" character varying(100) NOT NULL,
    "category" character varying(20) NOT NULL,
    "level" character varying(20),
    "created_at" TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

-- Create cvs table
CREATE TABLE IF NOT EXISTS "cvs" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "title" character varying(255) NOT NULL,
    "content" jsonb NOT NULL,
    "plain_text" text,
    "type" character varying(20) NOT NULL DEFAULT 'generated',
    "parent_cv_id" uuid REFERENCES "cvs"("id") ON DELETE SET NULL,
    "status" character varying(20) NOT NULL DEFAULT 'draft',
    "is_public" boolean NOT NULL DEFAULT false,
    "created_at" TIMESTAMP NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

ALTER TABLE "cvs"
    ADD COLUMN IF NOT EXISTS "is_public" boolean NOT NULL DEFAULT false;

-- Create ats_results table
CREATE TABLE IF NOT EXISTS "ats_results" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "cv_id" uuid NOT NULL REFERENCES "cvs"("id") ON DELETE CASCADE,
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "job_description" text NOT NULL,
    "job_title" character varying(255),
    "company_name" character varying(255),
    "score" integer NOT NULL DEFAULT 0,
    "matched_keywords" jsonb,
    "missing_keywords" jsonb,
    "suggestions" jsonb,
    "created_at" TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON "users"("email");
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_public_slug ON "users"("public_slug");
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON "profiles"("user_id");
CREATE INDEX IF NOT EXISTS idx_educations_profile_id ON "educations"("profile_id");
CREATE INDEX IF NOT EXISTS idx_experiences_profile_id ON "experiences"("profile_id");
CREATE INDEX IF NOT EXISTS idx_skills_profile_id ON "skills"("profile_id");
CREATE INDEX IF NOT EXISTS idx_cvs_user_id ON "cvs"("user_id");
CREATE INDEX IF NOT EXISTS idx_cvs_user_public ON "cvs"("user_id", "is_public");
CREATE INDEX IF NOT EXISTS idx_ats_results_cv_id ON "ats_results"("cv_id");
CREATE INDEX IF NOT EXISTS idx_ats_results_user_id ON "ats_results"("user_id");
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON "refresh_tokens"("user_id");
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON "refresh_tokens"("token_hash");
