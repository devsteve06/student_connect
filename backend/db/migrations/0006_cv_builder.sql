-- =============================================================================
-- Migration: CV builder storage (Phase 1 — backend CRUD)
--
-- Adds the two tables backing the student CV wizard:
--   * student_cvs  — the versioned CVs a student saves (one primary at a time).
--   * cv_analyses  — job-analyzer runs, created in Phase 4.
--
-- Idempotent — safe to run against an existing database without wiping data
-- (unlike schema.sql, which drops tables).
--
-- Run:  npm run db:migrate   (against DATABASE_URL)
-- =============================================================================

CREATE TABLE IF NOT EXISTS student_cvs (
    id                SERIAL PRIMARY KEY,
    student_id        INTEGER     NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    title             VARCHAR(150) NOT NULL DEFAULT '',
    is_primary        BOOLEAN     NOT NULL DEFAULT false,
    personal_info     JSONB,
    professional_summary TEXT,
    education         JSONB,
    experience        JSONB,
    skills            JSONB,
    projects          JSONB,
    certifications    JSONB,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_cvs_student ON student_cvs(student_id);

CREATE TABLE IF NOT EXISTS cv_analyses (
    id                SERIAL PRIMARY KEY,
    student_id        INTEGER     NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    cv_id             INTEGER          NULL REFERENCES student_cvs(id) ON DELETE SET NULL,
    placement_id      INTEGER          NULL REFERENCES placements(id) ON DELETE SET NULL,
    job_title         VARCHAR(150),
    job_description   TEXT,
    match_score       INTEGER,
    keyword_match     JSONB,
    gap_analysis      TEXT,
    section_scores    JSONB,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cv_analyses_student ON cv_analyses(student_id);
