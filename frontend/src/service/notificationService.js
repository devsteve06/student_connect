// service/notificationService.js
// In-app notifications (JOB_POSTING_PLAN.md Phase 2). The backend controller
// is shared by both portals — only the mount point differs — so callers pass
// the signed-in user's role and get the matching feed.
import apiClient from './apiClient';

const BASE_PATHS = {
  student: '/api/v1/students/notifications',
  firm: '/api/v1/firms/notifications'
};

// University/admin accounts have no feed; fail loudly instead of 404ing.
function base(role) {
  const path = BASE_PATHS[role];
  if (!path) throw new Error(`No notification feed for role "${role}".`);
  return path;
}

export const notificationService = {
  // Full feed (newest first, capped server-side at 50).
  list: async (role) => {
    const response = await apiClient.get(base(role));
    return response.data;
  },

  // The badge number: { count } of unread notifications.
  unreadCount: async (role) => {
    const response = await apiClient.get(`${base(role)}/unread-count`);
    return response.data;
  },

  // Mark a single notification read; returns the updated notification.
  markRead: async (role, id) => {
    const response = await apiClient.patch(`${base(role)}/${id}/read`);
    return response.data;
  },

  // Clear the whole badge; returns { updated }.
  markAllRead: async (role) => {
    const response = await apiClient.patch(`${base(role)}/read-all`);
    return response.data;
  }
};
