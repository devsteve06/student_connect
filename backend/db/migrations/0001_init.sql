-- =============================================================================
-- 0001_init.sql — baseline schema (idempotent)
-- =============================================================================
-- Mirrors backend/sql/schema.sql but is safe to run repeatedly against an
-- existing database: CREATE TABLE IF NOT EXISTS is a no-op when the table is
-- already present, and CREATE INDEX IF NOT EXISTS keeps indexes additive.
--
-- The trailing ALTER on students.phone backfills the column on databases that
-- existed before the profile feature — this is the ALTER that previously had
-- to be run by hand in the Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS admins (
    id                SERIAL PRIMARY KEY,
    username          VARCHAR(50)  NOT NULL UNIQUE,
    email             VARCHAR(150) UNIQUE,
    password_hash     VARCHAR(255) NOT NULL,
    full_name         VARCHAR(120) NOT NULL DEFAULT 'System Administrator',
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS universities (
    id                SERIAL PRIMARY KEY,
    name              VARCHAR(150) NOT NULL,
    location          VARCHAR(120) NOT NULL,
    contact_email     VARCHAR(150) NOT NULL UNIQUE,
    password_hash     VARCHAR(255) NOT NULL,
    total_enrolled    INTEGER      NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS firms (
    id                SERIAL PRIMARY KEY,
    company_name      VARCHAR(150) NOT NULL,
    contact_email     VARCHAR(150) NOT NULL UNIQUE,
    password_hash     VARCHAR(255) NOT NULL,
    location          VARCHAR(120) NOT NULL,
    industry          VARCHAR(120),
    active_interns    INTEGER      NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS students (
    id                  SERIAL PRIMARY KEY,
    full_name           VARCHAR(120) NOT NULL,
    email               VARCHAR(150) NOT NULL UNIQUE,
    password_hash       VARCHAR(255) NOT NULL,
    reg_number          VARCHAR(50)  NOT NULL UNIQUE,
    course              VARCHAR(120) NOT NULL,
    phone               VARCHAR(20),
    university_id       INTEGER      NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    profile_completion  VARCHAR(10)  NOT NULL DEFAULT '50%',
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS placements (
    id            SERIAL PRIMARY KEY,
    firm_id       INTEGER      NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    role          VARCHAR(150) NOT NULL,
    location      VARCHAR(120) NOT NULL,
    duration      VARCHAR(40)  NOT NULL,
    slots         INTEGER      NOT NULL DEFAULT 1 CHECK (slots >= 0),
    description   TEXT         NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS applications (
    id            SERIAL PRIMARY KEY,
    student_id    INTEGER      NOT NULL REFERENCES students(id)   ON DELETE CASCADE,
    placement_id  INTEGER          NULL REFERENCES placements(id) ON DELETE SET NULL,
    firm_id       INTEGER      NOT NULL REFERENCES firms(id)      ON DELETE CASCADE,
    role          VARCHAR(150) NOT NULL,
    applied_date  DATE         NOT NULL DEFAULT CURRENT_DATE,
    status        VARCHAR(20)  NOT NULL DEFAULT 'Pending Review'
                  CHECK (status IN ('Pending Review','Interviewing','Approved','Hired','Rejected')),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS logbooks (
    id                 SERIAL PRIMARY KEY,
    student_id         INTEGER     NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    firm_id            INTEGER         NULL REFERENCES firms(id)    ON DELETE SET NULL,
    week_number        INTEGER     NOT NULL CHECK (week_number > 0),
    monday             TEXT        DEFAULT '',
    tuesday            TEXT        DEFAULT '',
    wednesday          TEXT        DEFAULT '',
    thursday           TEXT        DEFAULT '',
    friday             TEXT        DEFAULT '',
    weekly_reflection  TEXT        DEFAULT '',
    firm_sign_off      VARCHAR(20) NOT NULL DEFAULT 'Draft Mode'
                       CHECK (firm_sign_off IN ('Draft Mode','Pending Review','Approved')),
    faculty_sign_off   VARCHAR(20) NOT NULL DEFAULT 'Not Started'
                       CHECK (faculty_sign_off IN ('Not Started','Pending Review','Approved')),
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, week_number)
);

CREATE INDEX IF NOT EXISTS idx_students_university  ON students(university_id);
CREATE INDEX IF NOT EXISTS idx_placements_firm      ON placements(firm_id);
CREATE INDEX IF NOT EXISTS idx_applications_student ON applications(student_id);
CREATE INDEX IF NOT EXISTS idx_applications_firm    ON applications(firm_id);
CREATE INDEX IF NOT EXISTS idx_logbooks_student     ON logbooks(student_id);

ALTER TABLE students ADD COLUMN IF NOT EXISTS phone VARCHAR(20);