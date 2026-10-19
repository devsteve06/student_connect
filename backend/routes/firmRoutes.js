// routes/firmRoutes.js
import { Router } from 'express';
import {
  getFirmMetrics,
  getApplicants,
  updateApplicantStatus
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

// Notifications (JOB_POSTING_PLAN.md Phase 2) — feed + badge counters.
router.get('/notifications', listNotifications);
router.get('/notifications/unread-count', getUnreadCount);
router.patch('/notifications/read-all', markAllNotificationsRead);
router.patch('/notifications/:id/read', markNotificationRead);

export default router;
