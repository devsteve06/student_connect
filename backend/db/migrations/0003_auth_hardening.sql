-- =============================================================================
-- 0003_auth_hardening.sql — per-account brute-force lockout + login audit
-- =============================================================================
-- Adds login_attempts, locked_until, and last_login_at to every role table
-- (admins, students, firms, universities) so failed-login throttling can be
-- tracked per account instead of only per IP. All columns are additive and
-- idempotent (ADD COLUMN IF NOT EXISTS), so a re-run is a no-op.
--
-- Columns mirror the three-place rule:
--   backend/db/migrations/0003_auth_hardening.sql  (this file — real PostgreSQL)
--   backend/sql/schema.sql                          (pg-mem dev seed)
--   backend/db/migrations/0001_init.sql             (fresh-build bootstrap)
-- =============================================================================

-- admins
ALTER TABLE admins ADD COLUMN IF NOT EXISTS login_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS locked_until   TIMESTAMPTZ;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS last_login_at  TIMESTAMPTZ;

-- students
ALTER TABLE students ADD COLUMN IF NOT EXISTS login_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS locked_until   TIMESTAMPTZ;
ALTER TABLE students ADD COLUMN IF NOT EXISTS last_login_at  TIMESTAMPTZ;

-- firms
ALTER TABLE firms ADD COLUMN IF NOT EXISTS login_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE firms ADD COLUMN IF NOT EXISTS locked_until   TIMESTAMPTZ;
ALTER TABLE firms ADD COLUMN IF NOT EXISTS last_login_at  TIMESTAMPTZ;

-- universities
ALTER TABLE universities ADD COLUMN IF NOT EXISTS login_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE universities ADD COLUMN IF NOT EXISTS locked_until   TIMESTAMPTZ;
ALTER TABLE universities ADD COLUMN IF NOT EXISTS last_login_at  TIMESTAMPTZ;
