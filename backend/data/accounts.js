// data/accounts.js
// -----------------------------------------------------------------------------
// Authentication spans four tables — admins, students, firms, universities —
// each of which can log in. These helpers present a unified "account" view.
// Admins authenticate by username; the others by email.
// -----------------------------------------------------------------------------
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query } from './db.js';

// Maps a role to its table. Used for admin password resets / deletes. Values are
// a fixed whitelist, never user input, so they are safe to interpolate.
export const ROLE_TABLES = {
  admin: 'admins',
  student: 'students',
  firm: 'firms',
  university: 'universities'
};

// Find an account by login identifier (admin username, or email for other roles).
export async function findAccountByEmail(identifier) {
  if (!identifier) return null;

  // Emails are matched case-insensitively; every writer stores them lowercased.
  identifier = String(identifier).trim().toLowerCase();
  if (!identifier) return null;

  const admin = (await query(
    'SELECT id, full_name AS name, email, password_hash, login_attempts, locked_until, password_changed_at, email_verified FROM admins WHERE username = $1 OR email = $1',
    [identifier]
  )).rows[0];
  if (admin) return { ...admin, role: 'admin' };

  const student = (await query(
    'SELECT id, full_name AS name, email, password_hash, login_attempts, locked_until, password_changed_at, email_verified FROM students WHERE email = $1',
    [identifier]
  )).rows[0];
  if (student) return { ...student, role: 'student' };

  const firm = (await query(
    'SELECT id, company_name AS name, contact_email AS email, password_hash, login_attempts, locked_until, password_changed_at, email_verified FROM firms WHERE contact_email = $1',
    [identifier]
  )).rows[0];
  if (firm) return { ...firm, role: 'firm' };

  const uni = (await query(
    'SELECT id, name, contact_email AS email, password_hash, login_attempts, locked_until, password_changed_at, email_verified FROM universities WHERE contact_email = $1',
    [identifier]
  )).rows[0];
  if (uni) return { ...uni, role: 'university' };

  return null;
}

// Find an account by id within a known role (used to rehydrate req.user from a JWT).
export async function findAccountById(role, id) {
  if (role === 'admin') {
    const row = (await query('SELECT id, full_name AS name, email, username, login_attempts, locked_until, password_changed_at, email_verified FROM admins WHERE id = $1', [id])).rows[0];
    return row ? { ...row, role } : null;
  }
  if (role === 'student') {
    const row = (await query('SELECT id, full_name AS name, email, login_attempts, locked_until, password_changed_at, email_verified FROM students WHERE id = $1', [id])).rows[0];
    return row ? { ...row, role } : null;
  }
  if (role === 'firm') {
    const row = (await query('SELECT id, company_name AS name, contact_email AS email, login_attempts, locked_until, password_changed_at, email_verified FROM firms WHERE id = $1', [id])).rows[0];
    return row ? { ...row, role } : null;
  }
  if (role === 'university') {
    const row = (await query('SELECT id, name, contact_email AS email, login_attempts, locked_until, password_changed_at, email_verified FROM universities WHERE id = $1', [id])).rows[0];
    return row ? { ...row, role } : null;
  }
  return null;
}

