-- =============================================================================
-- Student Connect — Seed Data (PostgreSQL)
-- =============================================================================
-- Inserts 5 universities, 5 firms, and 5 students, plus coherent placements,
-- applications, and logbooks that reference them.
--
-- Every account's password is "password123"
--   bcrypt hash: $2b$10$jo/4SZY/GBGI/a3tM/2XuesTbGNM6211OL98wFTpN1I8AVk803LDK
--
-- Run after schema.sql:  psql -d student_connect -f seed.sql
-- Foreign keys are resolved via sub-selects so the script is order-independent.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. System administrator — username "sysadmin", password "theadmin"
--    bcrypt hash: $2b$10$9RcDBs.5DW37m/UYFGqkve61K3gv5VDsH4rvxpnINm7pZg1MRWqUS
-- -----------------------------------------------------------------------------
INSERT INTO admins (username, email, password_hash, full_name) VALUES
  ('sysadmin', 'sysadmin@studentconnect.local', '$2b$10$9RcDBs.5DW37m/UYFGqkve61K3gv5VDsH4rvxpnINm7pZg1MRWqUS', 'System Administrator');

-- -----------------------------------------------------------------------------
-- 1. Universities (5)
-- -----------------------------------------------------------------------------
INSERT INTO universities (name, location, contact_email, password_hash, total_enrolled) VALUES
  ('Strathmore University',       'Nairobi, KE',  'registrar@strathmore.edu',  '$2b$10$jo/4SZY/GBGI/a3tM/2XuesTbGNM6211OL98wFTpN1I8AVk803LDK', 142),
  ('JKUAT',                       'Juja, KE',     'registrar@jkuat.ac.ke',     '$2b$10$jo/4SZY/GBGI/a3tM/2XuesTbGNM6211OL98wFTpN1I8AVk803LDK', 210),
  ('University of Nairobi',       'Nairobi, KE',  'registrar@uonbi.ac.ke',     '$2b$10$jo/4SZY/GBGI/a3tM/2XuesTbGNM6211OL98wFTpN1I8AVk803LDK', 305),
  ('Moi University',              'Eldoret, KE',  'registrar@mu.ac.ke',        '$2b$10$jo/4SZY/GBGI/a3tM/2XuesTbGNM6211OL98wFTpN1I8AVk803LDK', 178),
  ('Technical University of Kenya','Nairobi, KE', 'registrar@tukenya.ac.ke',   '$2b$10$jo/4SZY/GBGI/a3tM/2XuesTbGNM6211OL98wFTpN1I8AVk803LDK', 164);

-- -----------------------------------------------------------------------------
-- 2. Firms (5)
-- -----------------------------------------------------------------------------
INSERT INTO firms (company_name, contact_email, password_hash, location, industry, active_interns) VALUES
  ('TechCorp Solutions',  'hr@techcorp.io',     '$2b$10$jo/4SZY/GBGI/a3tM/2XuesTbGNM6211OL98wFTpN1I8AVk803LDK', 'Nairobi, KE',  'Cloud & DevOps',     2),
  ('Nexus Labs',          'careers@nexuslabs.io','$2b$10$jo/4SZY/GBGI/a3tM/2XuesTbGNM6211OL98wFTpN1I8AVk803LDK', 'Nairobi, KE',  'Software',           3),
  ('Pixel Craft Agency',  'jobs@pixelcraft.io', '$2b$10$jo/4SZY/GBGI/a3tM/2XuesTbGNM6211OL98wFTpN1I8AVk803LDK', 'Mombasa, KE',  'Design & Frontend',  1),
  ('Safiri Analytics',    'talent@safiri.io',   '$2b$10$jo/4SZY/GBGI/a3tM/2XuesTbGNM6211OL98wFTpN1I8AVk803LDK', 'Nairobi, KE',  'Data Engineering',   2),
  ('Apex Cloud Labs',     'people@apexcloud.io','$2b$10$jo/4SZY/GBGI/a3tM/2XuesTbGNM6211OL98wFTpN1I8AVk803LDK', 'Kisumu, KE',   'Cloud Architecture', 1);

