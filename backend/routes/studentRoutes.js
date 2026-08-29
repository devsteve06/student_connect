// routes/studentRoutes.js
import { Router } from 'express';
import {
  getMetrics,
  getApplications,
  applyForPlacement,
  getPlacements,
  getProfile,
  updateProfile
} from '../controllers/studentController.js';

const router = Router();

router.get('/metrics', getMetrics);
router.get('/applications', getApplications);
router.post('/applications', applyForPlacement);
router.get('/placements', getPlacements);
router.get('/profile', getProfile);
router.patch('/profile', updateProfile);

export default router;
