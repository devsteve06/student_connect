// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import { findAccountById } from '../data/accounts.js';

// Verifies the Bearer token and injects the matching account onto req.user.
export const protect = async (req, res, next) => {
  const header = req.headers.authorization || '';

  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization rejected: access token missing.' });
  }

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const account = await findAccountById(decoded.role, decoded.id);

    if (!account) {
      return res.status(401).json({ message: 'Authorization rejected: account no longer exists.' });
    }

    req.user = account;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Security check failed: token validation corrupted.' });
  }
};

// Role gatekeeper — usage: authorizeRoles('firm', 'university')
export const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied: role unauthorized for this pipeline.' });
  }
  next();
};

// Admin preview ("view as"). An admin can look around another portal without
// giving up the admin session, but every controller resolves the acting account
// from req.user.id — so the SPA names the account to view (X-View-As-Role /
// X-View-As-Id, set by service/apiClient.js) and this swaps req.user for it.
//
// Two rules keep that honest:
//   * the header role must match the portal the request hit, so a student
//     header can never be used to read the firm pipeline, and
//   * preview is read-only — a write would be attributed to the account being
//     viewed (an admin could apply for a student's internship, or hire on a
//     firm's behalf) instead of to the admin who did it.
const PREVIEWABLE_ROLES = ['student', 'firm', 'university'];

export const previewAs = (expectedRole) => async (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') return next();

  if (!PREVIEWABLE_ROLES.includes(expectedRole)) {
    return res.status(403).json({ message: 'Access denied: that portal cannot be previewed.' });
  }

  const role = String(req.headers['x-view-as-role'] || '').trim().toLowerCase();
  const id = Number(req.headers['x-view-as-id']);

  if (!role || !Number.isInteger(id) || id <= 0) {
    return res
      .status(403)
      .json({ message: 'Access denied: admin preview needs a target account (X-View-As-Role, X-View-As-Id).' });
  }

  if (role !== expectedRole) {
    return res
      .status(403)
      .json({ message: `Access denied: a ${role} account cannot open the ${expectedRole} portal.` });
  }

  if (req.method !== 'GET') {
    return res
      .status(403)
      .json({ message: 'Admin preview is read-only — sign in as this account to make changes.' });
  }

  try {
    const account = await findAccountById(role, id);
    if (!account) {
      return res.status(404).json({ message: 'That account no longer exists.' });
    }
    req.previewAdminId = req.user.id;
    req.user = account;
    return next();
  } catch (error) {
    return next(error);
  }
};
