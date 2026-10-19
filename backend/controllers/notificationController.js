// controllers/notificationController.js
// In-app notification feed behind the dashboard badges (JOB_POSTING_PLAN.md
// Phase 2). One controller serves both routers: the caller's role selects
// which of the two nullable recipient FK columns scopes the query, so a
// student can never read (or mark) a firm's notifications and vice versa.
import { query } from '../data/db.js';

const RECIPIENT_COLUMN = { student: 'student_id', firm: 'firm_id' };

const NOTIFICATION_SELECT = 'id, type, title, body, link, is_read, created_at';

const notificationShape = (r) => ({
  id: r.id,
  type: r.type,
  title: r.title,
  body: r.body,
  link: r.link,
  isRead: r.is_read,
  createdAt: r.created_at
});

// Both routes sit behind authorizeRoles('student') / ('firm'), so this only
// fails if a new mount forgets the gate — refuse rather than read everything.
function scopeFor(user) {
  const column = RECIPIENT_COLUMN[user?.role];
  return column ? { column, id: user.id } : null;
}

function refuse(res) {
  return res.status(403).json({ message: 'Notifications are only available to students and firms.' });
}

// GET /students/notifications | /firms/notifications — newest first, capped
// so a dormant account cannot pull its whole history into the dropdown.
export const listNotifications = async (req, res, next) => {
  const scope = scopeFor(req.user);
  if (!scope) return refuse(res);

  try {
    const rows = (await query(
      `SELECT ${NOTIFICATION_SELECT}
         FROM notifications
        WHERE ${scope.column} = $1
        ORDER BY created_at DESC, id DESC
        LIMIT 50`,
      [scope.id]
    )).rows;
    res.json(rows.map(notificationShape));
  } catch (error) {
    next(error);
  }
};

// GET /students/notifications/unread-count | /firms/notifications/unread-count
// — the number the Navbar badge shows.
export const getUnreadCount = async (req, res, next) => {
  const scope = scopeFor(req.user);
  if (!scope) return refuse(res);

  try {
    const row = (await query(
      `SELECT COUNT(*)::int AS count
         FROM notifications
        WHERE ${scope.column} = $1 AND is_read = false`,
      [scope.id]
    )).rows[0];
    res.json({ count: row.count });
  } catch (error) {
    next(error);
  }
};

// PATCH /students/notifications/:id/read | /firms/notifications/:id/read
// — scoped so one account cannot flip another's, 404 when it is not theirs.
export const markNotificationRead = async (req, res, next) => {
  const scope = scopeFor(req.user);
  if (!scope) return refuse(res);

  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: 'A numeric notification id is required.' });
  }

  try {
    const row = (await query(
      `UPDATE notifications
          SET is_read = true
        WHERE id = $1 AND ${scope.column} = $2
        RETURNING ${NOTIFICATION_SELECT}`,
      [id, scope.id]
    )).rows[0];
    if (!row) {
      return res.status(404).json({ message: `Notification [${id}] not found.` });
    }
    res.json(notificationShape(row));
  } catch (error) {
    next(error);
  }
};

// PATCH /students/notifications/read-all | /firms/notifications/read-all
// — clears the badge in one call; already-read rows are left alone.
export const markAllNotificationsRead = async (req, res, next) => {
  const scope = scopeFor(req.user);
  if (!scope) return refuse(res);

  try {
    const updated = (await query(
      `UPDATE notifications
          SET is_read = true
        WHERE ${scope.column} = $1 AND is_read = false
        RETURNING id`,
      [scope.id]
    )).rows;
    res.json({ updated: updated.length });
  } catch (error) {
    next(error);
  }
};
