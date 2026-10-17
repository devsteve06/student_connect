// Unit tests for pure helpers and middleware. Run with: npm test (node --test).
import { test } from 'node:test';
import assert from 'node:assert/strict';

// The auth controllers sign JWTs with process.env.JWT_SECRET at call time, and
// CI has no .env to load. Set it before any test body runs.
process.env.JWT_SECRET ||= 'test-only-secret';

import { formatDate, todayISO } from '../utils/format.js';
import {
  slugifyName,
  normalizeDomain,
  isValidDomain,
  institutionDomainFromEmail,
  buildAccountEmail
} from '../utils/identity.js';
import { courseCode, formatRegNumber } from '../utils/regNumber.js';
import { authorizeRoles } from '../middleware/authMiddleware.js';
import { errorHandler, notFound } from '../middleware/errorMiddleware.js';

// --- Minimal Express res/req stubs ----------------------------------------
function mockRes() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

// --- utils/format ----------------------------------------------------------
test('formatDate handles YYYY-MM-DD strings tz-safely', () => {
  assert.equal(formatDate('2026-05-22'), 'May 22, 2026');
});

test('formatDate handles Date objects', () => {
  assert.equal(formatDate(new Date(Date.UTC(2026, 0, 5))), 'Jan 05, 2026');
});

test('formatDate returns null for null/undefined', () => {
  assert.equal(formatDate(null), null);
  assert.equal(formatDate(undefined), null);
});

test('todayISO returns a YYYY-MM-DD string', () => {
  assert.match(todayISO(), /^\d{4}-\d{2}-\d{2}$/);
});

// --- utils/identity --------------------------------------------------------
test('slugifyName folds a display name into a deterministic local part', () => {
  assert.equal(slugifyName('Alex Kamau'), 'alex.kamau');
  assert.equal(slugifyName('  Prof. Achieng Otieno '), 'prof.achieng.otieno');
  assert.equal(slugifyName('TechCorp   Solutions!!'), 'techcorp.solutions');
  assert.equal(slugifyName(''), 'user');
});

test('normalizeDomain tidies a pasted domain', () => {
  assert.equal(normalizeDomain(' https://Strathmore.EDU/ '), 'strathmore.edu');
  assert.equal(normalizeDomain('@jkuat.ac.ke'), 'jkuat.ac.ke');
  assert.equal(normalizeDomain('strathmore.edu.'), 'strathmore.edu');
});

test('isValidDomain rejects malformed domains', () => {
  assert.equal(isValidDomain('strathmore.edu'), true);
  assert.equal(isValidDomain('not-a-domain'), false);
  assert.equal(isValidDomain(''), false);
});

test('institutionDomainFromEmail recovers the domain from any role address', () => {
  assert.equal(institutionDomainFromEmail('registrar@strathmore.edu'), 'strathmore.edu');
  assert.equal(institutionDomainFromEmail('someone@registrar.strathmore.edu'), 'strathmore.edu');
  assert.equal(institutionDomainFromEmail('alex@students.strathmore.edu'), 'strathmore.edu');
});

test('buildAccountEmail applies the per-role subdomain', () => {
  const domain = 'strathmore.edu';
  assert.equal(
    buildAccountEmail({ role: 'student', name: 'Alex Kamau', domain }),
    'alex.kamau@students.strathmore.edu'
  );
  assert.equal(
    buildAccountEmail({ role: 'firm', name: 'Lumen Analytics', domain }),
    'lumen.analytics@hr.strathmore.edu'
  );
  assert.equal(
    buildAccountEmail({ role: 'university', name: 'Prof. Achieng Otieno', domain }),
    'prof.achieng.otieno@registrar.strathmore.edu'
  );
  assert.throws(() => buildAccountEmail({ role: 'admin', name: 'X', domain }), /No email identity rule/);
  assert.throws(() => buildAccountEmail({ role: 'student', name: 'X', domain: 'nope' }), /Invalid institution domain/);
});

// --- utils/regNumber --------------------------------------------------------
test('courseCode reduces a course title to uppercase initials', () => {
  // Degree prefixes and conjunctions are dropped so the seeded-style codes
  // come out regardless of how the course is titled.
  assert.equal(courseCode('BSc. in Computer Science'), 'CS');
  assert.equal(courseCode('B. in Business Information Technology'), 'BIT');
  assert.equal(courseCode('BSc. in Informatics and Computer Systems'), 'ICS');
  assert.equal(courseCode('Data Science'), 'DS');
  assert.equal(courseCode('Information Technology'), 'IT');
  // Nothing but fillers falls back to the full title's initials.
  assert.equal(courseCode('BSc'), 'B');
  assert.equal(courseCode(''), 'STU');
});

test('formatRegNumber pads the sequence to four digits', () => {
  assert.equal(formatRegNumber({ code: 'CS', seq: 1, year: 2026 }), 'CS/0001/2026');
  assert.equal(formatRegNumber({ code: 'BIT', seq: 4901, year: 2023 }), 'BIT/4901/2023');
});

