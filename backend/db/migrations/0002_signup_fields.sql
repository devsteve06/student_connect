-- =============================================================================
-- 0002_signup_fields.sql — persist everything the signup forms collect
-- =============================================================================
-- The student/firm/university registration forms asked for details the tables
-- had nowhere to store, so those values were accepted by the API and then
-- silently discarded. These ALTERs are additive and idempotent.
--
--   firms.contact_person       — named contact at the company
--   universities.staff_id      — faculty/staff identifier
--   universities.department    — faculty or department requesting access
--
-- firms.industry already exists in 0001_init; it is repeated with IF NOT EXISTS
-- so this migration also repairs databases whose firms table predates it.

ALTER TABLE firms ADD COLUMN IF NOT EXISTS industry       VARCHAR(120);
ALTER TABLE firms ADD COLUMN IF NOT EXISTS contact_person VARCHAR(120);

ALTER TABLE universities ADD COLUMN IF NOT EXISTS staff_id   VARCHAR(50);
ALTER TABLE universities ADD COLUMN IF NOT EXISTS department VARCHAR(150);
