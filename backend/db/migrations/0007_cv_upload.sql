-- =============================================================================
-- Migration: CV builder — uploading an existing CV (Phase 6)
--
-- Records the provenance of a CV that was imported from a file rather than
-- built in the wizard, and keeps the text extracted from the upload so it can
-- be re-parsed later and searched by the job analyzer:
--
--   original_filename — the name of the uploaded file (e.g. "jane-cv.pdf").
--   mime_type         — the content type the browser reported for it.
--   upload_source     — how the CV entered the account ('wizard' | 'upload').
--   uploaded_at       — when the file was imported.
--   raw_text          — the text extracted from the file, capped on write.
--
-- Idempotent and pg-mem safe: plain `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
-- statements only (the in-memory database used by dev/test cannot run `DO $$`
-- blocks). Existing rows simply get NULLs, which reads as "built in the
-- wizard".
--
-- Run:  npm run db:migrate   (against DATABASE_URL)
-- =============================================================================

ALTER TABLE student_cvs ADD COLUMN IF NOT EXISTS original_filename VARCHAR(255);
ALTER TABLE student_cvs ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100);
ALTER TABLE student_cvs ADD COLUMN IF NOT EXISTS upload_source VARCHAR(20);
ALTER TABLE student_cvs ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ;
ALTER TABLE student_cvs ADD COLUMN IF NOT EXISTS raw_text TEXT;