// --- authorizeRoles --------------------------------------------------------
test('authorizeRoles allows a matching role', () => {
  const res = mockRes();
  let nexted = false;
  authorizeRoles('firm')({ user: { role: 'firm' } }, res, () => {
    nexted = true;
  });
  assert.equal(nexted, true);
});

test('authorizeRoles rejects a mismatched role with 403', () => {
  const res = mockRes();
  authorizeRoles('firm')({ user: { role: 'student' } }, res, () => {
    throw new Error('next should not be called');
  });
  assert.equal(res.statusCode, 403);
});

test('authorizeRoles rejects a missing user with 403', () => {
  const res = mockRes();
  authorizeRoles('admin')({}, res, () => {
    throw new Error('next should not be called');
  });
  assert.equal(res.statusCode, 403);
});

// --- errorHandler ----------------------------------------------------------
test('errorHandler defaults unknown errors to 500', () => {
  const res = mockRes();
  errorHandler(new Error('boom'), { method: 'GET', originalUrl: '/x' }, res, () => {});
  assert.equal(res.statusCode, 500);
});

test('errorHandler honours an explicit error status', () => {
  const res = mockRes();
  const err = Object.assign(new Error('bad input'), { status: 400 });
  errorHandler(err, { method: 'POST', originalUrl: '/x' }, res, () => {});
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, 'bad input');
});

test('errorHandler hides 5xx detail in production', () => {
  const prev = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  const res = mockRes();
  errorHandler(new Error('secret db detail'), { method: 'GET', originalUrl: '/x' }, res, () => {});
  process.env.NODE_ENV = prev;
  assert.equal(res.statusCode, 500);
  assert.equal(res.body.message, 'Internal server error.');
});

// --- notFound --------------------------------------------------------------
test('notFound responds with 404', () => {
  const res = mockRes();
  notFound({ method: 'GET', originalUrl: '/nope' }, res);
  assert.equal(res.statusCode, 404);
});

// --- student logbook endpoints (pg-mem integration) ------------------------
import { initDb, query } from '../data/db.js';
import { getMyLogbooks, upsertLogbook } from '../controllers/studentController.js';
import { getPendingLogbooks, signOffLogbook } from '../controllers/universityController.js';

// Boots the in-memory Postgres once, forcing pg-mem mode even if DATABASE_URL
// happens to be exported into the test runner's environment.
let dbPromise;
function ensureDb() {
  if (!dbPromise) {
    const snapshot = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    dbPromise = initDb().finally(() => {
      if (snapshot !== undefined) process.env.DATABASE_URL = snapshot;
    });
  }
  return dbPromise;
}

async function studentIdByEmail(email) {
  const row = (await query('SELECT id FROM students WHERE email = $1', [email])).rows[0];
  assert.ok(row, `seed student ${email} exists`);
  return row.id;
}

test('logbook: getMyLogbooks lists the student\'s weeks newest-first', async () => {
  await ensureDb();
  const id = await studentIdByEmail('alex.kamau@students.strathmore.edu');
  const res = mockRes();
  await getMyLogbooks({ user: { id } }, res, () => { throw new Error('next should not be called'); });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.length, 2);
  assert.equal(res.body[0].weekNumber, 2);
  assert.equal(res.body[0].firmStatus, 'Pending Review');
  assert.equal(res.body[0].facultyStatus, 'Not Started');
  assert.equal(res.body[0].companyName, 'TechCorp Solutions');
  assert.equal(res.body[1].weekNumber, 1);
  assert.equal(res.body[1].facultyStatus, 'Approved');
  assert.ok(res.body[0].weeklyReflection.length > 0);
});

test('logbook: upsert creates a new week with Pending Review status', async () => {
  await ensureDb();
  const id = await studentIdByEmail('jane.doe@students.jkuat.ac.ke');
  const res = mockRes();
  await upsertLogbook(
    { user: { id }, body: { weekNumber: 2, monday: 'Built a reporting widget.', weeklyReflection: 'Learned component-driven builds.' } },
    res,
    () => { throw new Error('next should not be called'); }
  );
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.firmStatus, 'Pending Review');
  assert.equal(res.body.facultyStatus, 'Not Started');
  await query('DELETE FROM logbooks WHERE student_id = $1 AND week_number = 2', [id]);
});

test('logbook: upsert resubmitting a Pending Review week keeps it Pending Review', async () => {
  await ensureDb();
  const id = await studentIdByEmail('alex.kamau@students.strathmore.edu');
  const res = mockRes();
  await upsertLogbook(
    { user: { id }, body: { weekNumber: 2, tuesday: 'Updated note.', weeklyReflection: 'Resubmitted after feedback.' } },
    res,
    () => { throw new Error('next should not be called'); }
  );
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.firmStatus, 'Pending Review');
});

