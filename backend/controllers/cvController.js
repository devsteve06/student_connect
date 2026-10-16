// controllers/cvController.js
// CRUD + primary management for the student CV builder (Phase 1).
// The guided wizard itself (Phase 2) only ever calls these handlers; the
// job analyzer is Phase 4 and lives in cvAnalyzer.
import { query } from '../data/db.js';
import PDFDocument from 'pdfkit';

// Maps a student_cvs row to the camelCase shape the API responds with.
const cvShape = (r) => ({
  id: r.id,
  studentId: r.student_id,
  title: r.title,
  isPrimary: r.is_primary,
  personalInfo: r.personal_info,
  professionalSummary: r.professional_summary,
  education: r.education,
  experience: r.experience,
  skills: r.skills,
  projects: r.projects,
  certifications: r.certifications,
  createdAt: r.created_at,
  updatedAt: r.updated_at
});

// Maps a cv_analyses row to the camelCase shape the API responds with.
const analysisShape = (r) => ({
  id: r.id,
  studentId: r.student_id,
  cvId: r.cv_id,
  placementId: r.placement_id,
  jobTitle: r.job_title,
  jobDescription: r.job_description,
  matchScore: r.match_score,
  keywordMatch: r.keyword_match,
  gapAnalysis: r.gap_analysis,
  sectionScores: r.section_scores,
  createdAt: r.created_at
});

// Every handler here runs behind protect + authorizeRoles('student'), so
// req.user is guaranteed to be the student owning the CVs being touched.
const studentIdOf = (req) => req.user.id;

// GET /student/cv — every CV (and its primary flag) belonging to the student.
export const getCvs = async (req, res, next) => {
  try {
    const rows = (
      await query(
        `SELECT * FROM student_cvs WHERE student_id = $1 ORDER BY is_primary DESC, created_at DESC, id DESC`,
        [studentIdOf(req)]
      )
    ).rows;
    res.json(rows.map(cvShape));
  } catch (error) {
    next(error);
  }
};

// POST /student/cv — create a new CV. The first CV a student saves becomes
// its primary; a student may only ever have one primary.
export const createCv = async (req, res, next) => {
  try {
    const count = (
      await query('SELECT COUNT(*)::int AS c FROM student_cvs WHERE student_id = $1', [
        studentIdOf(req)
      ])
    ).rows[0].c;
    const isPrimary = count === 0;

    const row = (
      await query(
        `INSERT INTO student_cvs (student_id, title, is_primary, personal_info, professional_summary,
                                    education, experience, skills, projects, certifications)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id, student_id, title, is_primary, personal_info, professional_summary, education, experience, skills, projects, certifications, created_at, updated_at`,
        [
          studentIdOf(req),
          (req.body.title || '').trim(),
          isPrimary,
          req.body.personalInfo ?? null,
          req.body.professionalSummary ?? null,
          req.body.education ?? null,
          req.body.experience ?? null,
          req.body.skills ?? null,
          req.body.projects ?? null,
          req.body.certifications ?? null
        ]
      )
    ).rows[0];
    res.status(201).json(cvShape(row));
  } catch (error) {
    next(error);
  }
};

// GET /student/cv/:id — a single CV, scoped to the logged-in student.
export const getCv = async (req, res, next) => {
  try {
    const row = (
      await query(
        `SELECT * FROM student_cvs WHERE id = $1 AND student_id = $2`,
        [req.params.id, studentIdOf(req)]
      )
    ).rows[0];
    if (!row) {
      return res.status(404).json({ message: 'No CV found for this student.' });
    }
    res.json(cvShape(row));
  } catch (error) {
    next(error);
  }
};

