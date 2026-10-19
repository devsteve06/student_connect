// routes/firmRoutes.js
import { Router } from 'express';
import {
  getFirmMetrics,
  getApplicants,
  updateApplicantStatus,
  listPlacements,
  createPlacement,
  updatePlacement,
  closePlacement
} from '../controllers/firmController.js';
import {
  listNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead
} from '../controllers/notificationController.js';

const router = Router();

router.get('/metrics', getFirmMetrics);
router.get('/applicants', getApplicants);
router.patch('/applicants/:id', updateApplicantStatus);

// Job postings (JOB_POSTING_PLAN.md Phase 3) — CRUD for the firm's own
// placements; the close route is declared before /:id for clarity.
router.get('/placements', listPlacements);
router.post('/placements', createPlacement);
router.patch('/placements/:id/close', closePlacement);
router.patch('/placements/:id', updatePlacement);

// Notifications (JOB_POSTING_PLAN.md Phase 2) — feed + badge counters.
router.get('/notifications', listNotifications);
router.get('/notifications/unread-count', getUnreadCount);
router.patch('/notifications/read-all', markAllNotificationsRead);
router.patch('/notifications/:id/read', markNotificationRead);

export default router;
