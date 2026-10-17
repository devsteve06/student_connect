-- =============================================================================
-- 0003_firm_affiliation.sql — link firms to the university they partner with
-- =============================================================================
-- Signup now collects a university for firm accounts (students already carry
-- students.university_id). The column is nullable so pre-existing firms and the
-- demo seed keep working; new signups always supply one.
--
-- Idempotent: safe to re-run against a database that already has the column.
-- Only ADD COLUMN / CREATE INDEX are used, so pg-mem (tests) can execute it too.
--
-- Run:  npm run db:migrate   (against DATABASE_URL)

ALTER TABLE firms ADD COLUMN IF NOT EXISTS university_id INTEGER REFERENCES universities(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_firms_university ON firms(university_id);
