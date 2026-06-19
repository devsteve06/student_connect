// controllers/adminController.js
// All handlers here run behind protect + authorizeRoles('admin'), so req.user
// is guaranteed to be a system administrator.
import {
  ROLE_TABLES,
  findAccountByEmail,
  createAccount,
  resetPassword,
  deleteAccount,
  listAllAccounts
} from '../data/accounts.js';

const ROLES = Object.keys(ROLE_TABLES); // admin, student, firm, university

// GET /admin/users — list every account across all role tables
export const listUsers = async (req, res, next) => {
  try {
    res.json(await listAllAccounts());
  } catch (error) {
    next(error);
  }
};

// POST /admin/users — create an account of any role
export const createUser = async (req, res, next) => {
  const { name, email, password, role } = req.body;

  if (!password || !role) {
    return res.status(400).json({ message: 'password and role are required.' });
  }
  if (!ROLES.includes(role)) {
    return res.status(400).json({ message: `Unsupported role: ${role}. Use one of ${ROLES.join(', ')}.` });
  }
  if (role !== 'admin' && (!name || !email)) {
    return res.status(400).json({ message: 'name and email are required for this role.' });
  }

  try {
    if (email) {
      const existing = await findAccountByEmail(email);
      if (existing) return res.status(400).json({ message: 'A profile with this email already exists.' });
    }
    const account = await createAccount(req.body);
    res.status(201).json(account);
  } catch (error) {
    next(error);
  }
};

// POST /admin/reset-password — reset the password for any account
// body: { role, id, newPassword }
export const resetUserPassword = async (req, res, next) => {
  const { role, id, newPassword } = req.body;

  if (!role || id == null || !newPassword) {
    return res.status(400).json({ message: 'role, id and newPassword are required.' });
  }
  if (!ROLES.includes(role)) {
    return res.status(400).json({ message: `Unsupported role: ${role}.` });
  }

  try {
    const ok = await resetPassword(role, id, newPassword);
    if (!ok) return res.status(404).json({ message: `No ${role} found with id ${id}.` });
    res.json({ message: `Password reset successfully for ${role} #${id}.` });
  } catch (error) {
    next(error);
  }
};

// DELETE /admin/users/:role/:id — remove any account
export const deleteUser = async (req, res, next) => {
  const { role } = req.params;
  const id = parseInt(req.params.id, 10);

  if (!ROLES.includes(role)) {
    return res.status(400).json({ message: `Unsupported role: ${role}.` });
  }
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: 'A numeric id is required.' });
  }
  // Guard against an admin deleting their own account mid-session.
  if (role === 'admin' && id === req.user.id) {
    return res.status(400).json({ message: 'You cannot delete your own admin account.' });
  }

  try {
    const ok = await deleteAccount(role, id);
    if (!ok) return res.status(404).json({ message: `No ${role} found with id ${id}.` });
    res.json({ message: `${role} #${id} deleted.` });
  } catch (error) {
    next(error);
  }
};