// PATCH /student/cv/:id — update any part of the stored CV.
export const updateCv = async (req, res, next) => {
  try {
    const existing = (
      await query('SELECT id FROM student_cvs WHERE id = $1 AND student_id = $2', [
        req.params.id,
        studentIdOf(req)
      ])
    ).rows[0];
    if (!existing) {
      return res.status(404).json({ message: 'No CV found for this student.' });
    }

    const row = (
      await query(
        `UPDATE student_cvs
            SET title = COALESCE($2, title),
                personal_info = COALESCE($3, personal_info),
                professional_summary = COALESCE($4, professional_summary),
                education = COALESCE($5, education),
                experience = COALESCE($6, experience),
                skills = COALESCE($7, skills),
                projects = COALESCE($8, projects),
                certifications = COALESCE($9, certifications),
                updated_at = NOW()
          WHERE id = $1
          RETURNING id, student_id, title, is_primary, personal_info, professional_summary, education, experience, skills, projects, certifications, created_at, updated_at`,
        [
          req.params.id,
          req.body.title ?? null,
          req.body.personalInfo ?? null,
          req.body.professionalSummary ?? null,
          req.body.education ?? null,
          req.body.experience ?? null,
          req.body.skills ?? null,
          req.body.projects ?? null,
          req.body.certifications ?? null
        ]
      )
    ).rows[0];
    res.json(cvShape(row));
  } catch (error) {
    next(error);
  }
};

// DELETE /student/cv/:id — remove a CV the student owns.
export const deleteCv = async (req, res, next) => {
  try {
    const existing = (
      await query('SELECT id FROM student_cvs WHERE id = $1 AND student_id = $2', [
        req.params.id,
        studentIdOf(req)
      ])
    ).rows[0];
    if (!existing) {
      return res.status(404).json({ message: 'No CV found for this student.' });
    }

    // The `existing` SELECT above already verified the CV is owned by the
    // logged-in student, so the DELETE cannot miss.
    await query('DELETE FROM student_cvs WHERE id = $1', [req.params.id]);
    res.json({ message: 'CV deleted.' });
  } catch (error) {
    next(error);
  }
};

// POST /student/cv/:id/primary — promote a CV to primary. A student may have
// only one primary, so demoting the current primary is part of the swap.
export const setPrimaryCv = async (req, res, next) => {
  try {
    const cvId = Number(req.params.id);
    if (!Number.isInteger(cvId)) {
      return res.status(400).json({ message: 'A valid cv id is required.' });
    }

    const cv = (
      await query(
        'SELECT * FROM student_cvs WHERE id = $1 AND student_id = $2',
        [cvId, studentIdOf(req)]
      )
    ).rows[0];
    if (!cv) {
      return res.status(404).json({ message: 'No CV found for this student.' });
    }

    const current = (
      await query(
        'SELECT id FROM student_cvs WHERE student_id = $1 AND is_primary = true',
        [studentIdOf(req)]
      )
    ).rows[0];
    if (current && current.id !== cv.id) {
      await query('UPDATE student_cvs SET is_primary = false WHERE id = $1', [current.id]);
    }

    const row = (
      await query(
        'UPDATE student_cvs SET is_primary = true WHERE id = $1 RETURNING id, student_id, title, is_primary, personal_info, professional_summary, education, experience, skills, projects, certifications, created_at, updated_at',
        [cvId]
      )
    ).rows[0];
    res.json(cvShape(row));
  } catch (error) {
    next(error);
  }
};

// Phase 3 — server-side PDF export. Renders the saved CV as a simple, branded
// document and streams it back as an attachment. Kept intentionally plain:
// it is a print-friendly summary, not a full layout engine.
const FORMAT_VALUE_LIMIT = 200;

function formatValue(value) {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) {
    const flat = value.flatMap((item) =>
      Array.isArray(item) ? item : [item]
    );
    const text = flat
      .map((item) => {
        if (item && typeof item === 'object') {
          return Object.values(item).join(' ');
        }
        return String(item);
      })
      .filter((line) => line.trim().length > 0)
      .join(', ');
    return text.length > FORMAT_VALUE_LIMIT ? text.slice(0, FORMAT_VALUE_LIMIT) + '…' : text;
  }
  const text = String(value);
  return text.length > FORMAT_VALUE_LIMIT ? text.slice(0, FORMAT_VALUE_LIMIT) + '…' : text;
}

