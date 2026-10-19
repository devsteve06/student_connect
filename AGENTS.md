Updates to **AGENTS.md** (Institutional identity + email derivation, Affiliation model, New public endpoint, Registration changes, Tests/Build, Current branch state)

### Authentication / Registration (institutional emails + affiliation)

- **Derive institutional emails (no free-text emails for students/firms/universities)**: the server builds addresses from the display name + institution domain with a per-role subdomain. See `backend/utils/identity.js` (mirrored in `frontend/src/config/identity.js`).
  - Student → `slug(name)@students.<domain>`
  - Firm → `slug(name)@hr.<domain>` (uses company name)
  - University → `slug(name)@registrar.<domain>` (supplies its own domain)
  - `institutionDomainFromEmail()` recovers the bare institution domain by stripping a leading `students.|hr.|registrar.` label; `normalizeDomain()` tidies pasted domains and `slugifyName()` produces the local part deterministically (NFKD diacritics folded, non-alphanumerics → single dot, trimmed).
- **Affiliation required and stored**:
  - `students.university_id` exists (NOT NULL in effect for signup; links to a `universities` row).
  - `firms.university_id` **added** (nullable in schema to avoid breaking pre-existing rows; new firm signups must supply a university). Column added in `0003_firm_affiliation.sql`, reflected in `db/migrations/0001_init.sql`, `sql/schema.sql`, and indexed (`idx_firms_university`).
  - Universities supply their own domain at signup (no new `universities.domain` column; domain is derived from the registrar email). This matches "one row per institution/coordinator" model (kept as-is).
- **Public institution list**: `GET /api/v1/auth/universities` returns `[{ id, name, domain }]` (bare domain, no role prefix). Mounted in `routes/authRoutes.js`; used by public signup forms and admin create flow. Unauthenticated by design.
- **Backend changes (`backend/`)**:
  - `controllers/authController.js`: `listUniversities()` added; `registerUser()` no longer accepts client email (always derived). Validates `universityId` for student/firm (looks up university and recovers domain), validates `domain` for university; uses `buildAccountEmail()`; enforces password policy; duplicate checks against all account tables. Returns the derived `email`.
  - `controllers/adminController.js`: `createUser()` derives email for non-admin roles, requires `universityId` for student/firm and `domain` for university; keeps admin username+optional email behavior (hardened).
  - `data/accounts.js`: firm INSERT includes `university_id`; admin email may be `NULL` if omitted (guarded). 
  - `routes/authRoutes.js`: `GET /universities` route added.
  - `utils/identity.js` (new): shared email/identity helpers.
- **Frontend changes (`frontend/`)**:
  - `config/identity.js` (new): mirror of backend identity rules; `previewAccountEmail()` for live read-only preview.
  - `service/authService.js`: `listUniversities()` added; `register()` no longer lowercases/sends client email (API derives it).
  - `features/auth/Register.jsx`: loads universities on mount; student/firm show university dropdown; university shows institution domain input; read-only auto-generated email displayed for all three; payloads send `universityId` (student/firm) or `domain` (university), no free-text `email`. Added `useEffect` + identity preview.
  - `features/admin/views/AdminDashboard.jsx` (CreateUserModal): for student/firm, university selector + affiliation; for university, domain input; email is derived server-side (modal no longer requires entering an arbitrary email for non-admin). Password hint/validation unchanged.

### Data / Migrations / Schema

- New migration `0003_firm_affiliation.sql`: `ALTER TABLE firms ADD COLUMN IF NOT EXISTS university_id INTEGER REFERENCES universities(id) ON DELETE SET NULL; CREATE INDEX IF NOT EXISTS idx_firms_university ON firms(university_id);` (pg-mem compatible; no string-parsing backfill used to avoid pg-mem function gaps).
- `db/migrations/0001_init.sql`: includes `firms.university_id` and `idx_firms_university` for fresh builds.
- `sql/schema.sql`: includes `firms.university_id` and `idx_firms_university`; mirrors migration state.
- Backfill not applied to existing real rows by SQL (runtime derivation used where needed). Pre-existing firms with `university_id` NULL remain valid (nullable). 
- New migration `0010_interview_date.sql`: `ALTER TABLE applications ADD COLUMN IF NOT EXISTS interview_date DATE;` (also in `0001_init.sql` + `sql/schema.sql`). Stamped `today + 7` when a firm moves an application to `Interviewing`; the date rides in the applicant's notification.
- **DATE vs TIMESTAMPTZ**: node-postgres parses `DATE` as *local* midnight, so `formatDate()`'s UTC getters can slip a day east of UTC. Use `toDateOnly()` (`backend/utils/format.js`) for `DATE` columns (`appliedDate`, `interviewDate`); `todayISO()` / `isoInDays()` are local-calendar.
- **Status-driven counters**: student `activeApplications` = all applications except `Rejected`; firm "interviews pending" = `Interviewing`; firm "logbooks to verify" and university `actionRequiredLogs` / pending-logbook list only include students whose application is `Approved`/`Hired` at that firm/university.
- **Reopen**: `PATCH /api/v1/firms/placements/:id/reopen` (`reopenPlacement`) sets `status='Open'`, clears `closed_at`, is idempotent, 404s for other firms, and notifies the firm's university students (`posting_reopened`).

