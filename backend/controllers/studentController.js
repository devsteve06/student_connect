// controllers/studentController.js
import { query } from '../data/db.js';
import { formatDate, todayISO } from '../utils/format.js';

const PHONE_RE = /^(\+?254|0)[17]\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Shared projection + row mapper for a student's own profile.
async function fetchProfile(id) {
  const row = (await query(
    `SELECT s.id, s.full_name, s.email, s.reg_number, s.course, s.phone,
            s.profile_completion, u.name AS university
       FROM students s
       JOIN universities u ON u.id = s.university_id
      WHERE s.id = $1`,
    [id]
  )).rows[0];
  return row;
}

// GET /student/metrics — high-level dashboard counters for the logged-in student
export const getMetrics = async (req, res, next) => {
  try {
    const apps = (await query('SELECT status FROM applications WHERE student_id = $1', [req.user.id])).rows;
    const profile = (await query('SELECT profile_completion FROM students WHERE id = $1', [req.user.id])).rows[0];

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

// GET /student/applications — the logged-in student's submitted applications
export const getApplications = async (req, res, next) => {
  try {
    const rows = (await query(
      `SELECT a.id, f.company_name AS company, a.role, a.applied_date, a.status
         FROM applications a
         JOIN firms f ON f.id = a.firm_id
        WHERE a.student_id = $1
        ORDER BY a.applied_date DESC, a.id`,
      [req.user.id]
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

    const placement = (await query(
      'SELECT id FROM placements WHERE firm_id = $1 AND role = $2',
      [firm.id, role]
    )).rows[0];

    const inserted = (await query(
      `INSERT INTO applications (student_id, placement_id, firm_id, role, applied_date, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, role, applied_date, status`,
      [req.user.id, placement?.id ?? null, firm.id, role, appliedDate || todayISO(), status || 'Pending Review']
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

// GET /student/profile — the logged-in student's own personal details
export const getProfile = async (req, res, next) => {
  try {
    const profile = await fetchProfile(req.user.id);
    if (!profile) {
      return res.status(404).json({ message: 'Student profile not found.' });
    }
    res.json({
      id: profile.id,
      fullName: profile.full_name,
      email: profile.email,
      regNumber: profile.reg_number,
      course: profile.course,
      phone: profile.phone,
      university: profile.university,
      profileCompletion: profile.profile_completion
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /student/profile — edit personal details (name, phone, email)
export const updateProfile = async (req, res, next) => {
  const { fullName, phone, email } = req.body || {};

  const updates = {};
  if (fullName !== undefined) {
    if (typeof fullName !== 'string' || fullName.trim().length < 2) {
      return res.status(400).json({ message: 'Full name must be at least 2 characters long.' });
    }
    updates.full_name = fullName.trim();
  }
  if (phone !== undefined) {
    const trimmed = phone.trim();
    if (trimmed && !PHONE_RE.test(trimmed)) {
      return res.status(400).json({ message: 'Enter a valid Kenyan phone number (e.g. 0712 345 678 or +254712345678).' });
    }
    updates.phone = trimmed || null;
  }
  if (email !== undefined) {
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_RE.test(trimmed)) {
      return res.status(400).json({ message: 'Enter a valid email address.' });
    }
    updates.email = trimmed;
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: 'Nothing to update — provide fullName, phone, or email.' });
  }

  try {
    const setClause = Object.keys(updates)
      .map((key, i) => `${key} = $${i + 1}`)
      .join(', ');
    const values = [...Object.values(updates), req.user.id];

    const row = (await query(
      `UPDATE students SET ${setClause} WHERE id = $${values.length} RETURNING id`,
      values
    )).rows[0];

    if (!row) {
      return res.status(404).json({ message: 'Student profile not found.' });
    }

    const profile = await fetchProfile(req.user.id);
    res.json({
      id: profile.id,
      fullName: profile.full_name,
      email: profile.email,
      regNumber: profile.reg_number,
      course: profile.course,
      phone: profile.phone,
      university: profile.university,
      profileCompletion: profile.profile_completion
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ message: 'That email address is already in use by another account.' });
    }
    next(error);
  }
};