test('logbook: upsert rejects non-positive or non-integer week numbers', async () => {
  await ensureDb();
  const id = await studentIdByEmail('jane.doe@students.jkuat.ac.ke');
  for (const weekNumber of [0, -1, 1.5, 'abc', undefined, null, '']) {
    const res = mockRes();
    await upsertLogbook(
      { user: { id }, body: { weekNumber, weeklyReflection: 'x' } },
      res,
      () => { throw new Error('next should not be called'); }
    );
    assert.equal(res.statusCode, 400, `weekNumber=${String(weekNumber)} should be rejected`);
  }
});

test('logbook: upsert requires a reflection and at least one daily note', async () => {
  await ensureDb();
  const id = await studentIdByEmail('jane.doe@students.jkuat.ac.ke');
  let res = mockRes();
  await upsertLogbook({ user: { id }, body: { weekNumber: 9, monday: 'Worked.' } }, res, () => {});
  assert.equal(res.statusCode, 400);

  res = mockRes();
  await upsertLogbook({ user: { id }, body: { weekNumber: 9, weeklyReflection: 'Reflection only.' } }, res, () => {});
  assert.equal(res.statusCode, 400);
});

test('logbook: upsert blocks edits to a faculty-approved week', async () => {
  await ensureDb();
  const id = await studentIdByEmail('alex.kamau@students.strathmore.edu'); // week 1 is faculty Approved
  const res = mockRes();
  await upsertLogbook(
    { user: { id }, body: { weekNumber: 1, monday: 'Trying to rewrite.', weeklyReflection: 'Locked week.' } },
    res,
    () => { throw new Error('next should not be called'); }
  );
  assert.equal(res.statusCode, 400);
});

test('logbook: student submit -> coordinator pending -> faculty approval round-trip', async () => {
  await ensureDb();
  const studentId = await studentIdByEmail('jane.doe@students.jkuat.ac.ke');
  const universityId = (await query('SELECT university_id FROM students WHERE id = $1', [studentId])).rows[0].university_id;

  let res = mockRes();
  await upsertLogbook(
    { user: { id: studentId }, body: { weekNumber: 2, wednesday: 'Demo the green path.', weeklyReflection: 'End-to-end verified.' } },
    res,
    () => { throw new Error('next should not be called'); }
  );
  assert.equal(res.statusCode, 201);
  const newId = res.body.id;

  res = mockRes();
  await getPendingLogbooks({ user: { id: universityId } }, res, () => {});
  assert.equal(res.statusCode, 200);
  assert.ok(res.body.some((l) => l.id === newId), 'coordinator pending list includes the new entry');

  res = mockRes();
  await signOffLogbook(
    { user: { id: universityId }, params: { id: String(newId) }, body: { facultySignOff: 'Approved' } },
    res,
    () => { throw new Error('next should not be called'); }
  );
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.facultySignOff, 'Approved');

  await query('DELETE FROM logbooks WHERE id = $1', [newId]);
});

// --- Phase 3: request tracing + migration runner ---------------------------
import { EventEmitter } from 'events';
import fs from 'fs';
import { requestContext } from '../middleware/requestContext.js';
import { runMigrations, migrationsDir } from '../data/migrations.js';
import { newDb } from 'pg-mem';

test('requestContext assigns a UUID request id', () => {
  const req = {};
  const res = new EventEmitter();
  requestContext(req, res, () => {});
  assert.match(req.id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
});

async function bootMigrationPool() {
  const mem = newDb();
  const { Pool } = mem.adapters.createPg();
  return new Pool();
}

test('migrations: build the full schema from scratch on an empty database', async () => {
  const pool = await bootMigrationPool();
  await runMigrations(pool);

  const tables = (
    await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
  ).rows
    .map((r) => r.table_name)
    .filter((t) => !t.startsWith('schema_migrations'));
  for (const t of ['admins', 'universities', 'firms', 'students', 'placements', 'applications', 'logbooks']) {
    assert.ok(tables.includes(t), `${t} created by 0001_init.sql`);
  }

  const cols = (
    await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'students'")
  ).rows.map((r) => r.column_name);
  assert.ok(cols.includes('phone'), 'students.phone column exists after migration');

  const applied = (await pool.query('SELECT name FROM schema_migrations')).rows.map((r) => r.name);
  assert.ok(applied.includes('0001_init.sql'), 'migration recorded in schema_migrations');
  await pool.end();
});

test('migrations: re-running is a no-op (idempotent)', async () => {
  const pool = await bootMigrationPool();
  const expected = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).length;
  await runMigrations(pool);
  await runMigrations(pool);
  const count = (await pool.query('SELECT count(*)::int AS c FROM schema_migrations')).rows[0].c;
  assert.equal(count, expected);
  await pool.end();
});

