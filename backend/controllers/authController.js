// controllers/authController.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { findAccountByEmail, createAccount } from '../data/accounts.js';
import { query, transaction } from '../data/db.js';
import {
  buildAccountEmail,
  institutionDomainFromEmail,
  isValidDomain,
  normalizeDomain
} from '../utils/identity.js';

const generateToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// Roles that may create their own account through the public signup form.
// Admins are deliberately excluded — they are provisioned by another admin.
const SELF_SERVE_ROLES = ['student', 'firm', 'university'];

// Fields the signup forms collect per role, beyond the password. The email is
// NOT here: it is derived from the display name + the institution's domain (see
// utils/identity.js) so a caller can never submit an address outside the
// student/firm/university subdomain rules. The student reg number is NOT here
// either: it is assigned by the server (see utils/regNumber.js).
const REQUIRED_FIELDS = {
  student: ['name', 'course'],
  firm: ['companyName', 'contactPerson'],
  // A university account represents the institution itself (one row per
  // institution — students have a many-to-one relationship with it), so only
  // the institution name is collected. No staff identity is stored.
  university: ['name']
};

// Password policy: at least 8 chars, one lowercase, one uppercase, one digit,
// one symbol (anything that isn't a letter or digit).
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/;

const normalizeEmail = (email) => String(email).trim().toLowerCase();

// One row per institution. A university account owns exactly one email domain
// (the one its registrar address sits on), so a second signup for the same
// domain is rejected however the address is styled: registrar@uoe.ac.ke and
// someone@registrar.uoe.ac.ke both resolve to uoe.ac.ke.
async function universityExistsOnDomain(run, domain) {
  // Accepts either the pool-level `query` function or a transaction client.
  const exec = typeof run === 'function' ? run : (text, params) => run.query(text, params);
  const rows = (await exec('SELECT contact_email FROM universities')).rows;
  return rows.some((row) => institutionDomainFromEmail(row.contact_email) === domain);
}

// A unique_violation naming students.reg_number is a generated-number race
// (two students on the same course signing up at the same moment), not a
// duplicate profile — the caller retries with the next number.
const REG_NUMBER_CONFLICT_RE = /students_reg_number_key|reg_number/i;

const REGISTRATION_ATTEMPTS = 3;

const passwordPolicyMessage =
  'Password must be at least 8 characters and include uppercase, lowercase, a number and a symbol.';

// GET /auth/universities — the institution list backing the signup dropdowns.
// Public on purpose: the student/firm signup forms need it before they have a
// token. Only the fields the picker needs are exposed.
export const listUniversities = async (_req, res, next) => {
  try {
    const rows = (await query('SELECT id, name, contact_email FROM universities ORDER BY name')).rows;
    res.json(
      rows.map((r) => ({
        id: r.id,
        name: r.name,
        domain: institutionDomainFromEmail(r.contact_email)
      }))
    );
  } catch (error) {
    next(error);
  }
};

// POST /auth/register — create a student, firm, or university account
export const registerUser = async (req, res, next) => {
  const { password, role } = req.body || {};

  if (!password || !role) {
    return res.status(400).json({ message: 'password and role are required.' });
  }
  if (!SELF_SERVE_ROLES.includes(role)) {
    return res.status(400).json({ message: `Unsupported role: ${role}` });
  }

  if (typeof password !== 'string' || !PASSWORD_REGEX.test(password)) {
    return res.status(400).json({ message: passwordPolicyMessage });
  }

  // Firms carry their legal name in companyName, not name.
  const body = { ...req.body, name: req.body.name || req.body.companyName };

  const missing = REQUIRED_FIELDS[role].filter(
    (field) => !String(body[field] ?? '').trim()
  );
  if (missing.length > 0) {
    return res.status(400).json({
      message: `Missing required ${missing.length === 1 ? 'field' : 'fields'}: ${missing.join(', ')}.`
    });
  }

  try {
    // Resolve the institution domain: from the chosen university (student and
    // firm link to one) or straight from the form (a university defines its own).
    let domain;
    let universityId = null;

    if (role === 'university') {
      // Round-trip through the email helper so a role label pasted in front of
      // the domain ("registrar.uoe.ac.ke") collapses to the bare institution
      // domain ("uoe.ac.ke").
      domain = institutionDomainFromEmail(`registrar@${normalizeDomain(req.body.domain)}`);
      if (!domain || !isValidDomain(domain)) {
        return res.status(400).json({
          message: 'A valid university email domain is required (e.g. strathmore.edu).'
        });
      }
      // Students belong to exactly one university, so an institution gets one
      // account (one row) owning its domain — a second signup for the same
      // domain is refused regardless of the name used.
      if (await universityExistsOnDomain(query, domain)) {
        return res.status(409).json({
          message: `A university is already registered for ${domain}.`
        });
      }
    } else {
      universityId = Number.parseInt(req.body.universityId, 10);
      if (!Number.isInteger(universityId)) {
        return res.status(400).json({
          message:
            role === 'student'
              ? 'A university is required to register a student account.'
              : 'A university is required to register a firm account.'
        });
      }
      const university = (
        await query('SELECT id, contact_email FROM universities WHERE id = $1', [universityId])
      ).rows[0];
      if (!university) {
        return res.status(400).json({ message: 'The selected university could not be found.' });
      }
      domain = institutionDomainFromEmail(university.contact_email);
      if (!domain || !isValidDomain(domain)) {
        return res.status(400).json({
          message: 'That university has no valid email domain on file.'
        });
      }
    }

    const normalizedEmail = normalizeEmail(buildAccountEmail({ role, name: body.name, domain }));

    // Atomic registration: uniqueness is enforced by the DB UNIQUE constraint
    // inside a transaction. The pre-check below is a fast friendly path; the
    // authoritative guard is the re-check + insert inside the transaction.
    const existing = await findAccountByEmail(normalizedEmail);
    if (existing) {
      return res.status(400).json({ message: 'A profile with this email already exists.' });
    }

    const normalized = {
      ...body,
      email: normalizedEmail,
      name: body.name,
      universityId: role === 'university' ? undefined : universityId
    };

    // Student signups let the server assign the reg number, which reads the
    // current maximum inside the same transaction as the insert. Two students
    // on the same course racing can still pick the same number — the UNIQUE
    // constraint catches it and we retry with the next one.
    let account;
    for (let attempt = 1; attempt <= REGISTRATION_ATTEMPTS; attempt += 1) {
      try {
        account = await transaction(async (client) => {
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
          if (role === 'university' && (await universityExistsOnDomain(client, domain))) {
            const err = new Error(`A university is already registered for ${domain}.`);
            err.status = 409;
            throw err;
          }
          return createAccount(normalized, client);
        });
        break;
      } catch (error) {
        const regNumberRace =
          error.code === '23505' && REG_NUMBER_CONFLICT_RE.test(error.message || '');
        if (!regNumberRace || attempt === REGISTRATION_ATTEMPTS) throw error;
      }
    }

    res.status(201).json({
      _id: account.id,
      name: account.name,
      email: account.email,
      role: account.role,
      // Students get their server-assigned admission number back so the signup
      // confirmation can show it.
      ...(account.regNumber ? { regNumber: account.regNumber } : {}),
      token: generateToken(account.id, account.role)
    });
  } catch (error) {
    // Postgres unique_violation — either a concurrent registration won the
    // email, or a generated reg number raced (which the loop above retries).
    if (error.code === '23505') {
      if (REG_NUMBER_CONFLICT_RE.test(error.message || '')) {
        return res.status(409).json({
          message: 'We could not assign a registration number just now. Please try again.'
        });
      }
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
