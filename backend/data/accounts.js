// data/accounts.js
// -----------------------------------------------------------------------------
// Authentication spans four tables — admins, students, firms, universities —
// each of which can log in. These helpers present a unified "account" view.
// Admins authenticate by username; the others by email.
// -----------------------------------------------------------------------------
import bcrypt from 'bcryptjs';
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

  const admin = (await query(
    'SELECT id, full_name AS name, email, password_hash FROM admins WHERE username = $1 OR email = $1',
    [identifier]
  )).rows[0];
  if (admin) return { ...admin, role: 'admin' };

  const student = (await query(
    'SELECT id, full_name AS name, email, password_hash FROM students WHERE email = $1',
    [identifier]
  )).rows[0];
  if (student) return { ...student, role: 'student' };

  const firm = (await query(
    'SELECT id, company_name AS name, contact_email AS email, password_hash FROM firms WHERE contact_email = $1',
    [identifier]
  )).rows[0];
  if (firm) return { ...firm, role: 'firm' };

  const uni = (await query(
    'SELECT id, name, contact_email AS email, password_hash FROM universities WHERE contact_email = $1',
    [identifier]
  )).rows[0];
  if (uni) return { ...uni, role: 'university' };

  return null;
}

// Find an account by id within a known role (used to rehydrate req.user from a JWT).
export async function findAccountById(role, id) {
  if (role === 'admin') {
    const row = (await query('SELECT id, full_name AS name, email, username FROM admins WHERE id = $1', [id])).rows[0];
    return row ? { ...row, role } : null;
  }
  if (role === 'student') {
    const row = (await query('SELECT id, full_name AS name, email FROM students WHERE id = $1', [id])).rows[0];
    return row ? { ...row, role } : null;
  }
  if (role === 'firm') {
    const row = (await query('SELECT id, company_name AS name, contact_email AS email FROM firms WHERE id = $1', [id])).rows[0];
    return row ? { ...row, role } : null;
  }
  if (role === 'university') {
    const row = (await query('SELECT id, name, contact_email AS email FROM universities WHERE id = $1', [id])).rows[0];
    return row ? { ...row, role } : null;
  }
  return null;
}

// Create an account in the table matching its role. Returns { id, name, email, role }.
export async function createAccount({ name, username, email, password, role, regNumber, companyName, course, location, universityId }) {
  const hash = await bcrypt.hash(password, await bcrypt.genSalt(10));

  if (role === 'admin') {
    const row = (await query(
      `INSERT INTO admins (username, email, password_hash, full_name)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [username || email, email || null, hash, name || 'System Administrator']
    )).rows[0];
    return { id: row.id, name: name || username, email, role };
  }

  if (role === 'student') {
    const uniId = universityId || (await query('SELECT id FROM universities ORDER BY id LIMIT 1')).rows[0]?.id;
    const row = (await query(
      `INSERT INTO students (full_name, email, password_hash, reg_number, course, university_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [name, email, hash, regNumber || `REG/${Date.now()}`, course || 'General', uniId]
    )).rows[0];
    return { id: row.id, name, email, role };
  }

  if (role === 'firm') {
    const row = (await query(
      `INSERT INTO firms (company_name, contact_email, password_hash, location)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [companyName || name, email, hash, location || 'Nairobi, KE']
    )).rows[0];
    return { id: row.id, name: companyName || name, email, role };
  }

  if (role === 'university') {
    const row = (await query(
      `INSERT INTO universities (name, location, contact_email, password_hash)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [name, location || 'Nairobi, KE', email, hash]
    )).rows[0];
    return { id: row.id, name, email, role };
  }

  throw new Error(`Unknown role: ${role}`);
}

// Overwrite the password hash for any account (admin-only operation).
export async function resetPassword(role, id, newPassword) {
  const table = ROLE_TABLES[role];
  if (!table) throw new Error(`Unknown role: ${role}`);

  const hash = await bcrypt.hash(newPassword, await bcrypt.genSalt(10));
  const row = (await query(
    `UPDATE ${table} SET password_hash = $1 WHERE id = $2 RETURNING id`,
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