test('migrations: signup-only columns exist on firms and universities', async () => {
  const pool = await bootMigrationPool();
  await runMigrations(pool);

  const columnsFor = async (table) =>
    (await pool.query('SELECT column_name FROM information_schema.columns WHERE table_name = $1', [table]))
      .rows.map((r) => r.column_name);

  const firmCols = await columnsFor('firms');
  assert.ok(firmCols.includes('contact_person'), 'firms.contact_person exists after migration');
  assert.ok(firmCols.includes('industry'), 'firms.industry exists after migration');
  assert.ok(firmCols.includes('university_id'), 'firms.university_id exists after migration');

  const uniCols = await columnsFor('universities');
  assert.ok(uniCols.includes('staff_id'), 'universities.staff_id exists after migration');
  assert.ok(uniCols.includes('department'), 'universities.department exists after migration');

  await pool.end();
});

// --- auth: self-service registration ---------------------------------------
import { registerUser, loginUser, listUniversities } from '../controllers/authController.js';
import {
  getCvs,
  createCv,
  getCv,
  updateCv,
  deleteCv,
  setPrimaryCv,
  analyzeCv,
  getAnalyses
} from '../controllers/cvController.js';

async function register(payload) {
  const res = mockRes();
  await registerUser({ body: payload }, res, () => {
    throw new Error('next should not be called');
  });
  return res;
}

test('auth: the public institution list exposes id, name and a derived domain', async () => {
  await ensureDb();
  const res = mockRes();
  await listUniversities({}, res, () => {
    throw new Error('next should not be called');
  });
  assert.ok(Array.isArray(res.body));
  assert.ok(res.body.length >= 5, 'seed universities are listed');
  for (const uni of res.body) {
    assert.ok(Number.isInteger(uni.id));
    assert.ok(uni.name);
    // The registrar address strathmore.edu-style domain is extracted, and never
    // leaks the role subdomain.
    assert.match(uni.domain, /^[a-z0-9.-]+\.[a-z]+$/);
    assert.doesNotMatch(uni.domain, /^(registrar|students|hr)\./);
  }
  const strathmore = res.body.find((u) => u.domain === 'strathmore.edu');
  assert.ok(strathmore, 'Strathmore is present with its bare domain');
});

test('register: a firm account persists the contact person, industry and university', async () => {
  await ensureDb();
  const uniRow = (await query('SELECT id, contact_email FROM universities ORDER BY id LIMIT 1')).rows[0];
  assert.ok(uniRow, 'seed university exists');
  const domain = uniRow.contact_email.split('@')[1];
  const expectedEmail = `lumen.analytics@hr.${domain}`;

  const res = await register({
    companyName: 'Lumen Analytics',
    contactPerson: 'Grace Wanjiru',
    industrySector: 'Banking & financial services',
    universityId: uniRow.id,
    password: 'Passw0rd!',
    role: 'firm'
  });
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.role, 'firm');
  assert.equal(res.body.email, expectedEmail, 'email is derived from the name + university domain');

  // The form used to collect these two values and the API dropped them.
  const row = (
    await query('SELECT contact_person, industry, university_id FROM firms WHERE contact_email = $1', [
      expectedEmail
    ])
  ).rows[0];
  assert.ok(row, 'firm row exists under the derived email');
  assert.equal(row.contact_person, 'Grace Wanjiru');
  assert.equal(row.industry, 'Banking & financial services');
  assert.equal(row.university_id, uniRow.id, 'firm is affiliated with the chosen university');

  await query('DELETE FROM firms WHERE contact_email = $1', [expectedEmail]);
});

test('register: a university account represents the institution, not a staff member', async () => {
  await ensureDb();
  const res = await register({
    name: 'Nairobi Institute of Technology',
    domain: 'tuk.ac.ke',
    password: 'Passw0rd!',
    role: 'university'
  });
  assert.equal(res.statusCode, 201);
  // The institution name drives both the row and the derived registrar address.
  assert.equal(res.body.email, 'nairobi.institute.of.technology@registrar.tuk.ac.ke');

  const row = (
    await query('SELECT name, staff_id, department FROM universities WHERE contact_email = $1', [
      'nairobi.institute.of.technology@registrar.tuk.ac.ke'
    ])
  ).rows[0];
  assert.ok(row);
  assert.equal(row.name, 'Nairobi Institute of Technology');
  // No staff identity is stored on the institution account.
  assert.equal(row.staff_id, null);
  assert.equal(row.department, null);

  await query('DELETE FROM universities WHERE contact_email = $1', [
    'nairobi.institute.of.technology@registrar.tuk.ac.ke'
  ]);
});

