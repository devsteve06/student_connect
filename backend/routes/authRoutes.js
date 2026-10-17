// routes/authRoutes.js
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { registerUser, loginUser, listUniversities } from '../controllers/authController.js';

const router = Router();

// Brute-force guard for the credential endpoint only.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again later.' },
  handler: (_req, res) => {
    res.set('Retry-After', String(Math.ceil(15 * 60)));
    res.status(429).json({ message: 'Too many login attempts. Please try again later.' });
  }
});

// Signup is unauthenticated and every call hashes a password and writes a row,
// so it gets its own (looser) budget to stop scripted mass-account creation
// without blocking a whole placement season's cohort registering together.
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  legacyHeaders: false,
  message: { message: 'Too many accounts created from this network. Please try again later.' },
  handler: (_req, res) => {
    res.set('Retry-After', String(Math.ceil(60 * 60)));
    res.status(429).json({ message: 'Too many accounts created from this network. Please try again later.' });
  }
});

// Public institution list for the signup dropdowns (no auth — the signup
// forms run before any session exists).
router.get('/universities', listUniversities);

router.post('/register', registerLimiter, registerUser);
router.post('/login', loginLimiter, loginUser);

export default router;
