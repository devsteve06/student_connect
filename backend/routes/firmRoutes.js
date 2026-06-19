// routes/firmRoutes.js
import { Router } from 'express';
import {
  getFirmMetrics,
  getApplicants,
  updateApplicantStatus
} from '../controllers/firmController.js';

const router = Router();

router.get('/metrics', getFirmMetrics);
router.get('/applicants', getApplicants);
router.patch('/applicants/:id', updateApplicantStatus);

export default router;
