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
  setPrimaryCv
} from '../controllers/cvController.js';

const router = Router();

router.get('/cv', getCvs);
router.post('/cv', createCv);
router.get('/cv/:id', getCv);
router.patch('/cv/:id', updateCv);
router.delete('/cv/:id', deleteCv);
router.post('/cv/:id/primary', setPrimaryCv);

export default router;
