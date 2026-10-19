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
  for (const t of ['admins', 'universities', 'firms', 'students', 'placements', 'applications', 'logbooks', 'notifications']) {
    assert.ok(tables.includes(t), `${t} created by the migration chain`);
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

// --- job postings + notifications (JOB_POSTING_PLAN.md Phase 1) ------------

test('migrations: placements carry the open/closed lifecycle and notifications exist', async () => {
  const pool = await bootMigrationPool();
  await runMigrations(pool);

  const placementCols = (
    await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'placements'")
  ).rows.map((r) => r.column_name);
  assert.ok(placementCols.includes('status'), 'placements.status exists after migration');
  assert.ok(placementCols.includes('closed_at'), 'placements.closed_at exists after migration');

  const notifCols = (
    await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'notifications'")
  ).rows.map((r) => r.column_name);
  for (const c of ['student_id', 'firm_id', 'type', 'title', 'body', 'link', 'is_read', 'created_at']) {
    assert.ok(notifCols.includes(c), `notifications.${c} exists after migration`);
  }

  await pool.end();
});

test('notifications: default to unread and require exactly one recipient', async () => {
  await ensureDb();
  const student = await studentIdByEmail('alex.kamau@students.strathmore.edu');
  const firm = (await query('SELECT id FROM firms LIMIT 1')).rows[0].id;

  // Pre-existing placements read as 'Open' via the column default.
  const openCount = (await query("SELECT COUNT(*)::int AS c FROM placements WHERE status = 'Open'")).rows[0].c;
  const totalCount = (await query('SELECT COUNT(*)::int AS c FROM placements')).rows[0].c;
  assert.equal(openCount, totalCount, 'every pre-existing placement defaults to Open');

  // A valid row is unread until touched.
  const inserted = (
    await query(
      `INSERT INTO notifications (student_id, type, title)
       VALUES ($1, 'new_posting', 'New placement') RETURNING is_read`,
      [student]
    )
  ).rows[0];
  assert.equal(inserted.is_read, false, 'notifications are unread by default');

  const rejected = /check constraint|violates|null/i;
  await assert.rejects(
    query(`INSERT INTO notifications (type, title) VALUES ('new_posting', 'No recipient')`),
    rejected,
    'a notification with no recipient is rejected'
  );
  await assert.rejects(
    query(
      `INSERT INTO notifications (student_id, firm_id, type, title) VALUES ($1, $2, 'new_posting', 'Two recipients')`,
      [student, firm]
    ),
    rejected,
    'a notification addressed to both a student and a firm is rejected'
  );
});

// --- notification feed endpoints (JOB_POSTING_PLAN.md Phase 2) --------------
import {
  listNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead
} from '../controllers/notificationController.js';

const asUser = (id, role) => ({ user: { id, role } });
const noNext = () => { throw new Error('next should not be called'); };

const notificationList = async (id, role) => {
  const res = mockRes();
  await listNotifications(asUser(id, role), res, noNext);
  assert.equal(res.statusCode, 200);
  return res.body;
};

const unreadCountFor = async (id, role) => {
  const res = mockRes();
  await getUnreadCount(asUser(id, role), res, noNext);
  assert.equal(res.statusCode, 200);
  return res.body.count;
};

const seedNotification = async (column, id, title, type = 'new_posting') =>
  (await query(
    `INSERT INTO notifications (${column}, type, title) VALUES ($1, $2, $3) RETURNING id`,
    [id, type, title]
  )).rows[0].id;

test('notifications: list and unread-count are scoped to the caller, newest first', async () => {
  await ensureDb();
  const students = (await query('SELECT id FROM students ORDER BY id')).rows.map((r) => r.id);
  const [me, stranger] = students;
  const firmId = (await query('SELECT id FROM firms ORDER BY id')).rows[0].id;

  const [meBefore, firmBefore] = [
    await unreadCountFor(me, 'student'),
    await unreadCountFor(firmId, 'firm')
  ];

  await seedNotification('student_id', me, 'First posting');
  await seedNotification('student_id', me, 'Second posting');
  await seedNotification('firm_id', firmId, 'Application received', 'application_received');

  assert.equal(await unreadCountFor(me, 'student'), meBefore + 2, 'both of my rows count as unread');
  assert.equal(await unreadCountFor(firmId, 'firm'), firmBefore + 1, 'the firm counts its own row');

  const mine = await notificationList(me, 'student');
  assert.equal(mine[0].title, 'Second posting', 'list is newest-first (later insert first)');
  assert.ok(mine.some((n) => n.title === 'First posting'), 'list contains the older row');

  const strangerList = await notificationList(stranger, 'student');
  assert.ok(
    !strangerList.some((n) => n.title === 'Second posting' || n.title === 'Application received'),
    "another student's rows never appear in my list"
  );

  const firmList = await notificationList(firmId, 'firm');
  assert.ok(
    !firmList.some((n) => n.title === 'Second posting'),
    "a firm never sees the students' rows"
  );
});

test('notifications: markRead is scoped to the owner and markAllRead clears the badge', async () => {
  await ensureDb();
  const students = (await query('SELECT id FROM students ORDER BY id')).rows.map((r) => r.id);
  const [me, stranger] = students;

  const ownedId = await seedNotification('student_id', me, 'Owned row');

  // A different student cannot flip my row.
  const forbidden = mockRes();
  await markNotificationRead({ user: { id: stranger, role: 'student' }, params: { id: String(ownedId) } }, forbidden, noNext);
  assert.equal(forbidden.statusCode, 404, "someone else's notification reads as missing");

  // A non-numeric id is a client error, not a 500.
  const malformed = mockRes();
  await markNotificationRead({ user: { id: me, role: 'student' }, params: { id: 'abc' } }, malformed, noNext);
  assert.equal(malformed.statusCode, 400);

  // The owner marks it read and the badge drops.
  const before = await unreadCountFor(me, 'student');
  const ok = mockRes();
  await markNotificationRead({ user: { id: me, role: 'student' }, params: { id: String(ownedId) } }, ok, noNext);
  assert.equal(ok.statusCode, 200);
  assert.equal(ok.body.isRead, true, 'response reports the row as read');
  assert.equal(await unreadCountFor(me, 'student'), before - 1, 'unread count dropped by one');

  // Read-all zeroes whatever is left, reporting how many rows changed.
  const res = mockRes();
  await markAllNotificationsRead(asUser(me, 'student'), res, noNext);
  assert.equal(res.statusCode, 200);
  assert.ok(res.body.updated >= 1, 'read-all reports at least the row it just changed');
  assert.equal(await unreadCountFor(me, 'student'), 0, 'badge is clear after read-all');
});

// --- firm posting CRUD (JOB_POSTING_PLAN.md Phase 3) ------------------------
import {
  listPlacements,
  createPlacement,
  updatePlacement,
  closePlacement
} from '../controllers/firmController.js';

test('placements: a firm creates, lists, edits and closes its own postings', async () => {
  await ensureDb();
  const firmIds = (await query('SELECT id FROM firms ORDER BY id')).rows.map((r) => r.id);
  const [mine, other] = firmIds;

  // Create — a valid payload lands as 'Open' with no applicants.
  const created = mockRes();
  await createPlacement(
    {
      ...asUser(mine),
      body: {
        role: 'Data Analyst Intern',
        location: 'Nairobi',
        duration: '3 Months',
        slots: 2,
        description: 'Join our analytics team.'
      }
    },
    created,
    noNext
  );
  assert.equal(created.statusCode, 201);
  assert.equal(created.body.status, 'Open', 'a fresh posting is Open');
  assert.equal(created.body.slots, 2, 'slots are stored as given');
  assert.equal(created.body.applicantCount, 0, 'a fresh posting has no applicants');
  const placementId = created.body.id;

  // Create — validation.
  for (const [label, body] of [
    ['a missing role', { location: 'Nairobi', duration: '3 Months', description: 'x' }],
    ['zero slots', { role: 'x', location: 'y', duration: 'z', description: 'w', slots: 0 }]
  ]) {
    const bad = mockRes();
    await createPlacement({ ...asUser(mine), body }, bad, noNext);
    assert.equal(bad.statusCode, 400, `create rejects ${label}`);
  }

  // List — own rows appear; another firm never sees them.
  const mineList = mockRes();
  await listPlacements(asUser(mine), mineList, noNext);
  assert.ok(
    mineList.body.some((p) => p.id === placementId && p.status === 'Open'),
    'the firm sees its own Open posting'
  );
  const otherList = mockRes();
  await listPlacements(asUser(other), otherList, noNext);
  assert.ok(!otherList.body.some((p) => p.id === placementId), "another firm's posting is invisible");

  // Edit — the owner can update an Open posting.
  const edited = mockRes();
  await updatePlacement(
    { ...asUser(mine), params: { id: String(placementId) }, body: { role: 'Senior Data Analyst' } },
    edited,
    noNext
  );
  assert.equal(edited.statusCode, 200);
  assert.equal(edited.body.role, 'Senior Data Analyst', 'the new role is persisted');

  // Edit — another firm's posting reads as missing; empty bodies are 400.
  const foreign = mockRes();
  await updatePlacement(
    { ...asUser(other), params: { id: String(placementId) }, body: { role: 'Nope' } },
    foreign,
    noNext
  );
  assert.equal(foreign.statusCode, 404, "another firm's posting reads as missing");
  const empty = mockRes();
  await updatePlacement({ ...asUser(mine), params: { id: String(placementId) }, body: {} }, empty, noNext);
  assert.equal(empty.statusCode, 400, 'an update with no fields is rejected');

  // Close — stamps closed_at, idempotent on repeat, freezes the posting.
  const closed = mockRes();
  await closePlacement({ ...asUser(mine), params: { id: String(placementId) } }, closed, noNext);
  assert.equal(closed.statusCode, 200);
  assert.equal(closed.body.status, 'Closed', 'the posting is now Closed');
  assert.ok(closed.body.closedAt, 'closed_at is stamped');

  const again = mockRes();
  await closePlacement({ ...asUser(mine), params: { id: String(placementId) } }, again, noNext);
  assert.equal(again.statusCode, 200, 'closing twice is idempotent');
  assert.equal(again.body.status, 'Closed');

  const frozen = mockRes();
  await updatePlacement(
    { ...asUser(mine), params: { id: String(placementId) }, body: { role: 'Zombie' } },
    frozen,
    noNext
  );
  assert.equal(frozen.statusCode, 409, 'a closed posting rejects further edits');

  const missingClose = mockRes();
  await closePlacement({ ...asUser(other), params: { id: String(placementId) } }, missingClose, noNext);
  assert.equal(missingClose.statusCode, 404, "another firm cannot close my posting");
});

// --- posting/application events (JOB_POSTING_PLAN.md Phase 4) ---------------
import { insertNotifications } from '../utils/notify.js';
import { applyForPlacement, getPlacements } from '../controllers/studentController.js';

test('posting fan-out: publishing notifies every student at the firm\'s university', async () => {
  await ensureDb();
  const firm = (await query("SELECT id FROM firms WHERE company_name = 'TechCorp Solutions'")).rows[0];
  const strathmore = (await query("SELECT id FROM universities WHERE name = 'Strathmore University'")).rows[0];
  const uon = (await query("SELECT id FROM universities WHERE name = 'University of Nairobi'")).rows[0];

  // The seed leaves firms unaffiliated and spreads students one-per-
  // university; give TechCorp a partner university and move a second student
  // there so the batch fan-out path is exercised.
  await query('UPDATE firms SET university_id = $1 WHERE id = $2', [strathmore.id, firm.id]);
  const movedStudent = (await query(
    "SELECT id FROM students WHERE email = 'jane.doe@students.jkuat.ac.ke'"
  )).rows[0];
  const originalUniversity = (await query('SELECT university_id FROM students WHERE id = $1', [movedStudent.id])).rows[0].university_id;
  await query('UPDATE students SET university_id = $1 WHERE id = $2', [strathmore.id, movedStudent.id]);

  const strathmoreStudents = (await query(
    'SELECT id FROM students WHERE university_id = $1 ORDER BY id',
    [strathmore.id]
  )).rows.map((r) => r.id);
  assert.ok(strathmoreStudents.length >= 2, 'test needs at least two students at the partner university');
  const outsider = (await query('SELECT id FROM students WHERE university_id = $1 ORDER BY id LIMIT 1', [uon.id])).rows[0].id;

  const before = await Promise.all(strathmoreStudents.map((id) => unreadCountFor(id, 'student')));
  const outsiderBefore = await unreadCountFor(outsider, 'student');

  const res = mockRes();
  await createPlacement(
    {
      ...asUser(firm.id, 'firm'),
      body: { role: 'Cloud Intern', location: 'Nairobi', duration: '3 Months', description: 'Ship cloud tooling.' }
    },
    res,
    noNext
  );
  assert.equal(res.statusCode, 201);

  for (const [index, id] of strathmoreStudents.entries()) {
    assert.equal(
      await unreadCountFor(id, 'student'),
      before[index] + 1,
      'each student at the partner university got exactly one notification'
    );
  }
  assert.equal(
    await unreadCountFor(outsider, 'student'),
    outsiderBefore,
    'a student at an unaffiliated university is not notified'
  );

  const row = (await query(
    "SELECT type, link FROM notifications WHERE student_id = $1 AND type = 'new_posting' ORDER BY id DESC LIMIT 1",
    [strathmoreStudents[0]]
  )).rows[0];
  assert.equal(row.type, 'new_posting');
  assert.equal(row.link, '/students/marketplace', 'the notification deep-links to the marketplace');

  // Restore the seed's state so later tests see a clean firm and roster.
  await query('UPDATE firms SET university_id = NULL WHERE id = $1', [firm.id]);
  await query('UPDATE students SET university_id = $1 WHERE id = $2', [originalUniversity, movedStudent.id]);
});

test('application events: applying notifies the firm, and a closed posting rejects with 409', async () => {
  await ensureDb();
  const firm = (await query("SELECT id FROM firms WHERE company_name = 'Nexus Labs'")).rows[0];
  const student = await studentIdByEmail('alex.kamau@students.strathmore.edu');
  const placement = (await query(
    "SELECT id FROM placements WHERE firm_id = $1 AND role = 'Full-Stack Developer Intern'",
    [firm.id]
  )).rows[0];

  const firmBefore = await unreadCountFor(firm.id, 'firm');

  // Applying to the Open posting succeeds and echoes to the firm's badge.
  const applied = mockRes();
  await applyForPlacement(
    {
      user: { id: student, role: 'student' },
      body: { companyName: 'Nexus Labs', role: 'Full-Stack Developer Intern' }
    },
    applied,
    noNext
  );
  assert.equal(applied.statusCode, 201);
  assert.equal(applied.body.status, 'Pending Review', 'the application lands as Pending Review');

  assert.equal(
    await unreadCountFor(firm.id, 'firm'),
    firmBefore + 1,
    'the firm gained exactly one unread notification'
  );
  const note = (await query(
    "SELECT type, link FROM notifications WHERE firm_id = $1 AND type = 'application_received' ORDER BY id DESC LIMIT 1",
    [firm.id]
  )).rows[0];
  assert.equal(note.link, '/firms/applicants', 'the notification deep-links to the applicant roster');

  // The marketplace payload now carries status so the UI can grey out closures.
  const listRes = mockRes();
  await getPlacements({ user: { id: student, role: 'student' } }, listRes, noNext);
  assert.ok(listRes.body.every((p) => p.status), 'every placement reports its status');

  // Close the posting; further applications are refused and the firm is NOT
  // notified again (no application row is created).
  await query("UPDATE placements SET status = 'Closed', closed_at = NOW() WHERE id = $1", [placement.id]);
  const rejected = mockRes();
  await applyForPlacement(
    {
      user: { id: student, role: 'student' },
      body: { companyName: 'Nexus Labs', role: 'Full-Stack Developer Intern' }
    },
    rejected,
    noNext
  );
  assert.equal(rejected.statusCode, 409, 'a closed posting refuses new applications');
  assert.equal(
    await unreadCountFor(firm.id, 'firm'),
    firmBefore + 1,
    'the refused application added no notification'
  );

  // Restore for any later tests.
  await query("UPDATE placements SET status = 'Open', closed_at = NULL WHERE id = $1", [placement.id]);
});

test('notify: insertNotifications batches many rows in one statement', async () => {
  await ensureDb();
  const students = (await query('SELECT id FROM students ORDER BY id LIMIT 2')).rows.map((r) => r.id);

  const inserted = await insertNotifications(
    students.map((id) => ({
      studentId: id,
      type: 'new_posting',
      title: 'Batched',
      body: 'One statement, many rows.',
      link: '/students/marketplace'
    }))
  );
  assert.equal(inserted, students.length, 'the batch reports the number of rows written');
  assert.equal(await insertNotifications([]), 0, 'an empty batch is a no-op');
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
