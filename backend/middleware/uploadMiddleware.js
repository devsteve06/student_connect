// middleware/uploadMiddleware.js
// In-memory multipart handling for CV uploads.
//
// The file is never written to disk — multer hands the controller a Buffer and
// the parser reads it immediately. Only PDF / plain-text files up to 2 MB are
// accepted; anything else is rejected with 415 before the parser runs.
import multer from 'multer';

export const MAX_CV_BYTES = 2 * 1024 * 1024;

const PDF = /\.pdf$/i;
const TEXT = /\.(txt|md|markdown)$/i;

function isAllowed(file) {
  const name = file.originalname || '';
  return (
    file.mimetype === 'application/pdf' ||
    file.mimetype === 'application/x-pdf' ||
    file.mimetype.startsWith('text/') ||
    PDF.test(name) ||
    TEXT.test(name)
  );
}

export const uploadCvFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_CV_BYTES, files: 1, fields: 4 },
  fileFilter: (_req, file, cb) => {
    if (isAllowed(file)) return cb(null, true);
    const error = new Error('Only PDF or plain-text (.txt) CVs can be uploaded.');
    error.status = 415;
    return cb(error);
  }
});