### Tests

- `backend/test/unit.test.js` updated for the new model:
  - firm registration now requires `universityId` and asserts derived email and stored `university_id`;
  - university registration requires `domain` and asserts derived email;
  - student registration derives email (no client email), requires `universityId`; added tests for missing university, for ignoring a spoofed email, and for rejecting duplicate derived identity;
  - login test updated to use derived email;
  - migrations test asserts `firms.university_id` exists;
  - added identity helper tests (`slugifyName`, `normalizeDomain`, `isValidDomain`, `institutionDomainFromEmail`, `buildAccountEmail`);
  - added public institutions list test (`/api/v1/auth/universities`).
- **All tests pass**: 50/50 (node --test). 

### Verified

- Backend tests: `cd backend && node --test` → 50 passing, 0 failing.
- Frontend lint: `cd frontend && npx eslint src/features/auth/Register.jsx src/features/admin/views/AdminDashboard.jsx src/service/authService.js src/config/identity.js` → clean (exit 0).
- Frontend build: `cd frontend && npm run build` → Vite production build succeeds (dist outputs generated).
- End-to-end demonstration against live Postgres (`DATABASE_URL`): 
  - `GET /api/v1/auth/universities` returns seeded institutions with bare domains.
  - Registered university (`Demo Registrar`) → email `demo.registrar@registrar.demo-university.ac.ke`.
  - Registered firm (`BrightPath Analytics`) → email `brightpath.analytics@hr.nexu.ac.ke`, `university_id=1`.
  - Registered student (`Dennis Otieno`) → email `dennis.otieno@students.nexu.ac.ke`, `university_id=1`.
  - Spoofed client email is ignored (server derives and stores the correct institutional address). All changes are committed in the working tree on branch `feat/gateway-naming` (no node_modules/.env committed). 

### Admin cross-portal preview ("view as")

- After signing in as an admin, the admin may open the student, firm and university portals **without giving up the admin session**. The view is **read-only**.
- Contract (do not break it):
  - The SPA sends `X-View-As-Role` + `X-View-As-Id` (`frontend/src/service/apiClient.js`), reading the target from `sessionStore` key `preview`.
  - `backend/middleware/authMiddleware.js#previewAs(expectedRole)` validates that the header role equals the mounted portal, that the method is `GET`, and that the account exists; then it swaps `req.user` for that account (`req.previewAdminId` keeps the admin id). This works because every controller resolves the acting account from `req.user.id`.
  - Portal routers are mounted `authorizeRoles(<role>, 'admin'), previewAs(<role>)` in `routes/index.js`. `/admin` ignores the headers.
  - Writes in preview return **403** by design, so nothing is attributed to the viewed account (an admin must not apply for a student, or hire for a firm).
  - `apiClient` must not clear the session on a 403 while a preview is active — that 403 is the read-only guard. A 401 still signs out.
- Frontend: `AuthProvider` exposes `preview` / `startPreview` / `stopPreview`; `ProtectedRoute` admits an admin into a portal only when `preview.role` matches; `DashboardLayout` shows the read-only banner with **Exit preview**. The admin overview starts a preview from the "Jump into any portal" cards (first account of the role) or the accounts table's **View as** action.

## Current state notes

- Branch: `feat/gateway-naming` (same as before; work is uncommitted locally relative to origin except as shown). 
- Untracked/modified files in this change set include new `backend/utils/identity.js`, new `frontend/src/config/identity.js`, new `backend/db/migrations/0003_firm_affiliation.sql`, plus edits to auth/admin/accounts/routes, schema/migrations, tests, Register.jsx, authService.js, and AdminDashboard.jsx (as tracked by `git status`).
- The real DB now has the two new demo accounts plus the new university/faculty account created during verification; they demonstrate the derived-email + affiliation behavior. No seeded demo dataset was added via `db:bootstrap --seed` (only live registration via API). 
- Previous notes about Phase 4/CI still apply (CI workflow etc. uncommitted in that context) — this change set is orthogonal to deployment scaffolding and focuses on the institutional identity + registration flow. 
- No self-service password reset added (still deferred).
