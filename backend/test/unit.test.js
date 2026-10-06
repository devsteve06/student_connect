// Unit tests for pure helpers and middleware. Run with: npm test (node --test).
import { test } from 'node:test';
import assert from 'node:assert/strict';

// The auth controllers sign JWTs with process.env.JWT_SECRET at call time, and
// CI has no .env to load. Set it before any test body runs.
process.env.JWT_SECRET ||= 'test-only-secret';

import { formatDate, todayISO } from '../utils/format.js';
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

  const uniCols = await columnsFor('universities');
  assert.ok(uniCols.includes('staff_id'), 'universities.staff_id exists after migration');
  assert.ok(uniCols.includes('department'), 'universities.department exists after migration');

  await pool.end();
});

// --- auth: self-service registration ---------------------------------------
import { registerUser, loginUser } from '../controllers/authController.js';

async function register(payload) {
  const res = mockRes();
  await registerUser({ body: payload }, res, () => {
    throw new Error('next should not be called');
  });
  return res;
}

test('register: a firm account persists the contact person and industry', async () => {
  await ensureDb();
  const res = await register({
    companyName: 'Lumen Analytics',
    contactPerson: 'Grace Wanjiru',
    industrySector: 'Banking & financial services',
    email: 'Grace@Lumen-Analytics.co.ke',
    password: 'password123',
    role: 'firm'
  });
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.role, 'firm');

  // The form used to collect these two values and the API dropped them.
  const row = (
    await query('SELECT contact_person, industry FROM firms WHERE contact_email = $1', [
      'grace@lumen-analytics.co.ke'
    ])
  ).rows[0];
  assert.ok(row, 'firm row exists under the normalised email');
  assert.equal(row.contact_person, 'Grace Wanjiru');
  assert.equal(row.industry, 'Banking & financial services');

  await query('DELETE FROM firms WHERE contact_email = $1', ['grace@lumen-analytics.co.ke']);
});

test('register: a university account persists the staff id and department', async () => {
  await ensureDb();
  const res = await register({
    name: 'Prof. Achieng Otieno',
    staffId: 'ST-7781',
    department: 'School of Engineering',
    email: 'a.otieno@tuk.ac.ke',
    password: 'password123',
    role: 'university'
  });
  assert.equal(res.statusCode, 201);

  const row = (
    await query('SELECT staff_id, department FROM universities WHERE contact_email = $1', [
      'a.otieno@tuk.ac.ke'
    ])
  ).rows[0];
  assert.ok(row);
  assert.equal(row.staff_id, 'ST-7781');
  assert.equal(row.department, 'School of Engineering');

  await query('DELETE FROM universities WHERE contact_email = $1', ['a.otieno@tuk.ac.ke']);
});

test('register: a student account persists the reg number and course', async () => {
  await ensureDb();
  const res = await register({
    name: 'Brian Mutua',
    regNumber: 'BBIT/9001/2026',
    course: 'BSc. in Computer Science',
    email: 'brian.mutua@students.strathmore.edu',
    password: 'password123',
    role: 'student'
  });
  assert.equal(res.statusCode, 201);

  const row = (
    await query('SELECT reg_number, course FROM students WHERE email = $1', [
      'brian.mutua@students.strathmore.edu'
    ])
  ).rows[0];
  assert.ok(row);
  assert.equal(row.reg_number, 'BBIT/9001/2026');
  assert.equal(row.course, 'BSc. in Computer Science');

  await query('DELETE FROM students WHERE email = $1', ['brian.mutua@students.strathmore.edu']);
});

test('register: rejects an admin self-signup', async () => {
  await ensureDb();
  const res = await register({
    name: 'Rogue Admin',
    email: 'rogue@example.com',
    password: 'password123',
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
    password: 'password123',
    role: 'firm'
  });
  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /contactPerson/);

  const row = (await query('SELECT id FROM firms WHERE contact_email = $1', ['nobody@halfformed.co.ke']))
    .rows[0];
  assert.equal(row, undefined, 'nothing is written when validation fails');
});

test('register: rejects a duplicate email regardless of casing', async () => {
  await ensureDb();
  const res = await register({
    name: 'Alex Kamau',
    regNumber: 'BBIT/1111/2020',
    email: 'ALEX.KAMAU@students.strathmore.edu',
    password: 'password123',
    role: 'student'
  });
  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /already exists/);
});

test('login: works immediately after registering, and finds the email case-insensitively', async () => {
  await ensureDb();
  await register({
    companyName: 'Tidewater Labs',
    contactPerson: 'Peter Muriuki',
    industrySector: 'Technology & software',
    email: 'peter@tidewater.co.ke',
    password: 'password123',
    role: 'firm'
  });

  const res = mockRes();
  await loginUser({ body: { email: 'PETER@Tidewater.co.ke', password: 'password123' } }, res, () => {});
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.role, 'firm');
  assert.ok(res.body.token);

  await query('DELETE FROM firms WHERE contact_email = $1', ['peter@tidewater.co.ke']);
});
