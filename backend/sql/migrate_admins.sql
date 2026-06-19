-- =============================================================================
-- Migration: add the admins table + seed the sysadmin user.
-- Idempotent — safe to run against an existing studentConnectDB without wiping
-- data (unlike schema.sql, which drops tables).
--
-- Run:  psql -d studentConnectDB -f migrate_admins.sql
--   sysadmin login -> username "sysadmin", password "theadmin"
-- =============================================================================

CREATE TABLE IF NOT EXISTS admins (
    id                SERIAL PRIMARY KEY,
    username          VARCHAR(50)  NOT NULL UNIQUE,
    email             VARCHAR(150) UNIQUE,
    password_hash     VARCHAR(255) NOT NULL,
    full_name         VARCHAR(120) NOT NULL DEFAULT 'System Administrator',
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

INSERT INTO admins (username, email, password_hash, full_name)
VALUES ('sysadmin', 'sysadmin@studentconnect.local',
        '$2b$10$9RcDBs.5DW37m/UYFGqkve61K3gv5VDsH4rvxpnINm7pZg1MRWqUS', 'System Administrator')
ON CONFLICT (username) DO NOTHING;
