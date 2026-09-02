// routes/authRoutes.js
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { registerUser, loginUser } from '../controllers/authController.js';

const router = Router();

// Brute-force guard for the credential endpoint only.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again later.' }
});

router.post('/register', registerUser);
router.post('/login', loginLimiter, loginUser);

export default router;