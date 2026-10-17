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
import { query } from '../data/db.js';
import {
  buildAccountEmail,
  institutionDomainFromEmail,
  isValidDomain,
  normalizeDomain
} from '../utils/identity.js';

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
  const { name, password, role, username, companyName } = req.body || {};
  const displayName = role === 'firm' ? companyName || name : name;

  if (!password || !role) {
    return res.status(400).json({ message: 'password and role are required.' });
  }
  if (!ROLES.includes(role)) {
    return res.status(400).json({ message: `Unsupported role: ${role}. Use one of ${ROLES.join(', ')}.` });
  }
  if (role === 'admin' && !username) {
    return res.status(400).json({ message: 'username is required for an admin account.' });
  }
  if (role !== 'admin' && !displayName) {
    return res.status(400).json({ message: 'name is required for this role.' });
  }

  try {
    // Admins keep the classic username + optional email. Every other role gets
    // its address derived from the name + institution, exactly like self-signup.
    if (role !== 'admin') {
      let domain;
      let universityId = null;

      if (role === 'university') {
        domain = normalizeDomain(req.body.domain);
        if (!domain || !isValidDomain(domain)) {
          return res
            .status(400)
            .json({ message: 'A valid university email domain is required (e.g. strathmore.edu).' });
        }
      } else {
        universityId = Number.parseInt(req.body.universityId, 10);
        if (!Number.isInteger(universityId)) {
          return res.status(400).json({ message: 'A university is required for this role.' });
        }
        const university = (
          await query('SELECT id, contact_email FROM universities WHERE id = $1', [universityId])
        ).rows[0];
        if (!university) {
          return res.status(400).json({ message: 'The selected university could not be found.' });
        }
        domain = institutionDomainFromEmail(university.contact_email);
        if (!domain || !isValidDomain(domain)) {
          return res
            .status(400)
            .json({ message: 'That university has no valid email domain on file.' });
        }
      }

      const email = buildAccountEmail({ role, name: displayName, domain }).toLowerCase();
      const existing = await findAccountByEmail(email);
      if (existing) return res.status(409).json({ message: 'A profile with this email already exists.' });

      const account = await createAccount({
        ...req.body,
        name: displayName,
        email,
        universityId: role === 'university' ? undefined : universityId
      });
      return res.status(201).json(account);
    }

    // Admin: duplicate guards on both the username and the optional email.
    const existingAdmin = await findAccountByEmail(username);
    if (existingAdmin) return res.status(409).json({ message: 'An account with this username already exists.' });
    if (req.body.email) {
      const existingEmail = await findAccountByEmail(req.body.email);
      if (existingEmail) return res.status(409).json({ message: 'A profile with this email already exists.' });
    }
    const account = await createAccount({ ...req.body, username, name: name || 'System Administrator' });
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
