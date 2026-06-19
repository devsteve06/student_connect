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
