// controllers/cvUploadController.js
// Turns an uploaded CV file into a saved, editable student_cvs row.
//
// The flow is deliberately short: extract text from the buffer (PDF via
// pdf-parse, text files read directly), parse it into the CV shape with the
// heuristic in utils/cvParser.js, then insert one row marked as an upload.
// The wizard opens that row for review, so an imperfect parse is a starting
// point rather than a dead end.
import { query } from '../data/db.js';
import { cvShape } from './cvController.js';
import { extractCvText } from '../utils/cvText.js';
import { parseCvText } from '../utils/cvParser.js';

// Extracted text is kept for the analyzer, but a pathological file should not
// be able to bloat the row (or a response) beyond a sane bound.
const RAW_TEXT_LIMIT = 200_000;
// Below this many characters a "successful" extraction is really a scanned or
// image-only PDF; treat it as unreadable instead of saving an empty CV.
const MIN_READABLE_CHARS = 20;

const RETURNING_COLUMNS = `id, student_id, title, is_primary, personal_info, professional_summary,
  education, experience, skills, projects, certifications, original_filename,
  mime_type, upload_source, uploaded_at, created_at, updated_at`;

// POST /student/cv/upload — multipart/form-data with a single `file` field.
export const uploadCv = async (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: 'Attach a CV file to upload.' });
    }

    const { originalname = 'cv', mimetype = '' } = req.file;
    const text = (await extractCvText(req.file.buffer, {
      filename: originalname,
      mimeType: mimetype
    })).trim();

    if (text.length < MIN_READABLE_CHARS) {
      return res.status(422).json({
        message:
          'No readable text was found in that file. If it is a scanned PDF, save it as text or build the CV manually.'
      });
    }

    const parsed = parseCvText(text, originalname);
    const studentId = req.user.id;

    // The first CV a student saves becomes their primary (mirrors createCv).
    const existingCount = (
      await query('SELECT COUNT(*)::int AS c FROM student_cvs WHERE student_id = $1', [studentId])
    ).rows[0].c;

    const row = (
      await query(
        `INSERT INTO student_cvs
           (student_id, title, is_primary, personal_info, professional_summary,
            education, experience, skills, projects, certifications,
            original_filename, mime_type, upload_source, uploaded_at, raw_text)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'upload', NOW(), $13)
         RETURNING ${RETURNING_COLUMNS}`,
        [
          studentId,
          parsed.title || originalname || 'Uploaded CV',
          existingCount === 0,
          JSON.stringify(parsed.personalInfo || {}),
          parsed.professionalSummary || null,
          Array.isArray(parsed.education) ? JSON.stringify(parsed.education) : JSON.stringify([]),
          Array.isArray(parsed.experience) ? JSON.stringify(parsed.experience) : JSON.stringify([]),
          Array.isArray(parsed.skills) ? JSON.stringify(parsed.skills) : JSON.stringify([]),
          Array.isArray(parsed.projects) ? JSON.stringify(parsed.projects) : JSON.stringify([]),
          Array.isArray(parsed.certifications) ? JSON.stringify(parsed.certifications) : JSON.stringify([]),
          originalname.slice(0, 255),
          mimetype.slice(0, 100),
          text.slice(0, RAW_TEXT_LIMIT)
        ]
      )
    ).rows[0];

    res.status(201).json(cvShape(row));
  } catch (error) {
    next(error);
  }
};
