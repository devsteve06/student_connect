-- =============================================================================
-- 0008_job_posting_lifecycle.sql — job postings close; in-app notifications
-- =============================================================================
-- Phase 1 of JOB_POSTING_PLAN.md. Two changes:
--
--   placements.status    — 'Open' | 'Closed'. A firm can close a posting, and
--   placements.closed_at   the posting auto-closes when a candidate is
--                          Approved. Nullable columns defaulted so seeded and
--                          pre-existing rows read as 'Open'.
--
--   notifications        — in-app notifications powering the dashboard badges.
--                          Recipient is two nullable FK columns with a CHECK
--                          that exactly one is set (referential integrity over
--                          a polymorphic user_role + user_id pair). `type` is
--                          deliberately NOT constrained so new event kinds do
--                          not need a migration; the known values are
--                          'new_posting', 'application_received' and
--                          'application_update'.
--
-- Idempotent: only ADD COLUMN IF NOT EXISTS / CREATE TABLE IF NOT EXISTS /
-- CREATE INDEX IF NOT EXISTS, so pg-mem (tests) can execute it too.
--
-- Run:  npm run db:migrate   (against DATABASE_URL)
-- =============================================================================

ALTER TABLE placements ADD COLUMN IF NOT EXISTS status     VARCHAR(20) NOT NULL DEFAULT 'Open'
    CHECK (status IN ('Open','Closed'));
ALTER TABLE placements ADD COLUMN IF NOT EXISTS closed_at  TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS notifications (
    id          SERIAL PRIMARY KEY,
    student_id  INTEGER      NULL REFERENCES students(id) ON DELETE CASCADE,
    firm_id     INTEGER      NULL REFERENCES firms(id)    ON DELETE CASCADE,
    type        VARCHAR(40)  NOT NULL,
    title       VARCHAR(200) NOT NULL,
    body        TEXT,
    link        VARCHAR(200),
    is_read     BOOLEAN      NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    -- exactly one recipient: a row is addressed to a student XOR a firm
    CHECK ((student_id IS NOT NULL AND firm_id IS NULL)
        OR (student_id IS NULL AND firm_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_notifications_student ON notifications(student_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_firm    ON notifications(firm_id, is_read);
CREATE INDEX IF NOT EXISTS idx_placements_status     ON placements(firm_id, status);
