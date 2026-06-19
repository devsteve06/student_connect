// controllers/universityController.js
import { query } from '../data/db.js';

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

// GET /university/metrics — institutional placement analytics
export const getCoordinatorMetrics = async (req, res, next) => {
  try {
    const totalEnrolled = (await query('SELECT COUNT(*)::int AS n FROM students')).rows[0].n;
    const placed = (await query(
      "SELECT COUNT(DISTINCT student_id)::int AS n FROM applications WHERE status IN ('Approved','Hired')"
    )).rows[0].n;
    const actionRequired = (await query(
      "SELECT COUNT(*)::int AS n FROM logbooks WHERE faculty_sign_off <> 'Approved'"
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

// GET /university/logbooks/pending — logbooks awaiting faculty sign-off
export const getPendingLogbooks = async (req, res, next) => {
  try {
    const rows = (await query(
      `${PENDING_SELECT} WHERE l.faculty_sign_off <> 'Approved' ORDER BY l.id`
    )).rows;
    res.json(rows.map(logbookShape));
  } catch (error) {
    next(error);
  }
};

// PATCH /university/logbooks/:id — authorize a logbook week with faculty sign-off
export const signOffLogbook = async (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  const { facultySignOff } = req.body;

  if (Number.isNaN(id)) {
    return res.status(404).json({ message: 'Logbook entry not found in the registry.' });
  }

  try {
    if (facultySignOff) {
      const updated = (await query(
        'UPDATE logbooks SET faculty_sign_off = $1 WHERE id = $2 RETURNING id',
        [facultySignOff, id]
      )).rows[0];
      if (!updated) {
        return res.status(404).json({ message: `Logbook entry [${id}] not found in the registry.` });
      }
    }

    const row = (await query(`${PENDING_SELECT} WHERE l.id = $1`, [id])).rows[0];
    if (!row) {
      return res.status(404).json({ message: `Logbook entry [${id}] not found in the registry.` });
    }
    res.json(logbookShape(row));
  } catch (error) {
    next(error);
  }
};