// Create an account in the table matching its role. Returns { id, name, email, role }.
// When `client` is supplied (from `data/db.js#transaction`) all writes run inside
// that transaction so registration is atomic.
export async function createAccount({ name, username, email, password, role, regNumber, companyName, contactPerson, industrySector, staffId, department, course, location, universityId }, client) {
  const run = (text, params) => (client ? client.query(text, params) : query(text, params));
  const hash = await bcrypt.hash(password, await bcrypt.genSalt(10));
  const loginEmail = String(email).trim().toLowerCase();

  if (role === 'admin') {
    // Admins are provisioned by another admin, so they start verified.
    const row = (await run(
      `INSERT INTO admins (username, email, password_hash, full_name, password_changed_at, email_verified)
       VALUES ($1, $2, $3, $4, NOW(), true) RETURNING id, password_changed_at, email_verified`,
      [username || loginEmail, loginEmail, hash, name || 'System Administrator']
    )).rows[0];
    return { id: row.id, name: name || username, email: loginEmail, role, password_changed_at: row.password_changed_at, email_verified: row.email_verified };
  }

  if (role === 'student') {
    // A student must explicitly choose a university; never fabricate a link to an
    // arbitrary one. The caller is responsible for validating universityId.
    const uniId = universityId;
    if (!uniId) {
      const err = new Error('A university is required to register a student account.');
      err.status = 400;
      throw err;
    }
    const row = (await run(
      `INSERT INTO students (full_name, email, password_hash, reg_number, course, university_id, password_changed_at, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), false) RETURNING id, password_changed_at, email_verified`,
      [name, loginEmail, hash, regNumber, course, uniId]
    )).rows[0];
    return { id: row.id, name, email: loginEmail, role, password_changed_at: row.password_changed_at, email_verified: row.email_verified };
  }

  if (role === 'firm') {
    const firmName = (companyName || name || '').trim();
    const row = (await run(
      `INSERT INTO firms (company_name, contact_email, password_hash, location, industry, contact_person, password_changed_at, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), false) RETURNING id, password_changed_at, email_verified`,
      [firmName, loginEmail, hash, location || 'Nairobi, KE', (industrySector || '').trim() || null, (contactPerson || '').trim() || null]
    )).rows[0];
    return { id: row.id, name: firmName, email: loginEmail, role, password_changed_at: row.password_changed_at, email_verified: row.email_verified };
  }

  if (role === 'university') {
    const row = (await run(
      `INSERT INTO universities (name, location, contact_email, password_hash, staff_id, department, password_changed_at, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), false) RETURNING id, password_changed_at, email_verified`,
      [
        name,
        location || 'Nairobi, KE',
        loginEmail,
        hash,
        (staffId || '').trim() || null,
        (department || '').trim() || null
      ]
    )).rows[0];
    return { id: row.id, name, email: loginEmail, role, password_changed_at: row.password_changed_at, email_verified: row.email_verified };
  }

  throw new Error(`Unknown role: ${role}`);
}

// Number of failed attempts before an account is locked.
export const LOGIN_LOCKOUT_THRESHOLD = 5;
// How long an account stays locked after reaching the threshold.
export const LOGIN_LOCKOUT_MINUTES = 5;

// Record a failed login attempt for an account. Increments login_attempts;
// when the threshold is reached, locks the account for LOGIN_LOCKOUT_MINUTES.
// Returns the new attempt count, or null if no row matched.
export async function recordFailedLogin(role, id) {
  const table = ROLE_TABLES[role];
  if (!table) throw new Error(`Unknown role: ${role}`);

  const row = (await query(
    `UPDATE ${table}
      SET login_attempts = login_attempts + 1
      WHERE id = $1
      RETURNING id, login_attempts`,
    [id]
  )).rows[0];
  if (!row) return null;

  if (row.login_attempts >= LOGIN_LOCKOUT_THRESHOLD) {
    await query(
      `UPDATE ${table} SET locked_until = NOW() + INTERVAL '${LOGIN_LOCKOUT_MINUTES} minutes' WHERE id = $1`,
      [id]
    );
  }
  return row.login_attempts;
}

// Record a successful login: reset attempts, clear lockout, set last_login_at.
// Returns true if a row was updated.
export async function recordSuccessfulLogin(role, id) {
  const table = ROLE_TABLES[role];
  if (!table) throw new Error(`Unknown role: ${role}`);

  const row = (await query(
    `UPDATE ${table}
      SET login_attempts = 0, locked_until = NULL, last_login_at = NOW()
      WHERE id = $1
      RETURNING id`,
    [id]
  )).rows[0];
  return !!row;
}

// Returns true if the account is currently locked (locked_until is in the future).
export async function isAccountLocked(role, id) {
  const table = ROLE_TABLES[role];
  if (!table) throw new Error(`Unknown role: ${role}`);

  const row = (await query(
    `SELECT locked_until FROM ${table} WHERE id = $1`,
    [id]
  )).rows[0];
  if (!row || !row.locked_until) return false;
  return new Date(row.locked_until) > new Date();
}

