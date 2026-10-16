# Plan: Backend Registration & Login Logic

## Context (current state read from repo)

- `backend/controllers/authController.js` — `registerUser`, `loginUser` using `data/accounts.js`.
- `backend/data/accounts.js` — `findAccountByEmail`, `findAccountById`, `createAccount`, `resetPassword`, `deleteAccount`, `listAllAccounts`.
- `backend/middleware/authMiddleware.js` — `protect`, `authorizeRoles`.
- `backend/routes/authRoutes.js` — IP-based rate limits (register 10/hr, login 20/15min).
- `backend/server.js` — Express 5, JWT_SECRET fail-fast, CORS, `/api/v1` mount.
- Schema: `admins`, `students`, `firms`, `universities` each have `email`/`contact_email` UNIQUE + `password_hash`.
- Migrations live in `backend/db/migrations/` (0001, 0002) and are idempotent; `sql/schema.sql` + `sql/seed.sql` seed pg-mem dev.
- Tests: `backend/test/unit.test.js` (29 tests), run via `npm test`.
- AGENTS.md three-place rule: any new column goes in `db/migrations/NNNN_*.sql`, `sql/schema.sql`, and `0001_init.sql` (mirror).

---

## Identified flaws (to fix)

### Security
1. Non-atomic email uniqueness check (find then insert) → concurrent duplicate registrations both pass; second raises Postgres unique-violation surfacing as 500.
2. No password strength policy.
3. No email format validation.
4. No per-account brute-force lockout (IP-only rate limiting).
5. Tokens survive password changes (payload only `{ id, role }`, no `password_changed_at` binding).
6. No email verification (accounts active immediately).

### Correctness / data integrity
7. Student auto-assigned to arbitrary university when `universityId` missing.
8. Fake `regNumber` fallback (`REG/${Date.now()}`) despite regNumber being required.
9. No `last_login_at` audit trail.

### API / UX
10. Registration auto-issues a JWT (will become gated on email verification in Phase 4).
11. `protect` can't distinguish expired vs invalid tokens (generic 401 — desired).
12. Rate-limit responses lack `Retry-After`.

---

## Design decisions (approved)

| Decision | Value |
|----------|-------|
| Registration flow target | Email verification first (implemented in Phase 4, deferred) |
| Phases 1–3 behavior | Registration auto-issues JWT; email verification added later |
| Password policy | All of the above: min length + uppercase + digit + symbol |
| Password min length | 8 characters |
| Lockout threshold | 5 failed attempts |
| Lockout duration | 5 minutes |
| Lockout storage | Columns on each role table (matches existing pattern): `login_attempts`, `locked_until`, `last_login_at` |
| Token binding | `password_changed_at` in JWT payload; `protect` rejects tokens issued before a password change |
| Token expiry distinction | Generic 401 to end users; distinct message logged/available to admin for diagnosis |
| Phase 4 (email verification) | Deferred until Phases 1–3 complete |

---

## Phase plan

### Phase 1 — Validation hardening + atomic registration (COMPLETE — committed as c53da0a to origin/main)
Files: `backend/controllers/authController.js`, `backend/data/accounts.js`, `backend/data/db.js`, `backend/routes/authRoutes.js`, `backend/test/unit.test.js`
- Email format validation.
- Password strength validation (min 8, uppercase, digit, symbol).
- Registration wrapped in a DB transaction; pre-check kept as fast friendly path, Postgres unique violation (code `23505`) caught → 400 "email already exists" (never 500).
- Rate-limit responses include `Retry-After`.
- No email verification yet (Phase 4).
- `data/db.js` `transaction()` helper added (usable by both pg and pg-mem).
- Students require explicit `universityId`; fake `regNumber` fallback removed.

### Phase 2 — Per-account lockout + login audit (COMPLETE — committed as e4d4417 to feat/auth-lockout, pushed to origin, PR pending)
Files: `backend/data/accounts.js`, `backend/controllers/authController.js`, new migration `0003_auth_hardening.sql`
- Added `login_attempts`, `locked_until`, `last_login_at` to `admins`, `students`, `firms`, `universities`
- On failed login: increment attempts; at 5 failures set `locked_until = now + 5 min`; return generic 401
- On successful login: reset attempts, clear `locked_until`, set `last_login_at`
- Login rejects locked accounts with generic 401
- Added helpers: `recordFailedLogin`, `recordSuccessfulLogin`, `isAccountLocked`, `LOGIN_LOCKOUT_THRESHOLD`, `LOGIN_LOCKOUT_MINUTES`
- Added 3 lockout integration tests

### Phase 3 — Token binding to password version (COMPLETE — committed as b5c3da2 to feat/auth-token-binding, pushed to origin, PR pending)
Files: `backend/data/accounts.js`, `backend/controllers/authController.js`, `backend/middleware/authMiddleware.js`, migration `0004_auth_token_binding.sql`
- Added `password_changed_at TIMESTAMPTZ` to each role table (set on registration and password change)
- JWT payload includes `passwordChangedAt`; `protect` rejects tokens issued before a password rotation with generic 401
- Server logs distinct reason (expired / invalid / rotated) for admin diagnosis; client sees generic 401
- Added token-binding integration tests

### Phase 4 — Email verification (COMPLETE — committed as d8828d4 to feat/auth-email-verification, pushed to origin, PR pending)
Files: new migration `0005_email_verification.sql`, `backend/data/accounts.js`, `backend/controllers/authController.js`, `backend/routes/authRoutes.js`, `backend/middleware/authMiddleware.js`
- Added `email_verified`, `verification_token`, `verification_expires_at` to each role table
- Admins start verified; self-serve roles (student, firm, university) start unverified
- Registration issues verification_token instead of full JWT; account can't log in until verified
- POST /auth/verify-email validates token and marks account verified
- Login rejects unverified accounts with 403; protect() rejects unverified accounts with 403
- Helpers: isAccountVerified, generateVerificationToken, createVerificationToken, verifyEmailToken, clearVerificationToken
- Added 5 email verification integration tests

### Phase 5 — Tests (COMPLETE — committed as f201caa to feat/auth-email-verification)
Files: `backend/test/unit.test.js`
- Concurrent duplicate email creates exactly one account (no 500) ✅
- Weak passwords rejected with 400 ✅
- Invalid email addresses rejected with 400 ✅
- Register success ✅
- Duplicate email (any casing) → 400, single row ✅
- Lockout after 5 failures ✅
- Token invalidated after password change ✅
- Admin self-register → 400 ✅

Total: 42/42 tests passing

---

## Three-place rule for any new column
Mirror into: `backend/db/migrations/0003_auth_hardening.sql`, `backend/sql/schema.sql`, `backend/db/migrations/0001_init.sql` (idempotent `ADD COLUMN IF NOT EXISTS`).
