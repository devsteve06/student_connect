// controllers/authController.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { findAccountByEmail, createAccount } from '../data/accounts.js';

const generateToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// Roles that may create their own account through the public signup form.
// Admins are deliberately excluded — they are provisioned by another admin.
const SELF_SERVE_ROLES = ['student', 'firm', 'university'];

// Fields the signup forms collect per role. `name` is the display name for the
// students/universities tables; firms store the company under `company_name`.
// Validating these here is what stops the form from collecting input that the
// data layer then silently throws away.
const REQUIRED_FIELDS = {
  student: ['name', 'email', 'password', 'regNumber'],
  firm: ['companyName', 'contactPerson', 'email', 'password'],
  university: ['name', 'email', 'password', 'staffId'],
};

// POST /auth/register — create a student, firm, or university account
export const registerUser = async (req, res, next) => {
  const { email, password, role } = req.body || {};

  if (!email || !password || !role) {
    return res.status(400).json({ message: 'email, password and role are required.' });
  }
  if (!SELF_SERVE_ROLES.includes(role)) {
    return res.status(400).json({ message: `Unsupported role: ${role}` });
  }

  // Firms carry their legal name in companyName, not name.
  const normalized = { ...req.body, name: req.body.name || req.body.companyName };

  const missing = REQUIRED_FIELDS[role].filter(
    (field) => !String(normalized[field] ?? '').trim()
  );
  if (missing.length > 0) {
    return res.status(400).json({
      message: `Missing required ${missing.length === 1 ? 'field' : 'fields'}: ${missing.join(', ')}.`
    });
  }

  try {
    const existing = await findAccountByEmail(email);
    if (existing) {
      return res.status(400).json({ message: 'A profile with this email already exists.' });
    }

    const account = await createAccount(normalized);
    res.status(201).json({
      _id: account.id,
      name: account.name,
      email: account.email,
      role: account.role,
      token: generateToken(account.id, account.role)
    });
  } catch (error) {
    next(error);
  }
};

// POST /auth/login — authenticate against any role table and issue a JWT
export const loginUser = async (req, res, next) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required.' });
  }

  try {
    const account = await findAccountByEmail(email);
    if (account && (await bcrypt.compare(password || '', account.password_hash))) {
      return res.json({
        _id: account.id,
        name: account.name,
        email: account.email,
        role: account.role,
        token: generateToken(account.id, account.role)
      });
    }
    res.status(401).json({ message: 'Invalid credentials provided.' });
  } catch (error) {
    next(error);
  }
};
