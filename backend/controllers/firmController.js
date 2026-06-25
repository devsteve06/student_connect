// controllers/firmController.js
import { query } from '../data/db.js';
import { formatDate } from '../utils/format.js';

// Allowed application lifecycle states (mirrors the applications.status CHECK constraint).
const APPLICATION_STATUSES = ['Pending Review', 'Interviewing', 'Approved', 'Hired', 'Rejected'];

const applicantShape = (r) => ({
  id: r.id,
  studentName: r.student_name,
  university: r.university,
  role: r.role,
  appliedDate: formatDate(r.applied_date),
  status: r.status
});

const APPLICANT_SELECT = `
  SELECT a.id, s.full_name AS student_name, u.name AS university, a.role, a.applied_date, a.status
    FROM applications a
    JOIN students s     ON s.id = a.student_id
    JOIN universities u ON u.id = s.university_id`;

// GET /firm/metrics — corporate dashboard counters for the logged-in firm
export const getFirmMetrics = async (req, res, next) => {
  try {
    const apps = (await query('SELECT status FROM applications WHERE firm_id = $1', [req.user.id])).rows;
    const logs = (await query('SELECT faculty_sign_off FROM logbooks WHERE firm_id = $1', [req.user.id])).rows;

    res.json({
      newApplications: apps.filter((a) => a.status === 'Pending Review').length,
      interviewsPending: apps.filter((a) => a.status === 'Interviewing').length,
      activeInterns: apps.filter((a) => a.status === 'Approved' || a.status === 'Hired').length,
      unverifiedLogbooks: logs.filter((l) => l.faculty_sign_off !== 'Approved').length
    });
  } catch (error) {
    next(error);
  }
};

// GET /firm/applicants — roster of students who applied to the logged-in firm
export const getApplicants = async (req, res, next) => {
  try {
    const rows = (await query(
      `${APPLICANT_SELECT} WHERE a.firm_id = $1 ORDER BY a.applied_date DESC, a.id`,
      [req.user.id]
    )).rows;
    res.json(rows.map(applicantShape));
  } catch (error) {
    next(error);
  }
};

// PATCH /firm/applicants/:id — update an applicant's lifecycle status
export const updateApplicantStatus = async (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  const { status } = req.body || {};

  if (Number.isNaN(id)) {
    return res.status(400).json({ message: 'A numeric applicant id is required.' });
  }
  if (status !== undefined && !APPLICATION_STATUSES.includes(status)) {
    return res.status(400).json({
      message: `Invalid status "${status}". Use one of: ${APPLICATION_STATUSES.join(', ')}.`
    });
  }

  try {
    if (status) {
      // Scope the update to this firm's applicants so one firm cannot mutate another's.
      const updated = (await query(
        'UPDATE applications SET status = $1 WHERE id = $2 AND firm_id = $3 RETURNING id',
        [status, id, req.user.id]
      )).rows[0];
      if (!updated) {
        return res.status(404).json({ message: `Applicant [${id}] not found in the hiring pipeline.` });
      }
    }

    const row = (await query(`${APPLICANT_SELECT} WHERE a.id = $1 AND a.firm_id = $2`, [id, req.user.id])).rows[0];
    if (!row) {
      return res.status(404).json({ message: `Applicant [${id}] not found in the hiring pipeline.` });
    }
    res.json(applicantShape(row));
  } catch (error) {
    next(error);
  }
};