// Returns true if the account's email has been verified.
export async function isAccountVerified(role, id) {
  const table = ROLE_TABLES[role];
  if (!table) throw new Error(`Unknown role: ${role}`);

  const row = (await query(
    `SELECT email_verified FROM ${table} WHERE id = $1`,
    [id]
  )).rows[0];
  return !!row?.email_verified;
}

// Generate a cryptographically random verification token.
export function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Store a verification token + expiry for an account. Default expiry is 24 hours.
// Returns the token.
export async function createVerificationToken(role, id, ttlMs = 24 * 60 * 60 * 1000) {
  const table = ROLE_TABLES[role];
  if (!table) throw new Error(`Unknown role: ${role}`);

  const token = generateVerificationToken();
  const expiresAt = new Date(Date.now() + ttlMs);

  const row = (await query(
    `UPDATE ${table}
      SET verification_token = $1, verification_expires_at = $2
      WHERE id = $3
      RETURNING id`,
    [token, expiresAt, id]
  )).rows[0];
  if (!row) throw new Error(`No ${role} found with id ${id}.`);
  return token;
}

// Validate a verification token and mark the account as verified.
// Returns true if the token was valid and the account is now verified.
export async function verifyEmailToken(role, id, token) {
  const table = ROLE_TABLES[role];
  if (!table) throw new Error(`Unknown role: ${role}`);

  const row = (await query(
    `SELECT verification_token, verification_expires_at, email_verified
     FROM ${table} WHERE id = $1`,
    [id]
  )).rows[0];
  if (!row) return false;
  if (row.email_verified) return true; // already verified — idempotent
  if (!row.verification_token || row.verification_token !== token) return false;
  if (!row.verification_expires_at || new Date(row.verification_expires_at) < new Date()) return false;

  await query(
    `UPDATE ${table}
      SET email_verified = true, verification_token = NULL, verification_expires_at = NULL
      WHERE id = $1`,
    [id]
  );
  return true;
}

// Clear any verification token for an account (e.g. after admin provisioning).
export async function clearVerificationToken(role, id) {
  const table = ROLE_TABLES[role];
  if (!table) throw new Error(`Unknown role: ${role}`);

  await query(
    `UPDATE ${table}
      SET verification_token = NULL, verification_expires_at = NULL
      WHERE id = $1`,
    [id]
  );
}

// Overwrite the password hash for any account (admin-only operation).
export async function resetPassword(role, id, newPassword) {
  const table = ROLE_TABLES[role];
  if (!table) throw new Error(`Unknown role: ${role}`);

  const hash = await bcrypt.hash(newPassword, await bcrypt.genSalt(10));
  const row = (await query(
    `UPDATE ${table} SET password_hash = $1, password_changed_at = NOW() WHERE id = $2 RETURNING id`,
    [hash, id]
  )).rows[0];
  return !!row;
}

// Delete any account by role + id (admin-only operation).
export async function deleteAccount(role, id) {
  const table = ROLE_TABLES[role];
  if (!table) throw new Error(`Unknown role: ${role}`);

  const row = (await query(`DELETE FROM ${table} WHERE id = $1 RETURNING id`, [id])).rows[0];
  return !!row;
}

// List every account across all role tables (admin-only operation).
export async function listAllAccounts() {
  const admins = (await query('SELECT id, full_name AS name, email, username FROM admins ORDER BY id')).rows
    .map((r) => ({ ...r, role: 'admin' }));
  const students = (await query('SELECT id, full_name AS name, email, reg_number AS "regNumber" FROM students ORDER BY id')).rows
    .map((r) => ({ ...r, role: 'student' }));
  const firms = (await query('SELECT id, company_name AS name, contact_email AS email FROM firms ORDER BY id')).rows
    .map((r) => ({ ...r, role: 'firm' }));
  const universities = (await query('SELECT id, name, contact_email AS email FROM universities ORDER BY id')).rows
    .map((r) => ({ ...r, role: 'university' }));

  return [...admins, ...students, ...firms, ...universities];
}
