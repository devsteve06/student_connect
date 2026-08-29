# Student Connect - Project Progress

## Current Status
- **Date**: 2026-08-27
- **Phase**: Frontend visual redesign (clean SaaS) complete
- **Overall Progress**: ~55%

## Development Log
> Updated every time changes are made. Newest entries first.

### 2026-08-29
- **Docs consolidation + cleanup**: rewrote `docs/IMPROVEMENT_PLAN.md` as the single MVP roadmap (absorbs the old audit/deploy docs and defines Phases 1–4, exit criteria, standing pre-req).
  - Deleted stale audit docs (`docs/README.md`, `backend-issues.md`, `frontend-issues.md`, `systems-engineering-review.md`, `deployment.md`) — all remediated items folded into the plan.
  - Removed legacy json-server mock (`frontend/mock-server.cjs`, `db.json`, `routes.json`), empty `src/input.css`, and dead `useStudentDashboardData.js` hook; dropped the `api` script + `json-server` devDep (lockfile re-synced via `npm install`); pruned now-dangling references from `README.md`, `AGENTS.md`, `backend/README.md`.
  - Verified: backend `npm test` 11/11; frontend `npm run lint` + `npm run build` green; no stale references remaining.

### 2026-08-28
- **Student profile editing**: added a `Profile` view so a student can view and edit personal details (full name, phone, email) with read-only identity info (reg number, course, university).
  - Backend: `students.phone VARCHAR(20)` added to `sql/schema.sql` + sample phones in `sql/seed.sql`; new `getProfile`/`updateProfile` in `studentController.js` (joins `universities`, whitelists fields, validates Kenyan phone `^(\+?254|0)[17]\d{8}$` + email, maps PG `23505` unique-email → friendly 400); wired as `GET/PATCH /api/v1/student/profile` behind the existing student guard.
  - Frontend: `studentService.getProfile/updateProfile`; new `features/student/views/StudentProfile.jsx` (forms via shared `Input`/`Button`/`Card`, success/error feedback, syncs updated name/email back into the session profile so the navbar updates); "Profile" link added to student nav + `AppRoute.jsx` route.
  - **Action needed**: run `ALTER TABLE students ADD COLUMN IF NOT EXISTS phone VARCHAR(20);` once in the Supabase SQL Editor — the live table is missing `phone` (verified: `GET /student/profile` currently returns `column s.phone does not exist` on Supabase until migrated).
  - Verified: backend `npm test` 11/11; frontend `npm run lint` + `npm run build` green; auth on new route confirmed against live API.

### 2026-08-28
- **Dark mode (comprehensive)**: added a System/Light/Dark 3-state theme toggle with `prefers-color-scheme` detection, manual override, and `localStorage` persistence.
  - Mechanism: `@custom-variant dark` class strategy in `index.css`; semantic surface/ink/line tokens (`--sc-*`) flip under `.dark` and drive the ~417 previously literal slate/white utilities; FOUC-prevention inline script + `theme-color` meta sync in `index.html`.
  - New `ThemeProvider`/`useTheme`/`themeContext` wrap the app in `main.jsx`; shared `ThemeToggle` (Sun/System/Moon segmented control) added to the dashboard `Navbar`, `Landing` header, and `AuthShell` form panel.
  - Per-role accents (`roleTheme`) gained dark counterparts; dark-mode remap rules keep soft chips/rings/tinted text legible; always-dark brand panels (hero, auth brand rail, `Sidebar`, admin overlay) preserved as-is.
  - Verified: `npm run lint` + `npm run build` green; compiled CSS contains token utilities + dark overrides.

