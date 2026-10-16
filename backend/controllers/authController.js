// controllers/authController.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import {
  findAccountByEmail,
  createAccount,
  isAccountLocked,
  recordFailedLogin,
  recordSuccessfulLogin,
  isAccountVerified,
  createVerificationToken,
  verifyEmailToken
} from '../data/accounts.js';
import { query, transaction } from '../data/db.js';

const generateToken = (id, role, passwordChangedAt) =>
  jwt.sign(
    { id, role, passwordChangedAt: passwordChangedAt ? passwordChangedAt.getTime() : 0 },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

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

// POST /auth/register — create a student, firm, or university account.
// Self-serve registrations start unverified; a verification token is issued
// instead of a full JWT. The account must be verified via POST /auth/verify-email
// before it can log in.
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

    // Issue an email verification token instead of a full JWT. The account
    // cannot log in until the email is verified.
    const verificationToken = await createVerificationToken(account.role, account.id);

    res.status(201).json({
      _id: account.id,
      name: account.name,
      email: account.email,
      role: account.role,
      email_verified: account.email_verified,
      verification_token: verificationToken,
      message: 'Account created. Please verify your email before logging in.'
    });
  } catch (error) {
    // Postgres unique_violation — a concurrent registration won the email.
    if (error.code === '23505') {
      return res.status(400).json({ message: 'A profile with this email already exists.' });
    }
    next(error);
  }
};

// POST /auth/verify-email — verify an account using the token issued at signup.
// body: { role, email, token }
export const verifyEmail = async (req, res, next) => {
  const { role, email, token } = req.body || {};

  if (!role || !email || !token) {
    return res.status(400).json({ message: 'role, email and token are required.' });
  }
  if (!SELF_SERVE_ROLES.includes(role)) {
    return res.status(400).json({ message: `Unsupported role: ${role}` });
  }

  try {
    const account = await findAccountByEmail(email);
    if (!account) {
      // Don't reveal whether the email exists.
      return res.status(400).json({ message: 'Invalid verification request.' });
    }

    const ok = await verifyEmailToken(account.role, account.id, token);
    if (!ok) {
      return res.status(400).json({ message: 'Invalid or expired verification token.' });
    }

    res.json({
      message: 'Email verified. You can now log in.',
      _id: account.id,
      email: account.email,
      role: account.role,
      email_verified: true
    });
  } catch (error) {
    next(error);
  }
};

// POST /auth/login — authenticate against any role table and issue a JWT.
// Unverified accounts are rejected.
export const loginUser = async (req, res, next) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required.' });
  }

  try {
    const account = await findAccountByEmail(email);

    // A locked account always fails with a generic message — we never reveal
    // whether the lockout or the password caused the rejection.
    if (account && await isAccountLocked(account.role, account.id)) {
      return res.status(401).json({ message: 'Invalid credentials provided.' });
    }

    // Unverified accounts cannot log in.
    if (account && !account.email_verified) {
      return res.status(403).json({
        message: 'Email not verified. Please verify your email before logging in.'
      });
    }

    if (account && (await bcrypt.compare(password || '', account.password_hash))) {
      await recordSuccessfulLogin(account.role, account.id);
      return res.json({
        _id: account.id,
        name: account.name,
        email: account.email,
        role: account.role,
        token: generateToken(account.id, account.role, account.password_changed_at)
      });
    }

    // Record the failed attempt (only when an account exists; a missing email
    // is treated the same way so we don't leak account existence).
    if (account) {
      await recordFailedLogin(account.role, account.id);
    }
    res.status(401).json({ message: 'Invalid credentials provided.' });
  } catch (error) {
    next(error);
  }
};
