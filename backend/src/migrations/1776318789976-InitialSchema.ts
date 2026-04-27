import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1776318789976 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create users table
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying(255) NOT NULL,
                "password_hash" character varying(255) NOT NULL,
                "full_name" character varying(255) NOT NULL,
                "plan" character varying(20) NOT NULL DEFAULT 'free',
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);

        // Create unique index on email
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_users_email" ON "users" ("email")
        `);

        // Create profiles table
        await queryRunner.query(`
            CREATE TABLE "profiles" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "target_role" character varying(255),
                "phone" character varying(50),
                "location" character varying(255),
                "linkedin_url" character varying(500),
                "portfolio_url" character varying(500),
                "summary" text,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_8e520eb4da7dc01d0e190447c8e" PRIMARY KEY ("id")
            )
        `);

        // Create unique index on user_id for profiles
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_profiles_user_id" ON "profiles" ("user_id")
        `);

        // Create educations table
        await queryRunner.query(`
            CREATE TABLE "educations" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "profile_id" uuid NOT NULL,
                "institution" character varying(255) NOT NULL,
                "degree" character varying(100),
                "major" character varying(255),
                "gpa" numeric(3,2),
                "start_year" integer,
                "end_year" integer,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_7d6edaa6b8d2c4e0b3e4e4e4e4e" PRIMARY KEY ("id")
            )
        `);

        // Create experiences table
        await queryRunner.query(`
            CREATE TABLE "experiences" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "profile_id" uuid NOT NULL,
                "company" character varying(255) NOT NULL,
                "position" character varying(255) NOT NULL,
                "start_date" date NOT NULL,
                "end_date" date,
                "is_current" boolean NOT NULL DEFAULT false,
                "description" text,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_5debd823b88cc0969d237f6165a" PRIMARY KEY ("id")
            )
        `);

        // Create skills table
        await queryRunner.query(`
            CREATE TABLE "skills" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "profile_id" uuid NOT NULL,
                "name" character varying(100) NOT NULL,
                "category" character varying(20) NOT NULL,
                "level" character varying(20),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_4c88e956195bba85977da21b8f4" PRIMARY KEY ("id")
            )
        `);

        // Create cvs table
        await queryRunner.query(`
            CREATE TABLE "cvs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "title" character varying(255) NOT NULL,
                "content" jsonb NOT NULL,
                "plain_text" text,
                "type" character varying(20) NOT NULL,
                "parent_cv_id" uuid,
                "status" character varying(20) NOT NULL DEFAULT 'draft',
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_2c4c6c7b8d9e0f1a2b3c4d5e6f7" PRIMARY KEY ("id")
            )
        `);

        // Create ats_results table
        await queryRunner.query(`
            CREATE TABLE "ats_results" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "cv_id" uuid NOT NULL,
                "user_id" uuid NOT NULL,
                "job_description" text NOT NULL,
                "job_title" character varying(255),
                "company_name" character varying(255),
                "score" integer,
                "matched_keywords" jsonb,
                "missing_keywords" jsonb,
                "suggestions" jsonb,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_8e9f0a1b2c3d4e5f6a7b8c9d0e1" PRIMARY KEY ("id"),
                CONSTRAINT "CHK_ats_results_score" CHECK ("score" >= 0 AND "score" <= 100)
            )
        `);

        // Create refresh_tokens table
        await queryRunner.query(`
            CREATE TABLE "refresh_tokens" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "token_hash" character varying(255) NOT NULL,
                "expires_at" TIMESTAMP NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "revoked_at" TIMESTAMP,
                CONSTRAINT "PK_7d6edaa6b8d2c4e0b3e4e4e4e4f" PRIMARY KEY ("id")
            )
        `);

        // Add foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "profiles" ADD CONSTRAINT "FK_profiles_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "educations" ADD CONSTRAINT "FK_educations_profile_id" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "experiences" ADD CONSTRAINT "FK_experiences_profile_id" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "skills" ADD CONSTRAINT "FK_skills_profile_id" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "cvs" ADD CONSTRAINT "FK_cvs_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "cvs" ADD CONSTRAINT "FK_cvs_parent_cv_id" FOREIGN KEY ("parent_cv_id") REFERENCES "cvs"("id") ON DELETE SET NULL ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "ats_results" ADD CONSTRAINT "FK_ats_results_cv_id" FOREIGN KEY ("cv_id") REFERENCES "cvs"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "ats_results" ADD CONSTRAINT "FK_ats_results_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_refresh_tokens_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // Create indexes for performance
        await queryRunner.query(`
            CREATE INDEX "idx_profiles_user_id" ON "profiles" ("user_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_educations_profile_id" ON "educations" ("profile_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_experiences_profile_id" ON "experiences" ("profile_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_skills_profile_id" ON "skills" ("profile_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_cvs_user_id" ON "cvs" ("user_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_cvs_parent_cv_id" ON "cvs" ("parent_cv_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_ats_results_cv_id" ON "ats_results" ("cv_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_ats_results_user_id" ON "ats_results" ("user_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_refresh_tokens_user_id" ON "refresh_tokens" ("user_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_refresh_tokens_token_hash" ON "refresh_tokens" ("token_hash")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX "idx_refresh_tokens_token_hash"`);
        await queryRunner.query(`DROP INDEX "idx_refresh_tokens_user_id"`);
        await queryRunner.query(`DROP INDEX "idx_ats_results_user_id"`);
        await queryRunner.query(`DROP INDEX "idx_ats_results_cv_id"`);
        await queryRunner.query(`DROP INDEX "idx_cvs_parent_cv_id"`);
        await queryRunner.query(`DROP INDEX "idx_cvs_user_id"`);
        await queryRunner.query(`DROP INDEX "idx_skills_profile_id"`);
        await queryRunner.query(`DROP INDEX "idx_experiences_profile_id"`);
        await queryRunner.query(`DROP INDEX "idx_educations_profile_id"`);
        await queryRunner.query(`DROP INDEX "idx_profiles_user_id"`);
        await queryRunner.query(`DROP INDEX "idx_users_email"`);

        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_refresh_tokens_user_id"`);
        await queryRunner.query(`ALTER TABLE "ats_results" DROP CONSTRAINT "FK_ats_results_user_id"`);
        await queryRunner.query(`ALTER TABLE "ats_results" DROP CONSTRAINT "FK_ats_results_cv_id"`);
        await queryRunner.query(`ALTER TABLE "cvs" DROP CONSTRAINT "FK_cvs_parent_cv_id"`);
        await queryRunner.query(`ALTER TABLE "cvs" DROP CONSTRAINT "FK_cvs_user_id"`);
        await queryRunner.query(`ALTER TABLE "skills" DROP CONSTRAINT "FK_skills_profile_id"`);
        await queryRunner.query(`ALTER TABLE "experiences" DROP CONSTRAINT "FK_experiences_profile_id"`);
        await queryRunner.query(`ALTER TABLE "educations" DROP CONSTRAINT "FK_educations_profile_id"`);
        await queryRunner.query(`ALTER TABLE "profiles" DROP CONSTRAINT "FK_profiles_user_id"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "refresh_tokens"`);
        await queryRunner.query(`DROP TABLE "ats_results"`);
        await queryRunner.query(`DROP TABLE "cvs"`);
        await queryRunner.query(`DROP TABLE "skills"`);
        await queryRunner.query(`DROP TABLE "experiences"`);
        await queryRunner.query(`DROP TABLE "educations"`);
        await queryRunner.query(`DROP TABLE "profiles"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