### 2026-08-27
- **Landing page**: added a public single-page landing at `/` (replaces the old `/ → /login/student` redirect) as the front door to all portals. Built from the existing design system: dark hero with 4 role-themed portal cards (violet/amber/cyan/rose via `roleTheme`), features strip, 3-step "how it works", demo-account access panel, and footer. Auth-aware header shows "Back to {portal}" + sign out when a session exists.
- **Supabase DB connection**: backend wired to a Supabase-hosted PostgreSQL database directly via `DATABASE_URL` (no Supabase SDK — existing `pg` data layer + JWT auth unchanged). Schema + seed loaded through the dashboard SQL Editor.
- Modified `backend/data/db.js` to auto-enable SSL for any `supabase` host (`*.supabase.co` direct / `*.pooler.supabase.com` pooler); documented variants in `backend/.env.example`.
- `backend/.env` now points at the **session pooler** (`aws-1-eu-west-1.pooler.supabase.com:5432`, user `postgres.ycvectpdjlwdgasjxbaw`) — the direct host is IPv6-only and unreachable from this network.
- Verified: server boots with `Connected to PostgreSQL via DATABASE_URL.`; student login + `/student/metrics` and firm `/firm/applicants` return seeded Supabase data.
- **Frontend redesign (clean modern SaaS)**: new design system (brand tokens, typography, elevation) in `index.css`; bold violet/indigo brand + `favicon.svg`; per-role theme in `src/config/roleTheme.js`.
- **Backend API wiring**: fixed `firmService` prefix mismatch (`/firm/...` → `/api/v1/firm/...`, was returning 404); corrected stale dual-mount claim in `backend/README.md`; wired `FirmDashboard` + `FirmApplicants` to the real API (metrics, roster, and Pass/Shortlist/Place status actions, CSV export of the roster).
- Rebuilt shared components (`Button`, `Input`, `Select`, `Textarea`, `Badge`, `Card`, `Modal`, `Skeleton`, `EmptyState`, `StatusPill`, `MetricCard`).
- Canonicalized layout: `DashboardLayout` + `Sidebar` (with responsive mobile drawer) + `Navbar` (topbar); unified nav in `navigationConfig.jsx`; deleted duplicated/orphaned `student/views/FirmDashboard.jsx`.
- Rebuilt all auth pages on a shared `AuthShell` with password toggle + demo-account hints (de-jargoned copy).
- Rebuilt every dashboard/feature page (student, firm, university, admin) with consistent cards, metrics, pills, skeletons, empty states; de-jargoned user-facing copy.
- Added branded 404 page. Set `index.html` title/meta/fonts.
- Verified: `npm run lint` + `npm run build` green. See **Data Source Status** below for mock-vs-API notes.

### 2026-08-22
- Initialized `PROGRESS.md` as a living progress tracker; seeded log from git history.
- Status snapshot refreshed (backend remediation complete; frontend auth/routing work pending).

### 2026-06-24 — `434b490`
- fix(frontend): implement real auth for student, firm, university portals

### 2026-06-19
- `9eb3530` Merge backend remediation: auth guards, security/config hardening, tenant scoping, validation, tests
- `9cb2c88` chore: ignore local 'system documentation/' folder
- `9fb8a65` fix(backend): scope tenant data, validate inputs, harden CORS, add tests
- `7254bf3` fix(backend): harden secrets, config, error handling, and validation

### 2026-06-17 — `c5458fa`
- fix(auth): protect student, firm, and university routes with JWT + role checks

### 2026-06-14
- `15ae80a` chore: add _redirects file for routing configuration
- `ac2b621`, `83dd236`, `c195de4` fix: correct import paths (AssetPlaceholder, StudentLogbook)
- `28d301e` chore: remove example .env files from backend and frontend

### 2026-06-13
- `5155608` chore: stop tracking .env secrets; add .gitignore and .env.example
- `fb5f0c5`, `9b5f433` fix: PORT/env cleanup in server.js and error middleware

<!-- TEMPLATE for new entries:
### YYYY-MM-DD
- **Changed**: <what was modified>
- **Added**: <new features/files>
- **Fixed**: <bugs resolved>
- **Verified**: <how it was tested>
-->


## Project Overview
Student Connect is an Industrial Attachment platform connecting students with firms and universities. It features role-based portals for students, firms, universities, and admins with JWT authentication and PostgreSQL database.

## Architecture
- **Backend**: Express.js API with PostgreSQL (dual-mode: real pg or pg-mem in-memory)
- **Frontend**: React + Vite with role-based dashboards
- **Auth**: JWT-based with role enforcement (student, firm, university, admin)
- **Database**: 7 tables with relationships between universities, students, firms, placements, applications, and logbooks

## Backend Status
### ✅ Completed (All Critical/High/Medium/Low Issues Fixed)
- **C1-C3**: Authentication security hardened
- **H1-H4**: Database, routing, error handling, validation fixed
- **M1-M7**: Tenant scoping, enum validation, CORS, ID validation fixed
- **L1-L6**: Cleanup, tests, JWT configurability added
- **Tests**: 11/11 passing (node:test suite)

