# Student Connect — MVP Roadmap

**Status:** Active. All remaining work to reach a defensible, demoable MVP is consolidated here (this file absorbed the old per-area audit/deploy docs, which are deleted). Changelog of completed work lives in `docs/PROGRESS.md`; commands + architecture quirks live in `AGENTS.md`.

**Goal:** Take the repo from "core loop works, logbook is fake, unshipped" to a **defensible, demoable MVP** deployed with a real URL.

**Current state (verified 2026-08-28):**
- Real API: auth (all 4 portals), student marketplace + profile, firm dashboard/applicants, admin CRUD, university sign-off (`PATCH /university/logbooks/:id`). All against live Supabase.
- No student logbook submit/list backend at time of writing — since shipped (Phase 1) along with Phase 2 polish and Phase 3 ops hardening (see PROGRESS.md).

**Standing pre-req:** was a manual `ALTER TABLE students ADD COLUMN IF NOT EXISTS phone VARCHAR(20);` in the Supabase SQL Editor. Since Phase 3, the migration runner applies `db/migrations/0001_init.sql` automatically on boot against real PostgreSQL (`npm run db:migrate` too), so the `phone` column self-heals — no manual step needed.

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
- ✅ Schema lifecycle: lightweight forward-only SQL migration runner + `schema_migrations` table (auto-applied on boot for real PG; `npm run db:migrate` for manual). Baseline backfills `students.phone`.
- ✅ Reproducibility: `engines.node` (+ `.nvmrc`).
- ✅ Observability: structured JSON logger + per-request UUID middleware.

## Phase 4 — Ship it: deploy + CI + smoke tests

- **Backend deploy** (Render or Fly.io): add `Procfile` (`web: node server.js`); set `DATABASE_URL`, `JWT_SECRET` (strong, unique — `openssl rand -hex 32`), `NODE_ENV=production`.
- **Frontend deploy** (Vercel or Netlify): set `VITE_API_BASE_URL` to the deployed API (checked at build time in `apiClient.js`); keep `_redirects` (`/* → /index.html 200`) for SPA routing — it ships via `public/` into `dist/`, honored by Render Static Sites.
- **CI**: GitHub Action — backend `npm test`, frontend `lint` + `build` on push/PR.
- **E2E smoke**: script or checklist — login (all 4 demo roles) → apply → firm status update → student logbook → coordinator sign-off → admin CRUD.

**Exit criteria:** public staged URLs; CI green on merge; walkthrough of all 4 roles works on the live site.

---

## Deferred (post-MVP / future)

Personalized placement matching/score, email notifications, file uploads/attachments, firm-side logbook sign-off, photo/report fields, onboarding flows, frontend test framework.

## Timeline guardrails

- Phases 1–4 ≈ 6 short sessions; if a polish phase slips, cut polish, never cut shipping.
- Log every change in `docs/PROGRESS.md`; commit per task with repo-style messages (`feat(...)`, `fix(...)`).