// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import { findAccountById } from '../data/accounts.js';
import { logger } from '../utils/logger.js';

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

    // Unverified accounts cannot access protected routes.
    if (!account.email_verified) {
      return res.status(403).json({ message: 'Email not verified. Please verify your email before accessing this resource.' });
    }

    // Token binding: if the account's password was changed after this token was
    // issued, the token is invalidated. Clients always see a generic 401; the
    // specific reason is logged server-side for admin diagnosis.
    if (account.password_changed_at && decoded.passwordChangedAt != null) {
      const tokenIssuedAt = new Date(decoded.passwordChangedAt);
      const passwordChangedAt = new Date(account.password_changed_at);
      if (passwordChangedAt > tokenIssuedAt) {
        logger.warn('token invalidated by password rotation', {
          requestId: req.id,
          accountId: account.id,
          role: account.role,
          tokenIssuedAt: tokenIssuedAt.toISOString(),
          passwordChangedAt: passwordChangedAt.toISOString()
        });
        return res.status(401).json({ message: 'Authorization rejected: access token missing.' });
      }
    }

    req.user = account;
    next();
  } catch (error) {
    // Distinguish expired tokens for server-side diagnostics; the client still
    // receives a generic 401 so no token validity information leaks.
    if (error.name === 'TokenExpiredError') {
      logger.warn('token expired', {
        requestId: req.id,
        error: error.message
      });
    } else {
      logger.warn('token validation failed', {
        requestId: req.id,
        error: error.message
      });
    }
    return res.status(401).json({ message: 'Authorization rejected: access token missing.' });
  }
};

// Role gatekeeper — usage: authorizeRoles('firm', 'university')
export const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied: role unauthorized for this pipeline.' });
  }
  next();
};