-- -----------------------------------------------------------------------------
-- 3. Students (5) — each linked to a university
-- -----------------------------------------------------------------------------
INSERT INTO students (full_name, email, password_hash, reg_number, course, university_id, profile_completion) VALUES
  ('Alex Kamau',    'alex.kamau@students.strathmore.edu', '$2b$10$jo/4SZY/GBGI/a3tM/2XuesTbGNM6211OL98wFTpN1I8AVk803LDK', 'BBIT/4901/2023', 'BBIT',
      (SELECT id FROM universities WHERE name = 'Strathmore University'),       '85%'),
  ('Jane Doe',      'jane.doe@students.jkuat.ac.ke',      '$2b$10$jo/4SZY/GBGI/a3tM/2XuesTbGNM6211OL98wFTpN1I8AVk803LDK', 'SIT/1024/2023',  'Software Engineering',
      (SELECT id FROM universities WHERE name = 'JKUAT'),                        '72%'),
  ('David Ochieng', 'david.ochieng@students.uonbi.ac.ke', '$2b$10$jo/4SZY/GBGI/a3tM/2XuesTbGNM6211OL98wFTpN1I8AVk803LDK', 'COM/2210/2022',  'Computer Science',
      (SELECT id FROM universities WHERE name = 'University of Nairobi'),        '60%'),
  ('Mary Wanjiru',  'mary.wanjiru@students.mu.ac.ke',     '$2b$10$jo/4SZY/GBGI/a3tM/2XuesTbGNM6211OL98wFTpN1I8AVk803LDK', 'IT/0788/2023',   'Information Technology',
      (SELECT id FROM universities WHERE name = 'Moi University'),               '90%'),
  ('Brian Otieno',  'brian.otieno@students.tukenya.ac.ke','$2b$10$jo/4SZY/GBGI/a3tM/2XuesTbGNM6211OL98wFTpN1I8AVk803LDK', 'DS/3345/2022',   'Data Science',
      (SELECT id FROM universities WHERE name = 'Technical University of Kenya'),'50%');

-- -----------------------------------------------------------------------------
-- 4. Placements (vacancy postings) — owned by firms
-- -----------------------------------------------------------------------------
INSERT INTO placements (firm_id, role, location, duration, slots, description) VALUES
  ((SELECT id FROM firms WHERE company_name = 'Nexus Labs'),         'Full-Stack Developer Intern', 'Nairobi, KE (Hybrid)', '3 Months', 3,
      'Design secure backend APIs utilizing Node.js and configure clean React components.'),
  ((SELECT id FROM firms WHERE company_name = 'Pixel Craft Agency'), 'UI/UX & Frontend Trainee',    'Mombasa, KE (Remote)', '6 Months', 2,
      'Develop high-fidelity UI wireframes and translate styles using Tailwind utility classes.'),
  ((SELECT id FROM firms WHERE company_name = 'Safiri Analytics'),   'Data Engineering Assistant',  'Nairobi, KE (On-Site)','3 Months', 1,
      'Maintain data extraction pipelines and construct corporate operational reporting dashboards.'),
  ((SELECT id FROM firms WHERE company_name = 'TechCorp Solutions'), 'Cloud Architecture Intern',   'Nairobi, KE (On-Site)','4 Months', 2,
      'Provision and harden cloud infrastructure using containerized Kubernetes deployment pods.'),
  ((SELECT id FROM firms WHERE company_name = 'Apex Cloud Labs'),    'Backend Systems Engineer',    'Kisumu, KE (Hybrid)',  '3 Months', 1,
      'Build resilient microservices and optimize database query payloads for production traffic.');

