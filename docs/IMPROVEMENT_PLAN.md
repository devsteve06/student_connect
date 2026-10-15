# Student Connect — MVP Roadmap

**Status:** Active. Phases 1–3 and Phase 5 are code-complete; **the only substantive work left is Phase 4's live deploy** (plus committing Phase 4 and merging Phase 5, which are currently uncommitted/unmerged — see "Where things stand"). Changelog of completed work lives in `docs/PROGRESS.md`; commands + architecture quirks live in `AGENTS.md`.

**Goal:** Take the repo from "core loop works, logbook is fake, unshipped" to a **defensible, demoable MVP** deployed with a real URL.

**Current state (verified 2026-10-02):**
- Real API: auth (all 4 portals), student marketplace + profile + logbook, firm dashboard/applicants, admin CRUD, university sign-off + audits ledger (`PATCH /university/logbooks/:id`). All against live Supabase.
- Phases 1–3 shipped. Phase 5 (signup hardening) shipped but **sits on the unmerged branch `feat/registration-flow`** — see "Where things stand" below.
- Phase 4 is written but **uncommitted**, so CI does not run yet and nothing is deployed.

**Standing pre-req:** was a manual `ALTER TABLE students ADD COLUMN IF NOT EXISTS phone VARCHAR(20);` in the Supabase SQL Editor. Since Phase 3, the migration runner applies `db/migrations/0001_init.sql` automatically on boot against real PostgreSQL (`npm run db:migrate` too), so the `phone` column self-heals — no manual step needed. `0002_signup_fields.sql` (Phase 5) follows the same pattern for `firms.contact_person`, `universities.staff_id` and `universities.department`. Every migration is idempotent, so re-running is a no-op and a live database picks them up on the next deploy.

## Where things stand (2026-10-02)

| Work | State |
|---|---|
| Phases 1–3 (mocks, polish, ops) | committed on `main` |
| Phase 4 (deploy config, CI, runbook) | **uncommitted** in the working tree — CI therefore does not run |
| Phase 5 (signup hardening) | committed on `feat/registration-flow`, **no PR opened**, not on `main` |
| Live deploy | not started — no Supabase project, Render service or Vercel project exists |

---

## Phase 1 — Kill the mocks (highest value)

1. **Wire remaining mock dashboards to existing endpoints**
   - `StudentDashboard` → `studentService.getMetrics()` + `getApplications()` (endpoints exist).
   - `UniversityDashboard` → `universityService.getCoordinatorMetrics()` + `getPendingLogbooks()` + `signOffLogbook()` (endpoints exist).
   - `UniversityAudits` → decide: implement a minimal auditable endpoint, or de-scope with a labeled placeholder.
2. **Student logbook backend** (only half exists today: university sign-off is real, submit/list is not)
   - Add `getMyLogbooks` + `upsertLogbook` (submit/update by `week_number`; table has `UNIQUE(student_id, week_number)`; submit sets `firm_sign_off = 'Pending Review'`) to `studentController.js` + `studentRoutes.js`.
   - Wire `StudentLogBook` view (form uses the existing `monday..friday` + `weekly_reflection` columns).
   - Verify loop end-to-end: student submits → coordinator sees it under `Pending` → `PATCH /university/logbooks/:id` approves.
3. **Tests**: extend `backend/test/unit.test.js` for new validation (week number, sign-off transitions); keep the existing 11 green plus new cases.

**Exit criteria:** every dashboard reads live DB; a student can log a week and a university coordinator approves it in the UI.

## Phase 2 — Harden edges + make it feel finished

- **Empty/loading/error states** audit across all 4 portals (reuse `EmptyState`/`Skeleton`).
- **Student dashboard live metrics**: fix `metrics`/`applications` return shape if mismatched with the view expectations.
- **Marketplace data hygiene**: `StudentMarketplace.jsx:33-41` hard-codes `studentId: 'std-01'` (use `sessionStore.getProfile()`) and sends `placement.company` (server returns both `company` and `companyName` — pick one consistently).
- **Mobile pass**: native `select` styling, long-name truncation, drawer nav.
- **Auth polish**: demo-account hints in sync with seeded creds; logout + 401 interceptor re-tested.
- **Data hygiene**: consistent camelCase mapping across controllers; remove stale `TODO(real-api)` markers.
- Optional: seed a couple of logbook entries so the demo shows a populated coordinator dashboard.

**Exit criteria:** no view shows boxes of hard-coded data; flows survive refresh/logout/login.

## Phase 3 — Ops hardening ✅ (complete 2026-09-02)

- ✅ Graceful shutdown (`SIGTERM`/`SIGINT` → `server.close` + `pool.end()`).
- ✅ Health endpoints `/healthz` (liveness) + `/readyz` (`SELECT 1`).
- ✅ Edge hardening: `helmet`, login rate limiter, `express.json({ limit: '100kb' })`, CORS allowlist kept.
- ✅ Schema lifecycle: lightweight forward-only SQL migration runner + `schema_migrations` table (auto-applied on boot for real PG; `npm run db:migrate` for manual). Baseline backfills `students.phone`; `0002_signup_fields.sql` later added the signup-only columns.
- ✅ Reproducibility: `engines.node` (+ `.nvmrc`).
- ✅ Observability: structured JSON logger + per-request UUID middleware.

