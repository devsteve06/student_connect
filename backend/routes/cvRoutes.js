// routes/cvRoutes.js
// Student CV builder (Phase 1 — backend CRUD). All endpoints sit behind the
// student guard; the wizard UI (Phase 2) only calls these handlers.
import { Router } from 'express';
import {
  getCvs,
  createCv,
  getCv,
  updateCv,
  deleteCv,
  setPrimaryCv,
  exportCv
} from '../controllers/cvController.js';

const router = Router();

router.get('/cv', getCvs);
router.post('/cv', createCv);
router.get('/cv/:id', getCv);
router.patch('/cv/:id', updateCv);
router.delete('/cv/:id', deleteCv);
router.post('/cv/:id/primary', setPrimaryCv);
// Phase 3 — server-side PDF export. Must be registered after the `/cv/:id`
// GET above, but before any conflicting sub-path; Express matches this more
// specifically because `:id` cannot contain a slash.
router.get('/cv/:id/export', exportCv);

export default router;