test('register: exactly one university account per institution domain', async () => {
  await ensureDb();
  const first = await register({
    name: 'University of Eldoret',
    domain: 'uoe.ac.ke',
    password: 'Passw0rd!',
    role: 'university'
  });
  assert.equal(first.statusCode, 201);

  // A differently-named signup on the same domain is refused: students belong
  // to one university, so the institution gets a single row.
  const second = await register({
    name: 'Eldoret Technical University',
    domain: 'uoe.ac.ke',
    password: 'Passw0rd!',
    role: 'university'
  });
  assert.equal(second.statusCode, 409);
  assert.match(second.body.message, /already registered for uoe\.ac\.ke/);

  // A role label pasted in front of the domain counts as the same domain.
  const third = await register({
    name: 'UoE Postgrad School',
    domain: 'registrar.uoe.ac.ke',
    password: 'Passw0rd!',
    role: 'university'
  });
  assert.equal(third.statusCode, 409);

  await query('DELETE FROM universities WHERE contact_email = $1', [
    'university.of.eldoret@registrar.uoe.ac.ke'
  ]);
});

test('register: rejects a university account without a domain', async () => {
  await ensureDb();
  const res = await register({
    name: 'Prof. No Domain',
    staffId: 'ST-0001',
    password: 'Passw0rd!',
    role: 'university'
  });
  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /domain/i);
});

test('register: a student account derives its email and persists the reg number and course', async () => {
  await ensureDb();
  const uniRow = (await query('SELECT id, contact_email FROM universities ORDER BY id LIMIT 1')).rows[0];
  assert.ok(uniRow, 'seed university exists');
  const expectedEmail = 'brian.mutua@students.strathmore.edu';

  const res = await register({
    name: 'Brian Mutua',
    regNumber: 'BBIT/9001/2026',
    course: 'BSc. in Computer Science',
    universityId: uniRow.id,
    password: 'Passw0rd!',
    role: 'student'
  });
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.email, expectedEmail);

  const row = (
    await query('SELECT reg_number, course FROM students WHERE email = $1', [expectedEmail])
  ).rows[0];
  assert.ok(row);
  assert.equal(row.reg_number, 'BBIT/9001/2026');
  assert.equal(row.course, 'BSc. in Computer Science');

  await query('DELETE FROM students WHERE email = $1', [expectedEmail]);
});

test('register: a student must choose a university', async () => {
  await ensureDb();
  const res = await register({
    name: 'Unattached Student',
    regNumber: 'BBIT/0000/2026',
    course: 'BSc. in Computer Science',
    password: 'Passw0rd!',
    role: 'student'
  });
  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /university/i);
});

test('register: ignores a client-supplied email and uses the institutional one', async () => {
  await ensureDb();
  const uniRow = (await query('SELECT id, contact_email FROM universities ORDER BY id LIMIT 1')).rows[0];
  const res = await register({
    name: 'Sneaky Student',
    regNumber: 'BBIT/7777/2026',
    course: 'BSc. in Computer Science',
    universityId: uniRow.id,
    // A caller cannot smuggle in an arbitrary address — it is overwritten.
    email: 'sneaky@evil.example.com',
    password: 'Passw0rd!',
    role: 'student'
  });
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.email, 'sneaky.student@students.strathmore.edu');
  await query('DELETE FROM students WHERE email = $1', ['sneaky.student@students.strathmore.edu']);
});

test('register: rejects an admin self-signup', async () => {
  await ensureDb();
  const res = await register({
    name: 'Rogue Admin',
    email: 'rogue@example.com',
    password: 'Passw0rd!',
    role: 'admin'
  });
  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /Unsupported role: admin/);
});

test('register: rejects a firm that omits its contact person', async () => {
  await ensureDb();
  const res = await register({
    companyName: 'Half Formed Ltd',
    industrySector: 'Technology & software',
    email: 'nobody@halfformed.co.ke',
    password: 'Passw0rd!',
    role: 'firm'
  });
  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /contactPerson/);

  const row = (await query('SELECT id FROM firms WHERE contact_email = $1', ['nobody@halfformed.co.ke']))
    .rows[0];
  assert.equal(row, undefined, 'nothing is written when validation fails');
});

test('register: rejects a duplicate derived email', async () => {
  await ensureDb();
  const uniRow = (await query('SELECT id FROM universities ORDER BY id LIMIT 1')).rows[0];
  assert.ok(uniRow, 'seed university exists');
  // "Alex Kamau" at Strathmore derives the same address as the seeded student.
  const res = await register({
    name: 'Alex Kamau',
    regNumber: 'BBIT/1111/2020',
    course: 'BSc. in Computer Science',
    universityId: uniRow.id,
    password: 'Passw0rd!',
    role: 'student'
  });
  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /already exists/);
});