-- -----------------------------------------------------------------------------
-- 5. Applications — students applying to placements/firms
-- -----------------------------------------------------------------------------
INSERT INTO applications (student_id, placement_id, firm_id, role, applied_date, status) VALUES
  ((SELECT id FROM students WHERE reg_number = 'BBIT/4901/2023'),
   (SELECT id FROM placements WHERE role = 'Cloud Architecture Intern'),
   (SELECT id FROM firms WHERE company_name = 'TechCorp Solutions'), 'Cloud Architecture Intern',  DATE '2026-05-22', 'Approved'),
  ((SELECT id FROM students WHERE reg_number = 'BBIT/4901/2023'),
   (SELECT id FROM placements WHERE role = 'Full-Stack Developer Intern'),
   (SELECT id FROM firms WHERE company_name = 'Nexus Labs'),         'Full-Stack Developer Intern', DATE '2026-05-26', 'Interviewing'),
  ((SELECT id FROM students WHERE reg_number = 'SIT/1024/2023'),
   (SELECT id FROM placements WHERE role = 'UI/UX & Frontend Trainee'),
   (SELECT id FROM firms WHERE company_name = 'Pixel Craft Agency'), 'UI/UX & Frontend Trainee',    DATE '2026-05-26', 'Pending Review'),
  ((SELECT id FROM students WHERE reg_number = 'COM/2210/2022'),
   (SELECT id FROM placements WHERE role = 'Data Engineering Assistant'),
   (SELECT id FROM firms WHERE company_name = 'Safiri Analytics'),   'Data Engineering Assistant',  DATE '2026-05-27', 'Pending Review'),
  ((SELECT id FROM students WHERE reg_number = 'DS/3345/2022'),
   (SELECT id FROM placements WHERE role = 'Backend Systems Engineer'),
   (SELECT id FROM firms WHERE company_name = 'Apex Cloud Labs'),    'Backend Systems Engineer',    DATE '2026-05-28', 'Hired');

-- -----------------------------------------------------------------------------
-- 6. Logbooks — weekly attachment logs with sign-off state
-- -----------------------------------------------------------------------------
INSERT INTO logbooks (student_id, firm_id, week_number, monday, tuesday, wednesday, thursday, friday, weekly_reflection, firm_sign_off, faculty_sign_off) VALUES
  ((SELECT id FROM students WHERE reg_number = 'BBIT/4901/2023'),
   (SELECT id FROM firms WHERE company_name = 'TechCorp Solutions'), 1,
   'Setup corporate workstation ecosystem and configured dockerized container layers.',
   'Resolved multi-tenant routing bugs inside the core HTTP client interceptor engine.',
   'Implemented high-contrast Tailwind UI blocks across the master sidebar layout.',
   'Integrated state hooks to map server-side array objects into client data tables.',
   'Staged Git production branch deployment and initiated peer code verification.',
   'Acquired critical insights regarding CORS header injection and async state hydration.',
   'Approved', 'Approved'),
  ((SELECT id FROM students WHERE reg_number = 'BBIT/4901/2023'),
   (SELECT id FROM firms WHERE company_name = 'TechCorp Solutions'), 2,
   'Patched critical database edge pools and optimized standard query payloads.',
   'Built parameterized queries to neutralize injection vulnerabilities.',
   'Refactored auth middleware matrices to production standard.',
   'Wrote unit tests covering the placement application pipeline.',
   'Reviewed sprint deliverables with the corporate supervisor.',
   'Strengthened secure coding practices and database tuning competencies.',
   'Pending Review', 'Not Started'),
  ((SELECT id FROM students WHERE reg_number = 'SIT/1024/2023'),
   (SELECT id FROM firms WHERE company_name = 'Nexus Labs'), 1,
   'Onboarded to the design system and audited existing component library.',
   'Translated Figma wireframes into responsive Tailwind layouts.',
   'Implemented accessible form controls for the marketplace view.',
   'Paired on the logbook submission modal interaction states.',
   'Documented the frontend style guide for the team.',
   'Learned high-fidelity prototyping and component-driven development.',
   'Approved', 'Pending Review'),
  ((SELECT id FROM students WHERE reg_number = 'COM/2210/2022'),
   (SELECT id FROM firms WHERE company_name = 'Safiri Analytics'), 1,
   'Configured the data extraction environment and access credentials.',
   'Mapped raw source tables into the reporting warehouse schema.',
   'Built an ETL job to aggregate daily operational metrics.',
   'Validated dashboard figures against source-of-truth records.',
   'Presented preliminary findings to the analytics lead.',
   'Gained practical exposure to ETL pipelines and data validation.',
   'Pending Review', 'Not Started'),
  ((SELECT id FROM students WHERE reg_number = 'DS/3345/2022'),
   (SELECT id FROM firms WHERE company_name = 'Apex Cloud Labs'), 1,
   'Provisioned a local Kubernetes cluster for the services team.',
   'Implemented a microservice for placement notifications.',
   'Added health-check endpoints and structured logging.',
   'Load-tested the service and tuned connection pooling.',
   'Documented deployment runbooks for the on-call rotation.',
   'Built confidence in microservice architecture and observability.',
   'Draft Mode', 'Not Started');
