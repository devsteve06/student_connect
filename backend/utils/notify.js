// utils/notify.js
// Shared helper for the event-driven notifications (JOB_POSTING_PLAN.md
// Phase 4): creating a posting fans out to students, applying notifies the
// firm, and later phases reuse this for status updates.
//
// Fan-out is best-effort by design: a notification is an echo of a change
// that already succeeded, so a failure here is logged but never rolls back
// (or 500s) the operation that triggered it.
import { query } from '../data/db.js';
import { logger } from './logger.js';

// Inserts one batch of notifications in a single statement.
// Each row is { studentId | firmId, type, title, body?, link? } — exactly one
// of studentId/firmId, matching the table's exactly-one-recipient CHECK.
export async function insertNotifications(rows) {
  if (rows.length === 0) return 0;

  const params = [];
  const tuples = rows.map((r) => {
    params.push(r.studentId ?? null, r.firmId ?? null, r.type, r.title, r.body ?? null, r.link ?? null);
    const base = params.length - 6;
    return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`;
  });

  const result = await query(
    `INSERT INTO notifications (student_id, firm_id, type, title, body, link)
     VALUES ${tuples.join(', ')}
     RETURNING id`,
    params
  );
  return result.rows.length;
}

// Best-effort wrapper — never throws, never fails the caller's operation.
export async function notifyQuietly(rows, context) {
  try {
    return await insertNotifications(rows);
  } catch (error) {
    logger.error('notification fan-out failed', {
      context,
      count: rows.length,
      error: error.message
    });
    return 0;
  }
}

// Notify every student at a university (the affiliation the firm signed up
// with) about a new posting. No-op when the firm has no university yet.
// `buildRow(firm)` returns the { type, title, body, link } to send.
export async function notifyUniversityStudents({ firmId, buildRow }) {
  const firm = (await query('SELECT company_name, university_id FROM firms WHERE id = $1', [firmId])).rows[0];
  if (!firm?.university_id) return 0;

  const students = (await query(
    'SELECT id FROM students WHERE university_id = $1',
    [firm.university_id]
  )).rows;
  if (students.length === 0) return 0;

  const row = buildRow(firm);
  return notifyQuietly(
    students.map((s) => ({ studentId: s.id, ...row })),
    `new_posting:${firmId}`
  );
}
