// controllers/firmController.js
import { query } from '../data/db.js';
import { formatDate } from '../utils/format.js';
import { notifyUniversityStudents } from '../utils/notify.js';

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

// GET /firms/metrics — corporate dashboard counters for the logged-in firm
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

// GET /firms/applicants — roster of students who applied to the logged-in firm
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

// PATCH /firms/applicants/:id — update an applicant's lifecycle status
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

// --- Job postings (JOB_POSTING_PLAN.md Phase 3) -----------------------------
// Firms manage their own placements: create (always 'Open'), list with live
// applicant counts, edit while open, and close manually (auto-close on
// approval arrives in Phase 5).

const PLACEMENT_RETURNING =
  'id, role, location, duration, slots, description, status, closed_at, created_at';

const placementShape = (r) => ({
  id: r.id,
  role: r.role,
  location: r.location,
  duration: r.duration,
  slots: r.slots,
  description: r.description,
  status: r.status,
  closedAt: r.closed_at,
  createdAt: r.created_at
});

// Applicant counts are computed in their own query rather than a JOIN or a
// correlated subquery: pg-mem cannot correlate an outer alias inside a
// select-list subquery, and its GROUP BY nulls non-aggregated columns.
// Every application carries a NOT NULL firm_id, so per-posting counts for one
// firm's applications can be grouped on their own and merged in JS.
const PLACEMENT_COLUMNS =
  'id, role, location, duration, slots, description, status, closed_at, created_at';

async function applicantCountsByPlacement(firmId) {
  const rows = (await query(
    `SELECT placement_id, COUNT(*)::int AS c
       FROM applications
      WHERE firm_id = $1 AND placement_id IS NOT NULL
      GROUP BY placement_id`,
    [firmId]
  )).rows;
  const counts = new Map();
  for (const r of rows) counts.set(r.placement_id, r.c);
  return counts;
}

async function placementWithCount(id, firmId) {
  const row = (await query(
    `SELECT ${PLACEMENT_COLUMNS} FROM placements WHERE id = $1 AND firm_id = $2`,
    [id, firmId]
  )).rows[0];
  if (!row) return null;
  const count = (await query(
    'SELECT COUNT(*)::int AS c FROM applications WHERE placement_id = $1',
    [id]
  )).rows[0].c;
  return { ...placementShape(row), applicantCount: count };
}

// GET /firms/placements — this firm's postings, newest first, with live counts
export const listPlacements = async (req, res, next) => {
  try {
    const rows = (await query(
      `SELECT ${PLACEMENT_COLUMNS} FROM placements
        WHERE firm_id = $1
        ORDER BY created_at DESC, id DESC`,
      [req.user.id]
    )).rows;
    const counts = await applicantCountsByPlacement(req.user.id);
    res.json(rows.map((r) => ({ ...placementShape(r), applicantCount: counts.get(r.id) || 0 })));
  } catch (error) {
    next(error);
  }
};

// POST /firms/placements — publish a new posting (status defaults to 'Open')
export const createPlacement = async (req, res, next) => {
  const body = req.body || {};

  const missing = [
    ['role', body.role],
    ['location', body.location],
    ['duration', body.duration],
    ['description', body.description]
  ].find(([, value]) => !String(value ?? '').trim());
  if (missing) {
    return res.status(400).json({ message: `A posting needs a ${missing[0]}.` });
  }

  const slots = body.slots === undefined ? 1 : Number(body.slots);
  if (!Number.isInteger(slots) || slots < 1) {
    return res.status(400).json({ message: 'Slots must be a whole number of at least 1.' });
  }

  try {
    const row = (await query(
      `INSERT INTO placements (firm_id, role, location, duration, slots, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${PLACEMENT_RETURNING}`,
      [
        req.user.id,
        String(body.role).trim(),
        String(body.location).trim(),
        String(body.duration).trim(),
        slots,
        String(body.description).trim()
      ]
    )).rows[0];

    // Fan-out is best-effort (notifyQuietly swallows + logs failures): the
    // posting is already live, so students at the firm's university hear
    // about it even if a notification insert misbehaves.
    const posted = { ...placementShape(row), applicantCount: 0 };
    await notifyUniversityStudents({
      firmId: req.user.id,
      buildRow: (firm) => ({
        type: 'new_posting',
        title: `New posting: ${posted.role}`,
        body: `${firm.company_name} is hiring ${posted.role} in ${posted.location}.`,
        link: '/students/marketplace'
      })
    });

    res.status(201).json(posted);
  } catch (error) {
    next(error);
  }
};

// PATCH /firms/placements/:id — edit an Open posting only; closed postings
// are frozen (409) and another firm's posting reads as missing (404).
const UPDATABLE_PLACEMENT_FIELDS = ['role', 'location', 'duration', 'description'];

export const updatePlacement = async (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: 'A numeric placement id is required.' });
  }

  const body = req.body || {};
  const sets = [];
  const params = [];

  for (const field of UPDATABLE_PLACEMENT_FIELDS) {
    if (body[field] === undefined) continue;
    const value = String(body[field] ?? '').trim();
    if (!value) {
      return res.status(400).json({ message: `A posting needs a ${field}.` });
    }
    params.push(value);
    sets.push(`${field} = $${params.length}`);
  }
  if (body.slots !== undefined) {
    const slots = Number(body.slots);
    if (!Number.isInteger(slots) || slots < 1) {
      return res.status(400).json({ message: 'Slots must be a whole number of at least 1.' });
    }
    params.push(slots);
    sets.push(`slots = $${params.length}`);
  }
  if (sets.length === 0) {
    return res.status(400).json({ message: 'Provide at least one field to update.' });
  }

  try {
    params.push(id, req.user.id);
    const updated = (await query(
      `UPDATE placements
          SET ${sets.join(', ')}
        WHERE id = $${params.length - 1} AND firm_id = $${params.length} AND status = 'Open'
        RETURNING id`,
      params
    )).rows[0];

    if (!updated) {
      const existing = (await query(
        'SELECT status FROM placements WHERE id = $1 AND firm_id = $2',
        [id, req.user.id]
      )).rows[0];
      if (!existing) {
        return res.status(404).json({ message: `Placement [${id}] not found.` });
      }
      return res.status(409).json({ message: 'A closed posting can no longer be edited.' });
    }

    const result = await placementWithCount(id, req.user.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// PATCH /firms/placements/:id/close — manual close. Idempotent: closing an
// already-closed posting returns its current state rather than an error.
export const closePlacement = async (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: 'A numeric placement id is required.' });
  }

  try {
    await query(
      `UPDATE placements
          SET status = 'Closed', closed_at = NOW()
        WHERE id = $1 AND firm_id = $2 AND status = 'Open'`,
      [id, req.user.id]
    );

    const result = await placementWithCount(id, req.user.id);
    if (!result) {
      return res.status(404).json({ message: `Placement [${id}] not found.` });
    }
    res.json(result);
  } catch (error) {
    next(error);
  }
};