test('register: a student without a reg number gets one assigned by the server', async () => {
  await ensureDb();
  const uniRow = (await query('SELECT id, contact_email FROM universities ORDER BY id LIMIT 1')).rows[0];
  assert.ok(uniRow, 'seed university exists');

  const first = await register({
    name: 'Amina Hassan',
    course: 'BSc. in Computer Science',
    universityId: uniRow.id,
    password: 'Passw0rd!',
    role: 'student'
  });
  assert.equal(first.statusCode, 201);
  // Course code drops the degree words, then a 4-digit sequence and the year.
  assert.match(first.body.regNumber, /^CS\/\d{4}\/\d{4}$/, 'signup response carries the assigned number');
  assert.equal(first.body.email, 'amina.hassan@students.strathmore.edu');

  const row = (
    await query('SELECT reg_number, course FROM students WHERE email = $1', [
      'amina.hassan@students.strathmore.edu'
    ])
  ).rows[0];
  assert.equal(row.reg_number, first.body.regNumber);
  assert.equal(row.course, 'BSc. in Computer Science');

  // The next student on the same course, university and year increments the
  // sequence rather than colliding.
  const second = await register({
    name: 'Brian Kiprotich',
    course: 'BSc. in Computer Science',
    universityId: uniRow.id,
    password: 'Passw0rd!',
    role: 'student'
  });
  assert.equal(second.statusCode, 201);
  const seqOf = (regNumber) => Number.parseInt(String(regNumber).split('/')[1], 10);
  assert.equal(seqOf(second.body.regNumber), seqOf(first.body.regNumber) + 1);

  await query('DELETE FROM students WHERE email IN ($1, $2)', [
    'amina.hassan@students.strathmore.edu',
    'brian.kiprotich@students.strathmore.edu'
  ]);
});

test('register: a student signup requires a course', async () => {
  await ensureDb();
  const uniRow = (await query('SELECT id FROM universities ORDER BY id LIMIT 1')).rows[0];
  const res = await register({
    name: 'Courseless Student',
    universityId: uniRow.id,
    password: 'Passw0rd!',
    role: 'student'
  });
  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /course/);
});

test('login: works immediately after registering, and finds the email case-insensitively', async () => {
  await ensureDb();
  const uniRow = (await query('SELECT id, contact_email FROM universities ORDER BY id LIMIT 1')).rows[0];
  const domain = uniRow.contact_email.split('@')[1];
  const email = `tidewater.labs@hr.${domain}`;
  await register({
    companyName: 'Tidewater Labs',
    contactPerson: 'Peter Muriuki',
    industrySector: 'Technology & software',
    universityId: uniRow.id,
    password: 'Passw0rd!',
    role: 'firm'
  });

  const res = mockRes();
  await loginUser({ body: { email: email.toUpperCase(), password: 'Passw0rd!' } }, res, () => {});
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.role, 'firm');
  assert.ok(res.body.token);

  await query('DELETE FROM firms WHERE contact_email = $1', [email]);
});

// --- CV builder (Phase 1 — backend CRUD) -------------------------------------
// The endpoints sit behind the student guard; req.user is injected by the
// middleware, so the tests pass the student id straight through it.

async function studentCvId(res) {
  return res.body.id;
}

// student_cvs references students(id), so the tests insert under a real,
// seeded student — any other id would violate the foreign key.
let ACTIVE_STUDENT_ID;
async function ensureStudentId() {
  if (!ACTIVE_STUDENT_ID) {
    ACTIVE_STUDENT_ID = (
      await query('SELECT id FROM students ORDER BY id LIMIT 1')
    ).rows[0].id;
  }
  return ACTIVE_STUDENT_ID;
}

test('cv: create lists a new CV as the primary and returns its shape', async () => {
  await ensureDb();
  const STUDENT_ID = await ensureStudentId();
  const uniRow = (await query('SELECT id FROM universities LIMIT 1')).rows[0];
  assert.ok(uniRow, 'seed university exists');
  const res = mockRes();
  await createCv(
    {
      user: { id: STUDENT_ID },
      body: {
        title: 'BSc. Computer Science CV',
        professionalSummary: 'A motivated student.',
        skills: { category: 'Languages' },
        education: { school: 'Strathmore University' }
      }
    },
    res,
    () => { throw new Error('next should not be called'); }
  );
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.studentId, STUDENT_ID);
  assert.equal(res.body.title, 'BSc. Computer Science CV');
  assert.equal(res.body.isPrimary, true, 'first CV becomes the primary');
  assert.deepEqual(res.body.skills, { category: 'Languages' });
  await query('DELETE FROM student_cvs WHERE student_id = $1', [STUDENT_ID]);
});

test('cv: create a second CV demotes the previous primary', async () => {
  await ensureDb();
  const STUDENT_ID = await ensureStudentId();
  const uniRow = (await query('SELECT id FROM universities LIMIT 1')).rows[0];
  assert.ok(uniRow, 'seed university exists');

  // Seed the student's first CV directly, exactly as createCv would.
  await query(
    `INSERT INTO student_cvs (student_id, title, is_primary)
     VALUES ($1, 'First CV', $2)`,
    [STUDENT_ID, true]
  );

  const res = mockRes();
  await createCv(
    {
      user: { id: STUDENT_ID },
      body: { title: 'Second CV' }
    },
    res,
    () => { throw new Error('next should not be called'); }
  );
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.isPrimary, false, 'new CV is not primary');
  await query('DELETE FROM student_cvs WHERE student_id = $1', [STUDENT_ID]);
});