### 🔧 Backend Structure
```
backend/
├── server.js                 # App bootstrap, CORS, route mounting
├── sql/
│   ├── schema.sql            # DDL (PostgreSQL)
│   └── seed.sql              # Demo data (5 each role)
├── data/
│   ├── db.js                 # Dual-mode pool (real pg | pg-mem)
│   └── accounts.js           # Auth lookups
├── routes/                   # One router per domain
├── controllers/              # SQL-backed handlers
├── middleware/               # Auth + error handlers
└── utils/format.js           # Date helpers
```

## Frontend Status
### 🔄 In Progress
- **Authentication**: Real auth implemented (authService.js)
- **API Client**: Configured with JWT interceptor
- **Route Structure**: Role-based routing implemented
- **Dashboards**: Student, Firm, University, Admin views exist

### ⚠️ Outstanding Frontend Issues (from documentation)
1. **Fake auth on three portals** - Some portals may still use mock auth
2. **Missing route guards** - Some routes may lack proper protection
3. **API base URL** - May default to localhost instead of environment variable

## API Endpoints
### Auth
- `POST /api/v1/auth/register` - Create account
- `POST /api/v1/auth/login` - Authenticate

### Student
- `GET /api/v1/student/metrics` - Dashboard counters
- `GET /api/v1/student/applications` - User applications
- `POST /api/v1/student/applications` - Create application
- `GET /api/v1/student/placements` - Marketplace vacancies
- `GET /api/v1/student/profile` - Own personal details
- `PATCH /api/v1/student/profile` - Edit name, phone, email

### Firm
- `GET /api/v1/firm/metrics` - Corporate dashboard
- `GET /api/v1/firm/applicants` - Candidate roster
- `PATCH /api/v1/firm/applicants/:id` - Update status

### University
- `GET /api/v1/university/metrics` - Institutional analytics
- `GET /api/v1/university/logbooks/pending` - Pending sign-offs
- `PATCH /api/v1/university/logbooks/:id` - Faculty sign-off

### Admin (admin only)
- `GET /api/v1/admin/users` - List all accounts
- `POST /api/v1/admin/users` - Create any account
- `POST /api/v1/admin/reset-password` - Reset password
- `DELETE /api/v1/admin/users/:role/:id` - Delete account

## Demo Accounts
| Role       | Login                                   | Password     |
|------------|-----------------------------------------|--------------|
| admin      | `sysadmin` (username)                   | `theadmin`   |
| student    | `alex.kamau@students.strathmore.edu`    | `password123`|
| firm       | `careers@nexuslabs.io`                  | `password123`|
| university | `registrar@jkuat.ac.ke`                 | `password123`|

## Data Source Status
> Where each frontend view gets its data today, and the service method to use when wiring the real API.
> Pages mark their swap points with `// TODO(real-api)`.

| View | Current source | Swap target when wired |
|------|----------------|------------------------|
| `StudentDashboard` | inline mock | `studentService.getMetrics()`, `getApplications()` |
| `StudentMarketplace` | **real API** | already wired (`getPlacements()`, `applyForPlacement()`) |
| `StudentLogBook` | inline mock | `studentService` (add `getLogbooks` / `submitLogbook`) |
| `FirmDashboard` | **real API** | already wired (`getFirmMetrics()` + `getApplicants()`; `updateApplicantStatus()` for Pass/Shortlist/Place actions) |
| `FirmApplicants` | **real API** | already wired (`getApplicants()`) |
| `UniversityDashboard` | inline mock | `universityService.getCoordinatorMetrics()`, `getPendingLogbooks()`, `signOffLogbook()` |
| `UniversityAudits` | inline mock | `universityService` audit endpoint (TBD) |
| `AdminDashboard` | **real API** | already wired (`adminService.*`) |
| Auth (all portals) | **real API** | already wired (`authService.login/register/adminLogin`) |

## Next Steps
1. **Frontend**: (done) visual redesign, responsive shell, de-jargoned copy — see Data Source Status for API wiring
2. **API wiring**: swap remaining mock views to the service methods above
3. **Testing**: expand test coverage
4. **Deployment**: set up CI/CD, environment variables
5. **Documentation**: complete system documentation
6. **Security**: set strong JWT_SECRET in production

## Notes
- Backend runs on port 5000 (configurable via PORT env)
- Frontend uses Vite dev server with proxy to backend
- Database falls back to pg-mem if DATABASE_URL not set
- Connected to Supabase via the session pooler (`aws-1-eu-west-1.pooler.supabase.com:5432`); SSL auto-enabled in `backend/data/db.js`
- All backend security issues have been remediated
