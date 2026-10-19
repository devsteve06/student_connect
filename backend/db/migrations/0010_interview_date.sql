-- Interview scheduling for applications.
--
-- When a firm moves an application to 'Interviewing' the server stamps the
-- interview slot as one week out (utils/format.js#isoInDays) and sends the date
-- in the applicant's notification. The student hub reads it back to show
-- "Interview on <date>" next to the application.
--
-- Nullable: applications that never reached the interview stage keep NULL, and
-- the column is never cleared afterwards so the history survives later moves.
ALTER TABLE applications ADD COLUMN IF NOT EXISTS interview_date DATE;
