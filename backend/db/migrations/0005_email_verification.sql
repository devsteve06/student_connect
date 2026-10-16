-- =============================================================================
-- 0005_email_verification.sql — email verification for self-service signup
-- =============================================================================
-- Adds email_verified, verification_token, and verification_expires_at to every
-- role table (admins, students, firms, universities). Self-service registrations
-- start unverified; admin-provisioned accounts start verified. All columns are
-- additive and idempotent.
--
-- Columns mirror the three-place rule:
--   backend/db/migrations/0005_email_verification.sql  (this file — real PostgreSQL)
--   backend/sql/schema.sql                          (pg-mem dev seed)
--   backend/db/migrations/0001_init.sql             (fresh-build bootstrap)
-- =============================================================================

-- admins
ALTER TABLE admins ADD COLUMN IF NOT EXISTS email_verified       BOOLEAN      NOT NULL DEFAULT false;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS verification_token   VARCHAR(255);
ALTER TABLE admins ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMPTZ;

-- students
ALTER TABLE students ADD COLUMN IF NOT EXISTS email_verified       BOOLEAN      NOT NULL DEFAULT false;
ALTER TABLE students ADD COLUMN IF NOT EXISTS verification_token   VARCHAR(255);
ALTER TABLE students ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMPTZ;

-- firms
ALTER TABLE firms ADD COLUMN IF NOT EXISTS email_verified       BOOLEAN      NOT NULL DEFAULT false;
ALTER TABLE firms ADD COLUMN IF NOT EXISTS verification_token   VARCHAR(255);
ALTER TABLE firms ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMPTZ;

-- universities
ALTER TABLE universities ADD COLUMN IF NOT EXISTS email_verified       BOOLEAN      NOT NULL DEFAULT false;
ALTER TABLE universities ADD COLUMN IF NOT EXISTS verification_token   VARCHAR(255);
ALTER TABLE universities ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMPTZ;
