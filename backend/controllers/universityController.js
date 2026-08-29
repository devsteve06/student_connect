// controllers/universityController.js
import { query } from '../data/db.js';
import { formatDate } from '../utils/format.js';

// Allowed faculty sign-off states (mirrors the logbooks.faculty_sign_off CHECK constraint).
const FACULTY_SIGN_OFFS = ['Not Started', 'Pending Review', 'Approved'];

const logbookShape = (r) => ({
  id: r.id,
  studentName: r.student_name,
  regNumber: r.reg_number,
  weekNumber: r.week_number,
  companyName: r.company_name,
  firmStatus: r.firm_sign_off,
  facultySignOff: r.faculty_sign_off
});

const PENDING_SELECT = `
  SELECT l.id, s.full_name AS student_name, s.reg_number, l.week_number,
         f.company_name, l.firm_sign_off, l.faculty_sign_off
    FROM logbooks l
    JOIN students s ON s.id = l.student_id
    LEFT JOIN firms f ON f.id = l.firm_id`;

// GET /university/metrics — institutional placement analytics, scoped to the
// logged-in university's enrolled students
export const getCoordinatorMetrics = async (req, res, next) => {
  try {
    const universityId = req.user.id;
    const totalEnrolled = (await query(
      'SELECT COUNT(*)::int AS n FROM students WHERE university_id = $1',
      [universityId]
    )).rows[0].n;
    const placed = (await query(
      `SELECT COUNT(DISTINCT a.student_id)::int AS n
         FROM applications a
         JOIN students s ON s.id = a.student_id
        WHERE s.university_id = $1 AND a.status IN ('Approved','Hired')`,
      [universityId]
    )).rows[0].n;
    const actionRequired = (await query(
      `SELECT COUNT(*)::int AS n
         FROM logbooks l
         JOIN students s ON s.id = l.student_id
        WHERE s.university_id = $1 AND l.faculty_sign_off <> 'Approved'`,
      [universityId]
    )).rows[0].n;

    res.json({
      totalEnrolled,
      placedInterns: placed,
      unplacedStudents: totalEnrolled - placed,
      actionRequiredLogs: actionRequired
    });
  } catch (error) {
    next(error);
  }
};

// GET /university/logbooks/pending — this university's logbooks awaiting faculty sign-off
export const getPendingLogbooks = async (req, res, next) => {
  try {
    const rows = (await query(
      `${PENDING_SELECT} WHERE s.university_id = $1 AND l.faculty_sign_off <> 'Approved' ORDER BY l.id`,
      [req.user.id]
    )).rows;
    res.json(rows.map(logbookShape));
  } catch (error) {
    next(error);
  }
};

// PATCH /university/logbooks/:id — authorize a logbook week with faculty sign-off
export const signOffLogbook = async (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  const { facultySignOff } = req.body || {};

  if (Number.isNaN(id)) {
    return res.status(400).json({ message: 'A numeric logbook id is required.' });
  }
  if (facultySignOff !== undefined && !FACULTY_SIGN_OFFS.includes(facultySignOff)) {
    return res.status(400).json({
      message: `Invalid facultySignOff "${facultySignOff}". Use one of: ${FACULTY_SIGN_OFFS.join(', ')}.`
    });
  }

  try {
    // Only sign off logbooks belonging to this university's own students.
    const owned = (await query(
      `SELECT l.id FROM logbooks l JOIN students s ON s.id = l.student_id
        WHERE l.id = $1 AND s.university_id = $2`,
      [id, req.user.id]
    )).rows[0];
    if (!owned) {
      return res.status(404).json({ message: `Logbook entry [${id}] not found in the registry.` });
    }

    if (facultySignOff) {
      await query('UPDATE logbooks SET faculty_sign_off = $1 WHERE id = $2', [facultySignOff, id]);
    }

    const row = (await query(`${PENDING_SELECT} WHERE l.id = $1`, [id])).rows[0];
    res.json(logbookShape(row));
  } catch (error) {
    next(error);
  }
};

const auditShape = (r) => ({
  id: r.id,
  studentName: r.student_name,
  regNumber: r.reg_number,
  companyName: r.company_name,
  weekNumber: r.week_number,
  firmStatus: r.firm_sign_off,
  facultySignOff: r.faculty_sign_off,
  submittedAt: formatDate(r.created_at)
});

// GET /university/audits — compliance ledger: every logbook entry belonging to
// this university's students, newest first
export const getAuditLog = async (req, res, next) => {
  try {
    const rows = (await query(
      `SELECT l.id, s.full_name AS student_name, s.reg_number, f.company_name,
              l.week_number, l.firm_sign_off, l.faculty_sign_off, l.created_at
         FROM logbooks l
         JOIN students s ON s.id = l.student_id
         LEFT JOIN firms f ON f.id = l.firm_id
        WHERE s.university_id = $1
        ORDER BY l.created_at DESC, l.id DESC`,
      [req.user.id]
    )).rows;
    res.json(rows.map(auditShape));
  } catch (error) {
    next(error);
  }
};
