-- =============================================================================
-- Student Connect — Relational Schema (PostgreSQL)
-- =============================================================================
-- Mirrors the backend's in-memory data model (backend/data/store.js):
--   universities, firms, students  +  placements, applications, logbooks
--
-- Dialect: PostgreSQL. For MySQL, replace `SERIAL` with `INT AUTO_INCREMENT`,
-- `TIMESTAMPTZ` with `DATETIME`, and drop the `IF NOT EXISTS` on types.
--
-- Run:  psql -d student_connect -f schema.sql
-- =============================================================================

DROP TABLE IF EXISTS logbooks      CASCADE;
DROP TABLE IF EXISTS applications   CASCADE;
DROP TABLE IF EXISTS placements     CASCADE;
DROP TABLE IF EXISTS students       CASCADE;
DROP TABLE IF EXISTS firms          CASCADE;
DROP TABLE IF EXISTS universities   CASCADE;
DROP TABLE IF EXISTS admins         CASCADE;

-- -----------------------------------------------------------------------------
-- admins — system administrators with absolute access across the platform
-- -----------------------------------------------------------------------------
CREATE TABLE admins (
    id                SERIAL PRIMARY KEY,
    username          VARCHAR(50)  NOT NULL UNIQUE,
    email             VARCHAR(150) UNIQUE,
    password_hash     VARCHAR(255) NOT NULL,
    full_name         VARCHAR(120) NOT NULL DEFAULT 'System Administrator',
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- universities — academic institutions that enrol students
-- -----------------------------------------------------------------------------
CREATE TABLE universities (
    id                SERIAL PRIMARY KEY,
    name              VARCHAR(150) NOT NULL,
    location          VARCHAR(120) NOT NULL,
    contact_email     VARCHAR(150) NOT NULL UNIQUE,
    password_hash     VARCHAR(255) NOT NULL,
    total_enrolled    INTEGER      NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- firms — corporate partners that post placements and hire interns
-- -----------------------------------------------------------------------------
CREATE TABLE firms (
    id                SERIAL PRIMARY KEY,
    company_name      VARCHAR(150) NOT NULL,
    contact_email     VARCHAR(150) NOT NULL UNIQUE,
    password_hash     VARCHAR(255) NOT NULL,
    location          VARCHAR(120) NOT NULL,
    industry          VARCHAR(120),
    active_interns    INTEGER      NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- students — trainees seeking / undertaking industrial attachment
-- -----------------------------------------------------------------------------
CREATE TABLE students (
    id                  SERIAL PRIMARY KEY,
    full_name           VARCHAR(120) NOT NULL,
    email               VARCHAR(150) NOT NULL UNIQUE,
    password_hash       VARCHAR(255) NOT NULL,
    reg_number          VARCHAR(50)  NOT NULL UNIQUE,
    course              VARCHAR(120) NOT NULL,
    university_id       INTEGER      NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    profile_completion  VARCHAR(10)  NOT NULL DEFAULT '50%',
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- placements — vacancy postings owned by a firm (marketplace listings)
-- -----------------------------------------------------------------------------
CREATE TABLE placements (
    id            SERIAL PRIMARY KEY,
    firm_id       INTEGER      NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    role          VARCHAR(150) NOT NULL,
    location      VARCHAR(120) NOT NULL,
    duration      VARCHAR(40)  NOT NULL,
    slots         INTEGER      NOT NULL DEFAULT 1 CHECK (slots >= 0),
    description   TEXT         NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- applications — a student's application to a firm/placement
--   status mirrors the backend enums (Pending Review / Interviewing /
--   Approved / Hired / Rejected)
-- -----------------------------------------------------------------------------
CREATE TABLE applications (
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

-- -----------------------------------------------------------------------------
-- logbooks — weekly attachment logs with firm + faculty sign-off
-- -----------------------------------------------------------------------------
CREATE TABLE logbooks (
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
    -- a student can only log one entry per week
    UNIQUE (student_id, week_number)
);

-- Helpful lookup indexes
CREATE INDEX idx_students_university ON students(university_id);
CREATE INDEX idx_placements_firm     ON placements(firm_id);
CREATE INDEX idx_applications_student ON applications(student_id);
CREATE INDEX idx_applications_firm    ON applications(firm_id);
CREATE INDEX idx_logbooks_student     ON logbooks(student_id);
