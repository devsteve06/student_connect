// routes/universityRoutes.js
import { Router } from 'express';
import {
  getCoordinatorMetrics,
  getPendingLogbooks,
  signOffLogbook,
  getAuditLog
} from '../controllers/universityController.js';

const router = Router();

router.get('/metrics', getCoordinatorMetrics);
router.get('/logbooks/pending', getPendingLogbooks);
router.patch('/logbooks/:id', signOffLogbook);
router.get('/audits', getAuditLog);

export default router;
