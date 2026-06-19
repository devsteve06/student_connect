// routes/studentRoutes.js
import { Router } from 'express';
import {
  getMetrics,
  getApplications,
  applyForPlacement,
  getPlacements
} from '../controllers/studentController.js';

const router = Router();

router.get('/metrics', getMetrics);
router.get('/applications', getApplications);
router.post('/applications', applyForPlacement);
router.get('/placements', getPlacements);

export default router;
