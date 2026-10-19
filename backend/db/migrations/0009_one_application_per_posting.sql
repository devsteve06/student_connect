-- =============================================================================
-- 0009_one_application_per_posting.sql — apply to an internship only once
-- =============================================================================
-- "A student should not apply for the same internship twice."
--
-- applyForPlacement refuses a repeat submission with a 409, and this index
-- makes it a database invariant too, so two concurrent requests cannot slip a
-- duplicate past the check.
--
-- The identity of an internship is the firm + role pair, matching how
-- applyForPlacement resolves a posting. Keying on that pair rather than
-- placement_id also covers applications whose posting has since been deleted
-- (placement_id becomes NULL via ON DELETE SET NULL).
--
-- The DELETE reconciles any duplicates that predate the constraint by keeping
-- the earliest row of each group, so applying this to a live database cannot
-- fail half-way. It is written with the derived-table shape because that is the
-- one variant both PostgreSQL and pg-mem parse — pg-mem runs this very file in
-- the migration tests.

DELETE FROM applications
 WHERE id NOT IN (
   SELECT keep.id FROM (
     SELECT MIN(id) AS id FROM applications GROUP BY student_id, firm_id, role
   ) AS keep
 );

CREATE UNIQUE INDEX IF NOT EXISTS idx_applications_unique_posting
    ON applications(student_id, firm_id, role);
