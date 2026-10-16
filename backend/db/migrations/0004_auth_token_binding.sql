-- =============================================================================
-- 0004_auth_token_binding.sql — bind JWTs to password change time
-- =============================================================================
-- Adds password_changed_at to every role table (admins, students, firms,
-- universities). Set at registration and on every password change, and included
-- in the JWT payload so protect() can reject tokens issued before a password
-- rotation. All columns are additive and idempotent.
--
-- Columns mirror the three-place rule:
--   backend/db/migrations/0004_auth_token_binding.sql  (this file — real PostgreSQL)
--   backend/sql/schema.sql                          (pg-mem dev seed)
--   backend/db/migrations/0001_init.sql             (fresh-build bootstrap)
-- =============================================================================

ALTER TABLE admins ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;

ALTER TABLE students ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;

ALTER TABLE firms ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;

ALTER TABLE universities ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;