test('cv: get returns one CV scoped to the student', async () => {
  await ensureDb();
  const STUDENT_ID = await ensureStudentId();
  const uniRow = (await query('SELECT id FROM universities LIMIT 1')).rows[0];
  assert.ok(uniRow, 'seed university exists');
  const inserted = (
    await query(
      `INSERT INTO student_cvs (student_id, title, is_primary, professional_summary)
       VALUES ($1, 'Scoped CV', $2, 'Summary.') RETURNING id, student_id, title, is_primary, personal_info, professional_summary, education, experience, skills, projects, certifications, created_at, updated_at`,
      [STUDENT_ID, true]
    )
  ).rows[0];

  const found = mockRes();
  await getCv({ params: { id: String(inserted.id) }, user: { id: STUDENT_ID } }, found, () => {});
  assert.equal(found.statusCode, 200);
  assert.equal(found.body.id, inserted.id);
  assert.equal(found.body.professionalSummary, 'Summary.');

  const foreign = mockRes();
  await getCv({ params: { id: String(inserted.id) }, user: { id: 9999 } }, foreign, () => {});
  assert.equal(foreign.statusCode, 404);

  await query('DELETE FROM student_cvs WHERE student_id = $1', [STUDENT_ID]);
});

test('cv: update patches the stored CV', async () => {
  await ensureDb();
  const STUDENT_ID = await ensureStudentId();
  const inserted = (
    await query(
      `INSERT INTO student_cvs (student_id, title, is_primary, skills)
       VALUES ($1, 'To be updated', $2, $3) RETURNING id, student_id, title, is_primary, personal_info, professional_summary, education, experience, skills, projects, certifications, created_at, updated_at`,
      [STUDENT_ID, false, { category: 'Languages' }]
    )
  ).rows[0];

  const res = mockRes();
  await updateCv(
    {
      params: { id: String(inserted.id) },
      body: { skills: { category: 'Cloud' }, professionalSummary: 'Rewritten.' },
      user: { id: STUDENT_ID }
    },
    res,
    () => { throw new Error('next should not be called'); }
  );
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.title, 'To be updated');
  assert.equal(res.body.professionalSummary, 'Rewritten.');
  assert.deepEqual(res.body.skills, { category: 'Cloud' });

  await query('DELETE FROM student_cvs WHERE student_id = $1', [STUDENT_ID]);
});

test('cv: delete removes the CV', async () => {
  await ensureDb();
  const STUDENT_ID = await ensureStudentId();
  const inserted = (
    await query('INSERT INTO student_cvs (student_id, title) VALUES ($1, $2) RETURNING id, student_id, title, is_primary, personal_info, professional_summary, education, experience, skills, projects, certifications, created_at, updated_at', [
      STUDENT_ID,
      'Deletable'
    ])
  ).rows[0];

  const res = mockRes();
  await deleteCv({ params: { id: String(inserted.id) }, user: { id: STUDENT_ID } }, res, () => {});
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.message, 'CV deleted.');

  const gone = mockRes();
  await deleteCv({ params: { id: String(inserted.id) }, user: { id: STUDENT_ID } }, gone, () => {});
  assert.equal(gone.statusCode, 404);

  await query('DELETE FROM student_cvs WHERE student_id = $1', [STUDENT_ID]);
});

test('cv: set primary demotes the current primary and promotes the target', async () => {
  await ensureDb();
  const STUDENT_ID = await ensureStudentId();
  const first = (
    await query(
      'INSERT INTO student_cvs (student_id, title, is_primary) VALUES ($1, $2, $3) RETURNING id, student_id, title, is_primary, personal_info, professional_summary, education, experience, skills, projects, certifications, created_at, updated_at',
      [STUDENT_ID, 'First CV', true]
    )
  ).rows[0];
  const second = (
    await query(
      'INSERT INTO student_cvs (student_id, title, is_primary) VALUES ($1, $2, $3) RETURNING id, student_id, title, is_primary, personal_info, professional_summary, education, experience, skills, projects, certifications, created_at, updated_at',
      [STUDENT_ID, 'Second CV', false]
    )
  ).rows[0];

  const res = mockRes();
  await setPrimaryCv(
    { params: { id: String(second.id) }, user: { id: STUDENT_ID } },
    res,
    () => { throw new Error('next should not be called'); }
  );
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.isPrimary, true);
  assert.equal(res.body.id, second.id);

  const current = (
    await query('SELECT is_primary FROM student_cvs WHERE id = $1', [first.id])
  ).rows[0];
  assert.equal(current.is_primary, false, 'previous primary is demoted');

  // Only one primary may exist; promoting again onto itself is fine, but the
  // controller must never end up with two primary CVs.
  await query('DELETE FROM student_cvs WHERE student_id = $1', [STUDENT_ID]);
});

