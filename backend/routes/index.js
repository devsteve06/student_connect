// routes/index.js
// Aggregates every domain router under one mountable router.
import { Router } from 'express';
import authRoutes from './authRoutes.js';
import studentRoutes from './studentRoutes.js';
import cvRoutes from './cvRoutes.js';
import firmRoutes from './firmRoutes.js';
import universityRoutes from './universityRoutes.js';
import adminRoutes from './adminRoutes.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

router.use('/auth', authRoutes);

// Each portal is locked behind a valid JWT carrying the matching role.
router.use('/students', protect, authorizeRoles('student'), studentRoutes);
// CV builder (Phase 1 — backend CRUD; the wizard UI arrives in Phase 2).
router.use('/students/cv', protect, authorizeRoles('student'), cvRoutes);
router.use('/firms', protect, authorizeRoles('firm'), firmRoutes);
router.use('/universities', protect, authorizeRoles('university'), universityRoutes);

// Admin surface — absolute access, locked behind a valid JWT with the admin role.
router.use('/admin', protect, authorizeRoles('admin'), adminRoutes);

export default router;