## Phase 4 — Ship it: deploy + CI + smoke tests 🚧 (config complete, live deploy pending)

- ✅ **Backend deploy (Render)**: `render.yaml` blueprint (not a bare `Procfile`) — `rootDir: backend`, `nodeVersion: 20.19.0`, `healthCheckPath: /readyz`, autoDeploy, Render-generated `JWT_SECRET`, `NODE_ENV=production`. `CORS_ORIGIN` + `DATABASE_URL` are `sync: false` (prompted, never committed). `backend/Procfile` kept for portability.
- ✅ **Frontend deploy (Vercel)**: `frontend/vercel.json` — build config + `rewrites: /(.*) -> /index.html`. **Correction to the original plan:** `_redirects` is a Netlify/Render-Static artifact that Vercel ignores, so `vercel.json` `rewrites` is the mechanism that actually makes deep links survive a refresh on Vercel. `frontend/.env.example` added.
- ✅ **Supabase**: `npm run db:bootstrap` (`--seed` for demo data) provisions a fresh database from the idempotent `db/migrations/*.sql`. Uses the **session pooler** (5432), never the transaction pooler (6543) or the IPv6-only direct host.
- ✅ **CI**: `.github/workflows/ci.yml` — backend `npm test`, frontend `lint` + `build` on push/PR to `main`. ⚠️ **The workflow file is still uncommitted, so CI is not actually running yet.** Committing Phase 4 is the prerequisite for it going live.
- ✅ **Production safety rails**: missing/unsubstituted `DATABASE_URL` under `NODE_ENV=production` is fatal (no silent pg-mem fallback on a live URL); unset `CORS_ORIGIN` in production warns loudly; `DATABASE_SSL_CA_FILE` pins the Supabase CA for a verified TLS chain.
- ✅ **Runbook**: `DEPLOYMENT.md` (repo root — `docs/` is gitignored) with ordered steps, verification checklist, troubleshooting table, pre-launch security notes.
- ⬜ **Live deploy**: provision Supabase → create the Render blueprint → import into Vercel with `VITE_API_BASE_URL`. Not executed yet.
- ⬜ **E2E smoke**: walk the `DEPLOYMENT.md` checklist — login (all 4 demo roles) → apply → firm status update → student logbook → coordinator sign-off → admin CRUD.

**Exit criteria:** public staged URLs; CI green on merge; walkthrough of all 4 roles works on the live site.

## Phase 5 — Signup hardening ✅ (complete 2026-10-02, unmerged)

Registration existed only as a `useState` toggle on the login screens, so there was no
`/register` route, nothing was deep-linkable, and the client (firm) section had no
registration link at all. Worse, four fields the forms collected — firm `industrySector`
+ `contactPerson`, university `staffId` + `department` — were never sent to the API and had
no columns, so they were silently discarded.

- ✅ **Real signup routes**: `/register` (portal picker) and `/register/:role`, guest-guarded, backed by `features/auth/Register.jsx`. The auth screens became login-only so signup survives refresh/share. `config/registration.js` pairs each registrable role with its login/register/home paths; `admin` is deliberately absent.
- ✅ **Links wired up**: `/login/firm` ("New here? Join as a partner"), the student/university auth screens, and the landing header/hero/footer plus every self-serve portal card.
- ✅ **Dropped fields persisted**: `firms.contact_person`, `universities.staff_id`, `universities.department` via idempotent `0002_signup_fields.sql` (mirrored into `sql/schema.sql` and `0001_init.sql`).
- ✅ **Endpoint hardening**: per-role required-field validation (a form collecting a field it doesn't send now fails loudly), `admin` rejected, emails lowercased on write *and* lookup, rate limited 10/hour/IP separately from login.
- ✅ **Dead links**: `href="#"` "Forgot password?" replaced with admin-assisted-reset text; raw `<a href>` footers converted to react-router `<Link>`.
- ✅ **Tests 21 → 29**, including field persistence per role, admin rejection, case-insensitive duplicate detection and a register→login round-trip.

**Exit criteria:** a visitor can reach signup from any public entry point, deep-link to it, and every field they type is actually stored.

---

## Deferred (post-MVP / future)

Personalized placement matching/score, email notifications, file uploads/attachments, firm-side logbook sign-off, photo/report fields, frontend test framework. **Self-service password reset** is now an explicit open item: signup exists, but recovery is still admin-assisted via `POST /api/v1/admin/reset-password`, so the auth screens deliberately carry no "Forgot password?" link until a token + delivery flow exists.

## Timeline guardrails

- Phases 1–4 ≈ 6 short sessions; if a polish phase slips, cut polish, never cut shipping.
- Log every change in `docs/PROGRESS.md`; commit per task with repo-style messages (`feat(...)`, `fix(...)`).