// --- CV job analyzer (Phase 4) ----------------------------------------------
test('cv: analyze against a pasted job description scores keyword overlap', async () => {
  await ensureDb();
  const STUDENT_ID = await ensureStudentId();

  const cv = (
    await query(
      `INSERT INTO student_cvs (student_id, title, is_primary, professional_summary, skills)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, student_id, title, is_primary, personal_info, professional_summary, education, experience, skills, projects, certifications, created_at, updated_at`,
      [
        STUDENT_ID,
        'Software Engineer CV',
        true,
        'JavaScript developer with React and Node.js experience building web applications.',
        JSON.stringify([{ category: 'Languages', items: ['JavaScript', 'React', 'Node.js'] }])
      ]
    )
  ).rows[0];

  const res = mockRes();
  await analyzeCv(
    {
      user: { id: STUDENT_ID },
      body: {
        cvId: cv.id,
        jobTitle: 'React Developer',
        jobDescription: 'We need React, Node.js, and JavaScript experience for frontend work.'
      }
    },
    res,
    () => { throw new Error('next should not be called'); }
  );
  assert.equal(res.statusCode, 201);
  assert.ok(res.body.matchScore > 0, 'match score should be positive');
  assert.ok(Array.isArray(res.body.keywordMatch.matched));
  assert.ok(Array.isArray(res.body.keywordMatch.missing));
  assert.ok(typeof res.body.gapAnalysis === 'string');
  assert.ok(typeof res.body.sectionScores === 'object');

  await query('DELETE FROM cv_analyses WHERE student_id = $1', [STUDENT_ID]);
  await query('DELETE FROM student_cvs WHERE student_id = $1', [STUDENT_ID]);
});

test('cv: analyze against a placement pulls the job from the placements table', async () => {
  await ensureDb();
  const STUDENT_ID = await ensureStudentId();

  const placement = (
    await query('SELECT id, role, description FROM placements LIMIT 1')
  ).rows[0];
  assert.ok(placement, 'seed placement exists');

  const cv = (
    await query(
      `INSERT INTO student_cvs (student_id, title, is_primary, professional_summary)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [STUDENT_ID, 'Test CV', true, 'React and Node.js developer.']
    )
  ).rows[0];

  const res = mockRes();
  await analyzeCv(
    { user: { id: STUDENT_ID }, body: { cvId: cv.id, placementId: placement.id } },
    res,
    () => { throw new Error('next should not be called'); }
  );
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.jobTitle, placement.role);
  assert.equal(res.body.placementId, placement.id);

  await query('DELETE FROM cv_analyses WHERE student_id = $1', [STUDENT_ID]);
  await query('DELETE FROM student_cvs WHERE student_id = $1', [STUDENT_ID]);
});

test('cv: analyze rejects a missing job title and description', async () => {
  await ensureDb();
  const STUDENT_ID = await ensureStudentId();

  const res = mockRes();
  await analyzeCv(
    { user: { id: STUDENT_ID }, body: {} },
    res,
    () => { throw new Error('next should not be called'); }
  );
  assert.equal(res.statusCode, 400);
  assert.ok(res.body.message.includes('required'));
});

test('cv: analyze returns 404 for a CV the student does not own', async () => {
  await ensureDb();
  const STUDENT_ID = await ensureStudentId();

  const res = mockRes();
  await analyzeCv(
    { user: { id: STUDENT_ID }, body: { cvId: 99999, jobTitle: 'Developer' } },
    res,
    () => { throw new Error('next should not be called'); }
  );
  assert.equal(res.statusCode, 404);
});

test('cv: analyze returns 400 when the student has no CV', async () => {
  await ensureDb();
  const STUDENT_ID = await ensureStudentId();

  const res = mockRes();
  await analyzeCv(
    { user: { id: STUDENT_ID }, body: { jobTitle: 'Developer' } },
    res,
    () => { throw new Error('next should not be called'); }
  );
  assert.equal(res.statusCode, 400);
});

test('cv: get analyses lists past runs newest first', async () => {
  await ensureDb();
  const STUDENT_ID = await ensureStudentId();

  const cv = (
    await query(
      `INSERT INTO student_cvs (student_id, title, is_primary, professional_summary)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [STUDENT_ID, 'Analysis CV', true, 'React developer.']
    )
  ).rows[0];

  await analyzeCv(
    { user: { id: STUDENT_ID }, body: { cvId: cv.id, jobTitle: 'React Developer', jobDescription: 'React and Node.js.' } },
    mockRes(),
    () => {}
  );

  const res = mockRes();
  await getAnalyses(
    { user: { id: STUDENT_ID } },
    res,
    () => { throw new Error('next should not be called'); }
  );
  assert.equal(res.statusCode, 200);
  assert.ok(Array.isArray(res.body));
  assert.ok(res.body.length >= 1);
  assert.equal(res.body[0].studentId, STUDENT_ID);

  await query('DELETE FROM cv_analyses WHERE student_id = $1', [STUDENT_ID]);
  await query('DELETE FROM student_cvs WHERE student_id = $1', [STUDENT_ID]);
});
