// routes/cvRoutes.js
// Student CV builder (Phase 1 — backend CRUD; Phase 6 — upload). All endpoints
// sit behind the student guard; the wizard UI only calls these handlers.
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import {
  getCvs,
  createCv,
  getCv,
  updateCv,
  deleteCv,
  setPrimaryCv,
  exportCv,
  analyzeCv,
  getAnalyses
} from '../controllers/cvController.js';
import { uploadCv } from '../controllers/cvUploadController.js';
import { uploadCvFile, MAX_CV_BYTES } from '../middleware/uploadMiddleware.js';

const router = Router();

// Parsing a PDF costs real CPU, so uploads get a modest per-window budget.
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  legacyHeaders: false,
  message: { message: 'Too many CV uploads. Please try again later.' },
  handler: (_req, res) => {
    res.set('Retry-After', String(Math.ceil(15 * 60)));
    res.status(429).json({ message: 'Too many CV uploads. Please try again later.' });
  }
});

router.get('/', getCvs);
router.post('/', createCv);
// Upload and analyzer routes must be declared before /:id so that "upload" and
// "analyses" are never read as a numeric CV id by the parameterized GET below.
router.post(
  '/upload',
  uploadLimiter,
  (req, res, next) => {
    uploadCvFile.single('file')(req, res, (err) => {
      if (err) return next(err);
      next();
    });
  },
  uploadCv
);
router.post('/analyze', analyzeCv);
router.get('/analyses', getAnalyses);
router.get('/:id', getCv);
router.patch('/:id', updateCv);
router.delete('/:id', deleteCv);
router.post('/:id/primary', setPrimaryCv);
// Phase 3 — server-side PDF export. Must be registered after the `/:id`
// GET above, but before any conflicting sub-path; Express matches this more
// specifically because `:id` cannot contain a slash.
router.get('/:id/export', exportCv);

export default router;