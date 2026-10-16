// controllers/authController.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { findAccountByEmail, createAccount } from '../data/accounts.js';
import { query, transaction } from '../data/db.js';

const generateToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// Roles that may create their own account through the public signup form.
// Admins are deliberately excluded — they are provisioned by another admin.
const SELF_SERVE_ROLES = ['student', 'firm', 'university'];

// Fields the signup forms collect per role. `name` is the display name for the
// students/universities tables; firms store the company under `companyName`.
// Validating these here is what stops the form from collecting input that the
// data layer then silently throws away.
const REQUIRED_FIELDS = {
  student: ['name', 'email', 'password', 'regNumber', 'universityId'],
  firm: ['companyName', 'contactPerson', 'email', 'password'],
  university: ['name', 'email', 'password', 'staffId'],
};

// Minimal email format guard. Keeps malformed addresses out before they touch
// the DB; the UNIQUE constraint on email/contact_email remains the authority.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password policy: at least 8 chars, one lowercase, one uppercase, one digit,
// one symbol (anything that isn't a letter or digit).
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/;

const normalizeEmail = (email) => String(email).trim().toLowerCase();

const passwordPolicyMessage =
  'Password must be at least 8 characters and include uppercase, lowercase, a number and a symbol.';

// POST /auth/register — create a student, firm, or university account
export const registerUser = async (req, res, next) => {
  const { email, password, role } = req.body || {};

  if (!email || !password || !role) {
    return res.status(400).json({ message: 'email, password and role are required.' });
  }
  if (!SELF_SERVE_ROLES.includes(role)) {
    return res.status(400).json({ message: `Unsupported role: ${role}` });
  }

  const normalizedEmail = normalizeEmail(email);
  if (!EMAIL_REGEX.test(normalizedEmail)) {
    return res.status(400).json({ message: 'Please provide a valid email address.' });
  }

  if (typeof password !== 'string' || !PASSWORD_REGEX.test(password)) {
    return res.status(400).json({ message: passwordPolicyMessage });
  }

  // Firms carry their legal name in companyName, not name.
  const normalized = {
    ...req.body,
    email: normalizedEmail,
    name: req.body.name || req.body.companyName
  };

  const missing = REQUIRED_FIELDS[role].filter(
    (field) => !String(normalized[field] ?? '').trim()
  );
  if (missing.length > 0) {
    return res.status(400).json({
      message: `Missing required ${missing.length === 1 ? 'field' : 'fields'}: ${missing.join(', ')}.`
    });
  }

  try {
    // Atomic registration: uniqueness is enforced by the DB UNIQUE constraint
    // inside a transaction. The pre-check below is a fast friendly path; the
    // authoritative guard is the re-check + insert inside the transaction.
    const existing = await findAccountByEmail(normalizedEmail);
    if (existing) {
      return res.status(400).json({ message: 'A profile with this email already exists.' });
    }

    const account = await transaction(async (client) => {
      // Re-check inside the transaction to guard against concurrent writes.
      const check = await client.query(
        `SELECT 1 FROM students WHERE email = $1
         UNION ALL SELECT 1 FROM firms WHERE contact_email = $1
         UNION ALL SELECT 1 FROM universities WHERE contact_email = $1
         UNION ALL SELECT 1 FROM admins WHERE email = $1 OR username = $1`,
        [normalizedEmail]
      );
      if (check.rows.length > 0) {
        const err = new Error('A profile with this email already exists.');
        err.status = 400;
        throw err;
      }
      return createAccount(normalized, client);
    });

    res.status(201).json({
      _id: account.id,
      name: account.name,
      email: account.email,
      role: account.role,
      token: generateToken(account.id, account.role)
    });
  } catch (error) {
    // Postgres unique_violation — a concurrent registration won the email.
    if (error.code === '23505') {
      return res.status(400).json({ message: 'A profile with this email already exists.' });
    }
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
