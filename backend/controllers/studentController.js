// controllers/studentController.js
import { query } from '../data/db.js';
import { formatDate, todayISO } from '../utils/format.js';

const PHONE_RE = /^(\+?254|0)[17]\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const logbookShape = (r) => ({
  id: r.id,
  weekNumber: r.week_number,
  companyName: r.company_name,
  monday: r.monday,
  tuesday: r.tuesday,
  wednesday: r.wednesday,
  thursday: r.thursday,
  friday: r.friday,
  weeklyReflection: r.weekly_reflection,
  firmStatus: r.firm_sign_off,
  facultyStatus: r.faculty_sign_off,
  submittedAt: formatDate(r.created_at)
});

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

// GET /student/logbooks — the logged-in student's own weekly logbook entries
export const getMyLogbooks = async (req, res, next) => {
  try {
    const rows = (await query(
      `SELECT l.id, l.week_number, f.company_name, l.monday, l.tuesday, l.wednesday,
              l.thursday, l.friday, l.weekly_reflection, l.firm_sign_off, l.faculty_sign_off, l.created_at
         FROM logbooks l
         LEFT JOIN firms f ON f.id = l.firm_id
        WHERE l.student_id = $1
        ORDER BY l.week_number DESC`,
      [req.user.id]
    )).rows;
    res.json(rows.map(logbookShape));
  } catch (error) {
    next(error);
  }
};

// PUT /student/logbooks — submit or update a weekly logbook entry.
// Upserts on (student_id, week_number); submitting (re)sets firm_sign_off to
// 'Pending Review'. Weeks already signed off by faculty are locked.
export const upsertLogbook = async (req, res, next) => {
  const { weekNumber, monday, tuesday, wednesday, thursday, friday, weeklyReflection } = req.body || {};

  const week = Number(weekNumber);
  if (!Number.isInteger(week) || week < 1) {
    return res.status(400).json({ message: 'weekNumber must be a positive whole number.' });
  }
  if (!weeklyReflection || !String(weeklyReflection).trim()) {
    return res.status(400).json({ message: 'weeklyReflection is required to record a logbook week.' });
  }

  const dayText = (value) => (typeof value === 'string' ? value.trim() : '');
  const days = [monday, tuesday, wednesday, thursday, friday].map(dayText);
  if (days.every((day) => day === '')) {
    return res.status(400).json({ message: 'Add at least one daily note (monday–friday) for the week.' });
  }

  try {
    const existing = (await query(
      'SELECT id, faculty_sign_off FROM logbooks WHERE student_id = $1 AND week_number = $2',
      [req.user.id, week]
    )).rows[0];

    if (existing && existing.faculty_sign_off === 'Approved') {
      return res.status(400).json({ message: 'This week is signed off by your faculty supervisor and is locked.' });
    }

    const saved = (await query(
      `INSERT INTO logbooks (student_id, firm_id, week_number, monday, tuesday, wednesday, thursday, friday, weekly_reflection, firm_sign_off, faculty_sign_off)
       VALUES ($1, (SELECT firm_id FROM applications WHERE student_id = $1 ORDER BY applied_date DESC, id DESC LIMIT 1),
               $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (student_id, week_number)
       DO UPDATE SET monday = EXCLUDED.monday, tuesday = EXCLUDED.tuesday,
                     wednesday = EXCLUDED.wednesday, thursday = EXCLUDED.thursday,
                     friday = EXCLUDED.friday, weekly_reflection = EXCLUDED.weekly_reflection,
                     firm_sign_off = 'Pending Review'
       RETURNING id, week_number, firm_sign_off, faculty_sign_off`,
      [req.user.id, week, days[0], days[1], days[2], days[3], days[4], String(weeklyReflection).trim(), 'Pending Review', 'Not Started']
    )).rows[0];

    res.status(existing ? 200 : 201).json({
      id: saved.id,
      weekNumber: saved.week_number,
      firmStatus: saved.firm_sign_off,
      facultyStatus: saved.faculty_sign_off
    });
  } catch (error) {
    next(error);
  }
};
