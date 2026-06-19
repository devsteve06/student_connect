// routes/universityRoutes.js
import { Router } from 'express';
import {
  getCoordinatorMetrics,
  getPendingLogbooks,
  signOffLogbook
} from '../controllers/universityController.js';

const router = Router();

router.get('/metrics', getCoordinatorMetrics);
router.get('/logbooks/pending', getPendingLogbooks);
router.patch('/logbooks/:id', signOffLogbook);

export default router;
