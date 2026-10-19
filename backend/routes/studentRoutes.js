// routes/studentRoutes.js
import { Router } from 'express';
import {
  getMetrics,
  getApplications,
  applyForPlacement,
  getPlacements,
  getProfile,
  updateProfile,
  getMyLogbooks,
  upsertLogbook
} from '../controllers/studentController.js';
import {
  listNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead
} from '../controllers/notificationController.js';

const router = Router();

router.get('/metrics', getMetrics);
router.get('/applications', getApplications);
router.post('/applications', applyForPlacement);
router.get('/placements', getPlacements);
router.get('/profile', getProfile);
router.patch('/profile', updateProfile);
router.get('/logbooks', getMyLogbooks);
router.put('/logbooks', upsertLogbook);

// Notifications (JOB_POSTING_PLAN.md Phase 2) — feed + badge counters.
router.get('/notifications', listNotifications);
router.get('/notifications/unread-count', getUnreadCount);
router.patch('/notifications/read-all', markAllNotificationsRead);
router.patch('/notifications/:id/read', markNotificationRead);

export default router;