// One labelled line per entry, e.g. "School: Strathmore University".
function addEntries(doc, heading, entries) {
  doc.font('Helvetica-Bold').fontSize(13).text(heading, { bold: true });
  let added = false;
  for (const entry of entries) {
    const value = formatValue(entry.value);
    if (value === null) continue;
    if (added) doc.moveDown(0.4);
    doc.font('Helvetica').fontSize(11).text(`${entry.label}: ${value}`);
    added = true;
  }
  doc.moveDown(0.5);
}

function addHeading(doc, text) {
  doc.font('Helvetica-Bold').fontSize(15).text(text, { bold: true });
}

function buildPdf(doc, cv) {
  // ---- header ----------------------------------------------------------
  addHeading(doc, cv.title || 'Untitled CV');
  doc.font('Helvetica').fontSize(11).text(
    `Generated for ${cv.personalInfo?.name ?? 'a student'} on ${todayStamp()}`
  );
  doc.moveDown(1);

  // ---- personal details -----------------------------------------------
  const personalEntries = [
    ['Name', cv.personalInfo?.name],
    ['Email', cv.personalInfo?.email],
    ['Phone', cv.personalInfo?.phone],
    ['Location', cv.personalInfo?.location],
    ['Website / LinkedIn', cv.personalInfo?.links]
  ].filter(([, value]) => value);
  if (personalEntries.length > 0) {
    addEntries(doc, 'Personal details', personalEntries);
  }

  // ---- professional summary -------------------------------------------
  if (cv.professionalSummary) {
    addHeading(doc, 'Professional summary');
    doc.font('Helvetica').fontSize(11).text(cv.professionalSummary);
  }

  // ---- education ------------------------------------------------------
  addEntries(doc, 'Education', (cv.education ?? []).map((entry) => ({
    label: entry.school ?? 'Qualification',
    value: entry.degree ?? entry.year ?? null
  })));

  // ---- experience ----------------------------------------------------
  addEntries(doc, 'Experience', (cv.experience ?? []).map((entry) => ({
    label: entry.company ?? 'Experience',
    value: [
      entry.role,
      entry.start && entry.start !== entry.end
        ? `${entry.start} – ${entry.end}`
        : entry.start
    ]
      .filter(Boolean)
      .join(' — ')
  })));

  // ---- skills --------------------------------------------------------
  addEntries(doc, 'Skills', (cv.skills ?? []).map((entry) => ({
    label: entry.category,
    value: entry.items
  })));

  // ---- projects ------------------------------------------------------
  addEntries(doc, 'Projects', (cv.projects ?? []).map((entry) => ({
    label: entry.name ?? 'Project',
    value: entry.link ?? entry.description
  })));

  // ---- certifications ------------------------------------------------
  addEntries(doc, 'Certifications', (cv.certifications ?? []).map((entry) => ({
    label: entry.title ?? 'Certification',
    value: entry.issuer ?? entry.year ?? null
  })));

  doc.moveDown(2);
  doc.font('Helvetica').fontSize(9).text('End of CV.');
}

function todayStamp() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  return `${year}-${month}-${day}`;
}

// GET /student/cv/:id/export — stream the CV as a PDF attachment (Phase 3).
export const exportCv = async (req, res, next) => {
  try {
    const cv = (
      await query(
        'SELECT * FROM student_cvs WHERE id = $1 AND student_id = $2',
        [req.params.id, studentIdOf(req)]
      )
    ).rows[0];
    if (!cv) {
      return res.status(404).json({ message: 'No CV found for this student.' });
    }

    const doc = new PDFDocument({ margin: 48, size: 'A4' });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));

    buildPdf(doc, cv);
    doc.end();

    await new Promise((resolve, reject) => {
      doc.once('end', resolve);
      doc.once('error', reject);
    });

    const pdf = Buffer.concat(chunks);
    const safeName = (cv.title || 'cv')
      .replace(/[^\w]+/g, '-')
      .replace(/\.pdf$/i, '')
      .replace(/^-+|-+$/g, '') || 'cv';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.pdf"`);
    res.status(200).send(pdf);
  } catch (error) {
    next(error);
  }
};
