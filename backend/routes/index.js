// routes/index.js
// Aggregates every domain router under one mountable router.
import { Router } from 'express';
import authRoutes from './authRoutes.js';
import studentRoutes from './studentRoutes.js';
import cvRoutes from './cvRoutes.js';
import firmRoutes from './firmRoutes.js';
import universityRoutes from './universityRoutes.js';
import adminRoutes from './adminRoutes.js';
import { protect, authorizeRoles, previewAs } from '../middleware/authMiddleware.js';

const router = Router();

router.use('/auth', authRoutes);

// Each portal is locked behind a valid JWT carrying the matching role. An admin
// token may also enter — read-only, and only through previewAs(), which swaps
// req.user for the account named in the X-View-As-* headers.
router.use('/students', protect, authorizeRoles('student', 'admin'), previewAs('student'), studentRoutes);
// CV builder (Phase 1 — backend CRUD; the wizard UI arrives in Phase 2).
router.use('/students/cv', protect, authorizeRoles('student', 'admin'), previewAs('student'), cvRoutes);
router.use('/firms', protect, authorizeRoles('firm', 'admin'), previewAs('firm'), firmRoutes);
router.use('/universities', protect, authorizeRoles('university', 'admin'), previewAs('university'), universityRoutes);

// Admin surface — absolute access, locked behind a valid JWT with the admin role.
router.use('/admin', protect, authorizeRoles('admin'), adminRoutes);

export default router;
