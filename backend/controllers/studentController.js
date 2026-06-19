// controllers/studentController.js
import { query } from '../data/db.js';
import { formatDate, todayISO } from '../utils/format.js';

// GET /student/metrics — high-level dashboard counters
export const getMetrics = async (req, res, next) => {
  try {
    const apps = (await query('SELECT status FROM applications')).rows;
    const profile = (await query('SELECT profile_completion FROM students ORDER BY id LIMIT 1')).rows[0];

    res.json({
      profileCompletion: profile?.profile_completion ?? '50%',
      totalApplications: apps.length,
      interviewsScheduled: apps.filter((a) => a.status === 'Interviewing').length,
      pendingReview: apps.filter((a) => a.status === 'Pending Review').length
    });
  } catch (error) {
    next(error);
  }
};

// GET /student/applications — the student's submitted applications
export const getApplications = async (req, res, next) => {
  try {
    const rows = (await query(
      `SELECT a.id, f.company_name AS company, a.role, a.applied_date, a.status
         FROM applications a
         JOIN firms f ON f.id = a.firm_id
        ORDER BY a.applied_date DESC, a.id`
    )).rows;

    res.json(rows.map((r) => ({
      id: r.id,
      companyName: r.company,
      role: r.role,
      appliedDate: formatDate(r.applied_date),
      status: r.status
    })));
  } catch (error) {
    next(error);
  }
};

// POST /student/applications — submit a new attachment application
export const applyForPlacement = async (req, res, next) => {
  const { companyName, role, appliedDate, status } = req.body;

  if (!companyName || !role) {
    return res.status(400).json({ message: 'companyName and role are required to submit an application.' });
  }

  try {
    const firm = (await query('SELECT id FROM firms WHERE company_name = $1', [companyName])).rows[0];
    if (!firm) {
      return res.status(404).json({ message: `Firm "${companyName}" not found.` });
    }

    // Frontend does not yet send an authenticated student id — default to the demo student.
    const student = (await query('SELECT id FROM students ORDER BY id LIMIT 1')).rows[0];
    const placement = (await query(
      'SELECT id FROM placements WHERE firm_id = $1 AND role = $2',
      [firm.id, role]
    )).rows[0];

    const inserted = (await query(
      `INSERT INTO applications (student_id, placement_id, firm_id, role, applied_date, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, role, applied_date, status`,
      [student.id, placement?.id ?? null, firm.id, role, appliedDate || todayISO(), status || 'Pending Review']
    )).rows[0];

    res.status(201).json({
      id: inserted.id,
      companyName,
      role: inserted.role,
      appliedDate: formatDate(inserted.applied_date),
      status: inserted.status
    });
  } catch (error) {
    next(error);
  }
};

// GET /student/placements — available corporate vacancy postings
export const getPlacements = async (req, res, next) => {
  try {
    const rows = (await query(
      `SELECT p.id, f.company_name AS company, p.role, p.location, p.duration, p.slots, p.description
         FROM placements p
         JOIN firms f ON f.id = p.firm_id
        ORDER BY p.id`
    )).rows;

    res.json(rows.map((r) => ({
      id: r.id,
      companyName: r.company,
      company: r.company,
      role: r.role,
      location: r.location,
      duration: r.duration,
      slots: r.slots,
      description: r.description
    })));
  } catch (error) {
    next(error);
  }
};
