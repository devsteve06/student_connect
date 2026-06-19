// routes/adminRoutes.js
import { Router } from 'express';
import {
  listUsers,
  createUser,
  resetUserPassword,
  deleteUser
} from '../controllers/adminController.js';

const router = Router();

router.get('/users', listUsers);
router.post('/users', createUser);
router.delete('/users/:role/:id', deleteUser);
router.post('/reset-password', resetUserPassword);

export default router;
