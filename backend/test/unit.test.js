// Unit tests for pure helpers and middleware. Run with: npm test (node --test).
import { test } from 'node:test';
import assert from 'node:assert/strict';

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
