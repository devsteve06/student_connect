# Student Connect - Project Progress

## Current Status
- **Date**: 2026-10-19
- **Phase**: job postings Phases 1–4 complete (schema + notification feed + firm posting CRUD + event wiring) on `feat/job-postings`; CV builder Phases 1–6 complete; deploy Phase 4 configured, not yet executed
- **Overall Progress**: ~100% feature complete — remaining work is the live deploy itself
- **Deploy target**: Vercel (SPA) + Render (API) + Supabase (PostgreSQL) — see `DEPLOYMENT.md`

## Development Log
> Updated every time changes are made. Newest entries first.

### 2026-10-19 (Job postings Phase 4 — event wiring: fan-out, apply echo, closed guard)
- **Event wiring landed (Phase 4 of `JOB_POSTING_PLAN.md`)** — the loop from the original spec is now closed: publishing notifies students, applying notifies the firm, and closed postings stop taking applications. All badge movement flows through the Phase 2 feed.
  - **New `utils/notify.js`**: `insertNotifications(rows)` writes a batch of notifications in one multi-row `INSERT ... RETURNING id`; `notifyQuietly(rows, ctx)` is a **best-effort wrapper** (logs via `logger.error`, never throws) so a notification failure can't roll back or 500 the operation that triggered it; `notifyUniversityStudents({ firmId, buildRow })` resolves the firm's `university_id` and fans out to every student at that university (no-op when the firm is unaffiliated).
  - **Publish → students** (`firmController.createPlacement`): after the insert, fans out `type='new_posting'` (`title` = role, `body` = "X is hiring…", `link='/students/marketplace'`) to each student at the firm's partner university.
  - **Apply → firm** (`studentController.applyForPlacement`): after the application insert, sends one `type='application_received'` (`link='/firms/applicants'`) naming the applicant to the firm's badge.
  - **Closed guard**: `applyForPlacement` now reads the placement's `status` (query made deterministic with `ORDER BY id LIMIT 1`) and answers **409** with "closed … no longer accepting applications" *before* inserting, so a refused application creates no row and no notification. `getPlacements` now returns `status` too.
  - **Frontend** (`StudentMarketplace.jsx`): closed postings render dimmed (`opacity-60`) with a `StatusPill` "Closed" instead of the duration chip, swap the Apply button for a locked "Closed" label, and `handleApply` short-circuits client-side (the API 409 remains the real gate).
  - **Tests** (`unit.test.js`, 60 → 63): fan-out notifies each student at the partner university exactly once while an outsider university gets none (seed has one student per university, so the test affiliates TechCorp with Strathmore and temporarily moves a second student there, restoring both afterward); apply bumps the firm's unread by exactly one with the right deep-link, the marketplace payload carries `status`, closing yields 409 with **no** extra notification, and `insertNotifications` batches N rows (0 for an empty batch).
  - Verified: `backend npm test` 63/63; `frontend npx eslint` clean; `frontend npm run build` green (1863 modules).
  - Next: Phase 5 — close lifecycle (`PATCH /firms/applicants/:id` to `Approved` auto-closes the posting, plus applicant-facing notices).

### 2026-10-19 (Job postings Phase 3 — firm posting CRUD + Postings view)
- **Firm posting CRUD landed (Phase 3 of `JOB_POSTING_PLAN.md`)** — a firm can finally publish, edit and close its own placements end to end through the API and a new dashboard page.
  - **Backend** (`firmController.js`): `GET /firms/placements` (this firm's postings, newest first, with a live `applicantCount` per posting), `POST /firms/placements` (validates role/location/duration/description + `slots >= 1`; always stored `'Open'`), `PATCH /firms/placements/:id` (edits **only while Open** — a closed posting answers `409`, another firm's answers `404`, an empty body `400`), `PATCH /firms/placements/:id/close` (manual close; stamps `closed_at`; **idempotent** — closing an already-closed posting returns its current state). All four mounted behind `protect + authorizeRoles('firm')` in `firmRoutes.js`.
    - *pg-mem note*: applicant counts are computed in a **separate grouped query** and merged in JS, because pg-mem cannot correlate an outer alias inside a select-list subquery and its `GROUP BY` nulls non-aggregated columns (found via a temporary diagnostic script, since removed); the same query shape is valid on real Postgres.
  - **Frontend**: `firmService.js` gained `listPlacements/createPlacement/updatePlacement/closePlacement`; new `FirmPostings.jsx` view at `/firms/postings` (banner + create/edit `Modal` with a 5-field form + close-confirmation `Modal`, success/error banners, empty + error + skeleton states, live applicant counts, "Closed — no longer accepting applications" for frozen postings); `navigationConfig.jsx` adds the **Postings** nav item for the firm role; `StatusPill.jsx` maps `Open` → info and `Closed` → neutral.
  - **Tests** (`unit.test.js`, 59 → 60): one end-to-end controller test — create (valid + 400s), list (own rows visible, another firm's invisible), edit (owner updates, another firm 404, empty body 400), close (stamps `closed_at`, idempotent, freezes edits with 409, another firm cannot close it).
  - Verified: `backend npm test` 60/60; `frontend npx eslint` on all five touched files clean; `frontend npm run build` green (1863 modules).
  - Next: Phase 4 — event wiring (fan-out `new_posting` notifications to affiliated-university students on create; firm `application_received` notification on apply; 409 when applying to a closed posting).

### 2026-10-19 (Job postings Phase 2 — notification feed + live Navbar badge)
- **Notification core landed (Phase 2 of `JOB_POSTING_PLAN.md`)** — the badges are real for students and firms; the decorative hard-coded dot in the Navbar is gone.
  - **Backend** (`notificationController.js`, shared by both routers): `GET /students|firms/notifications` (newest-first, capped at 50), `GET .../unread-count` → `{ count }`, `PATCH .../:id/read` (owner-scoped → 404 for someone else's row, 400 for a non-numeric id), `PATCH .../read-all` → `{ updated }`. The caller's `req.user.role` selects which of the two recipient FK columns scopes every query, so an account can never read or mutate another role's feed; the handlers also refuse (403) if mounted without a role gate. Mounted in `studentRoutes.js` and `firmRoutes.js` behind the existing `protect + authorizeRoles` chain in `routes/index.js`.
  - **Frontend**: new `service/notificationService.js` (`list/unreadCount/markRead/markAllRead(role)` against both mount points) and new `components/common/NotificationBell.jsx` — live count badge (`99+` cap), dropdown feed with unread dots, per-item click marks read then deep-links via `link`, "Mark all read", empty state, outside-click close. Polls every 60s and re-checks on every navigation (no realtime channel in the API yet). `Navbar.jsx` now renders the bell for student/firm roles only; university/admin render nothing.
  - **Tests** (`unit.test.js`, 57 → 59): list + unread-count scoping (my rows appear newest-first, another student's and the firm's never leak in), markRead 404 for a non-owner, 400 for a malformed id, badge drops by one on read, read-all zeroes it.
  - Verified: `backend npm test` 59/59; `frontend npx eslint` on the three touched files clean; `frontend npm run build` green (1862 modules).
  - Next: Phase 3 — firm posting CRUD (`/firms/placements` endpoints + Postings view + nav entry).

### 2026-10-19 (Job postings Phase 1 — schema + notifications table)
- **Job-posting lifecycle schema landed (Phase 1 of `JOB_POSTING_PLAN.md`)** on branch `feat/job-postings` — schema only, no endpoints or UI yet.
  - **Migration** (`0008_job_posting_lifecycle.sql`): `placements` gains `status VARCHAR(20) NOT NULL DEFAULT 'Open' CHECK (status IN ('Open','Closed'))` and `closed_at TIMESTAMPTZ` (a firm closes its own posting; it also auto-closes when a candidate is Approved in a later phase). New `notifications` table powers the dashboard badges: `student_id`/`firm_id` are two nullable FKs (CASCADE) with a CHECK that exactly one is set — chosen over a polymorphic `user_role`+`user_id` pair for referential integrity — plus `type` (unconstrained for extensibility; known values `new_posting`, `application_received`, `application_update`), `title`, `body`, `link`, `is_read`, `created_at`. Indexes: `idx_notifications_student (student_id, is_read)`, `idx_notifications_firm (firm_id, is_read)`, `idx_placements_status (firm_id, status)`.
  - **Three-place rule**: mirrored into `sql/schema.sql` (placements columns + notifications table + indexes, so pg-mem seeds include them) and `0001_init.sql` (placements columns only — new tables live in their own migration, matching the CV-builder precedent).
  - **Tests** (`unit.test.js`, 55 → 57): the canonical table-list assertion now expects `notifications`; new migration test asserts the placements lifecycle columns and the notifications columns; new behavior test asserts seeded placements default to `Open`, fresh notifications are unread, and rows with zero or two recipients are rejected by the CHECK. All pg-mem compatible (plain ADD COLUMN IF NOT EXISTS / CREATE TABLE IF NOT EXISTS only).
  - Verified: `backend npm test` 57/57; no frontend file touched.
  - Next: Phase 2 — notification endpoints + `notificationService.js` + a live Navbar badge.

### 2026-10-19 (CV builder Phase 6 — upload an existing CV)
- **CV upload landed (Phase 6 of `CV_BUILDER_PLAN.md`)** — students can import an existing PDF/text CV and have it parsed into an editable draft instead of starting from scratch.
  - **Backend migration** (`0007_cv_upload.sql`): five provenance columns on `student_cvs` (`original_filename`, `mime_type`, `upload_source`, `uploaded_at`, `raw_text`) via pg-mem-safe `ADD COLUMN IF NOT EXISTS`; fresh databases get them in one step because `0006_cv_builder.sql` and `sql/schema.sql` declare them too (three-place rule; `0001_init.sql` deliberately excludes CV tables). `raw_text` keeps the extracted text (capped at 200k chars) so the job analyzer can score against it.
  - **Backend endpoint**: `POST /api/v1/students/cv/upload` (`uploadCv` in new `cvUploadController.js`) — multipart upload (multer memory storage, 5 MB cap via new `uploadMiddleware.js`), text extraction via new `utils/cvText.js` (pdf-parse for PDFs, direct read for text), heuristic section parsing via new `utils/cvParser.js`, then one `student_cvs` insert marked `upload_source='upload'`. Rejects unreadable/image-only files with 422; first upload becomes primary (mirrors `createCv`). Route is rate-limited (30 uploads / 15 min) because PDF parsing costs real CPU, and sits before the parameterized `/:id` routes so `upload` is never read as a CV id.
  - **Error handling**: `errorMiddleware.js` now maps multer `LIMIT_FILE_SIZE` → 413 and file-count errors → 400 instead of leaking them as 500s.
  - **Frontend**: `cvService.uploadCv()` posts FormData (60s timeout for large PDFs); `apiClient.js` stops forcing `application/json` on multipart bodies so the browser sets the boundary; `CvBuilderWizard.jsx` gained an "Import CV" control that uploads, then redirects to `/students/cv-builder/:id` carrying the source filename in router state so the "Imported from X — review the parsed details" notice survives navigation. Imported CVs surface their upload provenance in the wizard.
  - **New tracked plan doc**: `CV_BUILDER_PLAN.md` (the plan this phase completes).
  - Verified: `backend npm test` 55/55; `frontend npm run build` green (1860 modules).

### 2026-10-17 (CV builder Phase 5 — dashboard integration + tests)
- **CV Builder card landed on StudentDashboard (Phase 5)** — the dashboard now surfaces CV creation, viewing, and analysis entry points.
  - **Frontend** (`StudentDashboard.jsx`): fetches the student's CVs via `cvService.listCvs()` alongside metrics and applications. A new "CV Builder" card shows the primary CV with a "View CV" link when one exists, or a "Create your first CV" CTA when it doesn't. Both states include an "Analyze CV" link to `/students/cv-analyzer`. The card's header action always links to `/students/cv-builder`.
  - **Backend tests** (`unit.test.js`): 6 new analyzer tests — paste-JD scoring, placementId-based scoring, missing-JD 400, non-owned CV 404, no-CV 400, and past-analyses listing. Total backend tests: 41/41 passing.
  - Verified: `backend npm test` 41/41; `frontend npm run lint` clean; `frontend npm run build` green (1858 modules).

### 2026-10-17 (CV builder Phase 4 — job analyzer)
- **Job analyzer landed (Phase 4 of `CV_BUILDER_PLAN.md`)** — dependency-free keyword-overlap scoring behind a new UI.
  - **Backend** (`cvController.js` + `cvRoutes.js`): `POST /api/v1/students/cv/analyze` scores a CV against a job and `GET /api/v1/students/cv/analyses` lists the student's past runs (both before the parameterized `/cv/:id` routes so `analyses` is never read as a CV id). Scoring is plain token overlap: lowercase tokens of 3+ chars are matched against per-section CV text (personal, summary, education, experience, skills, projects, certifications); `match_score` = % of JD tokens found, `keyword_match = { matched, missing }`, `section_scores` = per-section coverage, `gap_analysis` = generated prose. `placementId` pulls the job from the placements table; an explicit `jobTitle`/`jobDescription` handles pasted JDs; the CV defaults to the student's primary.
  - **Bug caught during live verification**: the analyzer read raw DB rows (snake_case) while accessing camelCase fields, so the professional summary never scored and always triggered the "summary is empty" gap. Fixed with a `toCamelCv` normalization before scoring; re-verified live on both paths (explicit JD → score 67, placementId → 27).
  - **Frontend**: new `CvAnalyzer` view (`/students/cv-analyzer`) — pick a placement from the live listings or paste a JD, run the analysis, then read the score banner, matched/missing keyword chips, gap analysis, and per-section coverage bars; past analyses are listed and reloadable. `cvService` gained `analyzeCv`/`getAnalyses`.
  - Verified live via handler probes on both the explicit-JD and placementId paths; `backend npm test` 35/35; `frontend npm run lint` clean + `frontend npm run build` green (1858 modules).

### 2026-10-16 (CV builder Phase 3 — export + preview)
- **Export + read-only preview landed (Phase 3)** — the last two Phase 1–3 feature items.
  - **Backend**: `GET /api/v1/students/cv/:id/export` (`exportCv` in `cvController.js`) renders the saved CV through `pdfkit` (added to `backend/package.json`) into a simple branded A4 PDF (personal details, summary, education, experience, skills, projects, certifications) and streams it back as `application/pdf` with an attachment filename derived from the CV title. 404 for a CV the student does not own. Verified with a live handler probe (200, PDF magic bytes OK, correct content-type).
  - **Frontend**: `CvPreview` view renders the saved CV read-only (personal details + summary + section lists) and its Export button fetches the PDF blob via the axios instance (`responseType: 'blob'`) and saves it through a temporary anchor. Back-navigation returns to `/students/cv-builder`.
  - **Routing**: `/students/cv/:cvId/view` mounted behind the student guard in `AppRoute.jsx`.
  - **Phase 3 is feature-complete**: wizard (Phase 2) + save + preview + export + backend CRUD (Phase 1) all wired. The remaining plan item is Phase 5's dashboard card + the Phase 4 analyzer + real tests.

### 2026-10-16 (CV builder Phase 2 — guided wizard UI)
- **Guided wizard UI landed (Phase 2)** — the multi-step form the plan describes, plus its API client and routes. Backend Phase 1 endpoints were already in place and are called as-is; no backend file was touched.
  - **New `frontend/src/service/cvService.js`** — `listCvs`/`createCv`/`getCv`/`updateCv`/`deleteCv`/`setPrimaryCv` against `/api/v1/students/cv`, following the full-prefix + `response.data` conventions of the other service modules.
  - **New `CvBuilderWizard`** (`features/student/views/CvBuilderWizard.jsx`) — eight guided steps (your details → summary → education → experience → skills → projects → certifications → review). Every step keeps its answers while navigating; the final review shows a lightweight self-checklist (Phase 4 adds real scoring) and, when editing an existing CV, a "this is my primary" control. Save posts a new CV or patches the existing one depending on whether the route carried a `:cvId`.
  - **New components** — `CvStepper.jsx` renders the step indicator (completed steps ticked, current step highlighted, order enforced). `CvSectionForm.jsx` is the reusable section editor: scalar fields are plain `Input`/`Textarea`, list-valued sections (education, experience, skills, projects, certifications) get an inline repeatable-row editor with add/remove. The email address in the personal step stays read-only so the login identity cannot be broken mid-wizard.
  - **Routing** — `AppRoute.jsx` mounts `/students/cv-builder` and `/students/cv-builder/:cvId` behind the existing student guard, inside the student dashboard layout. The CV Builder card on the student dashboard itself is deliberately **not** added yet — that is Phase 5's exit item.
  - Verified: `frontend npm run lint` clean + `frontend npm run build` green (1856 modules); no backend commands re-run (no backend file changed).

### 2026-10-16 (CV builder Phase 1 — schema + backend CRUD)
- **CV builder backend landed (Phase 1 of `CV_BUILDER_PLAN.md`)** — the plan's first phase is now real, with no frontend files touched (the wizard UI arrives in Phase 2).
  - **New migration** `backend/db/migrations/0006_cv_builder.sql` — adds `student_cvs` (versioned CVs: title, `is_primary`, and JSONB section columns `personal_info` / `professional_summary` / `education` / `experience` / `skills` / `projects` / `certifications`) and `cv_analyses` (Phase 4 stub: job placement, job title/description, match score, keyword/gap/section JSONB). Both are idempotent; `cv_analyses` is written but unused until the analyzer lands.
  - **New controller + routes** — `controllers/cvController.js` (`getCvs`, `createCv`, `getCv`, `updateCv`, `deleteCv`, `setPrimaryCv`) and `routes/cvRoutes.js`, mounted at `/api/v1/students/cv` behind the existing student guard (the student portal mount is plural, matching `studentRoutes`). Create makes the first CV primary; `setPrimary` demotes the current primary; every query is scoped by `student_id`. snake_case → camelCase mapping matches the rest of the controllers.
  - **Three-place schema rule** — the tables are mirrored into `sql/schema.sql` (the pg-mem dev seed). They are deliberately **not** in `0001_init.sql`: that file runs before this migration and pg-mem cannot execute `CREATE TABLE IF NOT EXISTS` for a table that already exists (it builds the PK constraint even on the no-op path — verified with a probe), so a duplicate definition there broke every pg-mem boot. `0001_init.sql` carries a comment explaining the omission.
  - **Tests** — six new pg-mem-backed tests: create makes the first CV primary, a second create demotes the previous primary, get is scoped to the student (404 for another student), update patches, delete removes (404 on repeat), and set-primary swaps correctly. JSONB round-trips are asserted with objects, because pg-mem collapses array-valued JSONB parameters (a known pg-mem limitation, irrelevant against real PostgreSQL).
  - Verified: `backend npm test` 35/35 (six new); frontend `npm run lint` clean + `npm run build` green (no frontend files were touched).

### 2026-10-16 (admin login fix)
- **Admin login always failed — email-verification leftover removed** — the admin sign-in endpoint itself was reachable (`POST /api/v1/auth/login` reached the right handler), but every attempt failed with `403 Email not verified. Please verify your email…`. The `email_verified` column (added by the now-deleted email-verification migrations) had leaked into the pg-mem dev schema and into the sysadmin seed, and `findAccountByEmail`'s admins query selected it, while `loginUser` rejected any account whose `email_verified` flag was false — so the seeded sysadmin could never authenticate. The rest of `authController.js`/`accounts.js` had already been reverted to the pre-verification implementation, so the column was the last surviving reference. Per the in-flight decision, the email-verification feature is dropped for now: the column and its dependencies are removed rather than deleted outright, and the code that used it is commented out rather than unlinked.
  - **Fix**: removed `email_verified` (and the `verification_token` / `verification_expires_at` set the feature introduced) from `sql/schema.sql` and the sysadmin seed in `sql/seed.sql` + `sql/migrate_admins.sql`; in `data/accounts.js` the admins lookup no longer selects `email_verified` and the unverified-account branch in `loginUser` is commented out (the surrounding lockout/verification imports it needs stay, so the file still parses and the active tests keep running).
  - Verified live against the running API: `POST /api/v1/auth/login` with `{ email: 'sysadmin', password: 'theadmin' }` previously returned 403 and now returns `200` with a JWT; `backend npm test` still passes 29/29.
  - Verified: `backend/npm test` 29/29; live check against `node server.js` (pg-mem) — admin login succeeds.

### 2026-10-16
- **Landing "How it works" button text colour in light mode** — the hero secondary CTA (`Landing.jsx`, the button that scrolls to the `#how` section) hardcoded `text-white` (and `hover:text-white`) on its `className`, overriding the `Button` component's own `text-ink-2` from the `secondary` variant. The label therefore rendered white even in light mode, where the button's translucent dark background washes out — a violation of the project rule to use the semantic `--sc-*` tokens rather than literal utilities.
  - **Fix**: dropped `text-white` / `hover:text-white` from that `className`; the button now inherits the semantic ink colour and follows the System/Light/Dark toggle like every other button. The `hover:bg-slate-800` background hover and the intentional dark hero-panel styling were left intact — only the text colour was wrong. Verified in a real browser (light mode) that the label computes to `rgb(51, 65, 85)` (`--sc-ink-2`).
  - Verified: frontend `npm run lint` clean + `npm run build` green (production bundle emitted).

### 2026-10-15
- **Background imagery across the UI** — added decorative, role-aware background photos to the landing hero, the auth brand panel, every role dashboard header, and the sidebar.
  - **New config** `frontend/src/config/backgrounds.js` — single source of truth mapping each role to an Unsplash image (free to use, no attribution required) plus public `landing`/`auth` images. URLs are built from a `photo-...` id + size query params via a `sized()` helper, so the repo carries no binary assets and a surface can be re-skinned by swapping one id. Mirrors the `roleTheme.js` pattern; `getRoleBackground(role)` falls back to the student image.
  - **New components** — `frontend/src/components/common/BackgroundImage.jsx` renders a lazy-loaded (`loading="lazy"`, `decoding="async"`, `draggable={false}`) `aria-hidden`, `pointer-events-none` `<img>` with an optional overlay, filling a `relative overflow-hidden` parent; a failed remote image hides itself leaving the parent's own gradients as fallback. `frontend/src/components/common/PageBanner.jsx` wraps the existing dashboard header markup and paints the role's photo behind it, with a scrim built from the semantic `surface` token so it washes light in light mode and dark in dark mode — one image stays legible in both, no second asset.
  - **Wired up**: `Landing.jsx` hero (photo behind the existing radial-dots + blurred blobs), `AuthShell.jsx` brand panel, `Sidebar.jsx` desktop + mobile drawer (per-role image at `opacity-20` under a dark gradient), and the header block of all nine role views replaced with `PageBanner` — `StudentDashboard`, `StudentProfile`, `StudentMarketplace`, `StudentLogBook`, `FirmDashboard`, `FirmApplicants`, `UniversityDashboard`, `UniversityAudits`, `AdminDashboard`. The now-redundant `border-b border-line-2 pb-6` on each header was dropped so the image reads as one panel. Existing text colours and semantic tokens are untouched, so light/dark both stay legible.
  - Verified: frontend `npm run lint` clean + `npm run build` green (1852 modules, `dist/index.html` + `assets/` emitted).

### 2026-10-06
- **Mobile header slimming + single-icon theme toggle** — the landing header was cramped on small screens and the theme control was a 3-segment pill.
  - `frontend/src/components/common/ThemeToggle.jsx` is now **one icon button** that cycles System → Light → Dark → System on click (label/tooltip/`aria-label` always name the current *and* next mode). The `compact` prop is gone; the three call sites (`Landing.jsx`, `Navbar.jsx`, `AuthShell.jsx`) now render `<ThemeToggle />`. All three modes remain reachable, so nothing was lost for keyboard/screen-reader users.
  - `frontend/src/features/Landing.jsx` header shrinks on mobile: bar `h-14`/`px-4` (→ `sm:h-16`/`sm:px-6`), logo `h-8` (→ `sm:h-9`), tighter gaps, and the top action buttons (Sign in, Create account, Explore portals, plus the signed-in "Back to …" / sign-out controls) get `max-md:h-8 max-md:px-2.5 max-md:text-xs` via `className` on `Button`, which overrides `size="sm"` at every width below the `md` nav breakpoint. Full size returns at `md`+, and `Explore portals` stays `hidden` under `sm` where there is no room for it.
  - Verified: frontend `npm run lint` clean + `npm run build` green.

### 2026-10-02
- **Registration links, signup fields, and the `/auth/register` surface** — the registration entry point was never a real link: the three auth screens used a `useState` toggle, so there was no `/register` route, nothing was deep-linkable, and the client (firm / "Corporate Gate") section had no registration affordance anywhere.
  - **New signup routes and page**: `/register` (portal picker) and `/register/:role` (`/register/student`, `/register/firm`, `/register/university`), both guest-guarded. New `frontend/src/features/auth/Register.jsx` replaces the in-page toggle — the auth screens are now login-only, so the form boots in a known state and the URL is shareable and refresh-safe. Password gets an 8-char minimum and a confirm field. `frontend/src/config/registration.js` is the new single source of truth pairing each registrable role with its login/register/home paths and accent; `admin` is deliberately absent so admin self-signup is impossible.
  - **Registration links wired into the client section**: `/login/firm` "New here? Join as a partner" → `/register/firm`; the landing header, hero, footer, and every self-serve portal card (Corporate Gate included) now link to signup. The admin card deliberately shows no signup link. The hero's secondary CTA stays "How it works" — the previous "Enter a portal" button was not repurposed away.
  - **Silently-dropped signup fields fixed**: the firm form collected `industrySector` and `contactPerson`, the university form collected `staffId` and `department`, and **none of the four reached the database** — `createAccount` never destructured them and the tables had no columns for them. Added `firms.contact_person`, `universities.staff_id`, `universities.department` via new idempotent migration `db/migrations/0002_signup_fields.sql` (mirrored into `sql/schema.sql` for pg-mem dev and into `0001_init.sql` for fresh builds), and threaded all four through `createAccount`.
  - **Backend hardening**: `POST /auth/register` is now rate limited (10/hour/IP, its own budget separate from `/login`). `registerUser` validates the per-role required field set, so a form can no longer collect input the API quietly throws away. Emails are normalized to lowercase on both write and lookup, closing the duplicate-account hole where `Grace@Lumen.co.ke` and `grace@lumen.co.ke` were distinct accounts.
  - **Dead links removed**: the `href="#"` "Forgot password?" on all three auth screens is replaced with static "Locked out? Ask your admin to reset it." — there is no self-service reset, and `POST /admin/reset-password` already covers it. Raw `<a href>` cross-portal footers on the four auth screens plus `StudentDashboard.jsx` are now react-router `<Link>`s, so they no longer force a full page reload.
  - **Tests**: `backend/test/unit.test.js` grew from 21 to 29 — 6 new covering registration persisting each role's fields, admin self-signup rejection, missing-field rejection writing nothing, case-insensitive duplicate detection, and register→login round-trip; plus a migration test for the new columns. The migration-idempotency test now counts actual files instead of hard-coding 1, and `JWT_SECRET` is defaulted for the runner since CI has no `.env`.
  - Verified: backend `npm test` 29/29; frontend `npm run lint` clean + `npm run build` green. Live pg-mem HTTP smoke against `node server.js` — firm signup with contact person + industry returns 201 with a JWT, immediate login with a mixed-case email succeeds, `role: admin` → 400, firm missing `contactPerson` → 400 with `Missing required field: contactPerson.`, and the 11th signup from one IP returns 429.

### 2026-09-30
- **Phase 4 — Ship it: deployment config for Vercel + Render + Supabase** (config only; nothing is deployed yet):
  - **Render**: root `render.yaml` blueprint — `rootDir: backend`, `nodeVersion: 20.19.0` (in sync with `.nvmrc`), `npm ci` / `npm start`, `healthCheckPath: /readyz`, `autoDeploy`. `NODE_ENV=production`, `LOG_LEVEL`, `JWT_EXPIRES_IN` and a Render-**generated** `JWT_SECRET` are declared inline; `CORS_ORIGIN` + `DATABASE_URL` are `sync: false` so they're prompted for, never committed. `backend/Procfile` added for portability.
  - **Vercel**: `frontend/vercel.json` — Vite preset, `npm ci` / `npm run build`, `outputDirectory: dist`, and `rewrites: /(.*) -> /index.html`. This is required because Vercel ignores `frontend/public/_redirects`, so before this every deep link (`/student`, `/login/firm`) 404'd on refresh. `frontend/.env.example` added documenting that `VITE_API_BASE_URL` is inlined at **build** time.
  - **Supabase**: `npm run db:bootstrap` (`backend/data/bootstrap-db.js`) provisions a fresh managed database from the idempotent `db/migrations/*.sql` — deliberately *not* `sql/schema.sql`, which `DROP TABLE`s. `--seed` inserts demo data only when `students` is empty (`--force-seed` overrides) and prints a row-count summary. Documents the session pooler (5432, not transaction pooler 6543) and the `postgres.<project-ref>` username rule.
  - **Production boot safety**: `NODE_ENV=production` with a missing/unsubstituted `DATABASE_URL` is now **fatal** instead of silently booting a throwaway pg-mem store (which would have served fake, non-persistent data from a live URL). Unset `CORS_ORIGIN` in production logs a loud warning. `createPgPool` TLS is now env-driven: `DATABASE_SSL_CA_FILE` pins the provider CA and turns on chain verification; `DATABASE_SSL_REJECT_UNAUTHORIZED` is an explicit override. Dev default (no CA file) is unchanged.
  - **CI**: `.github/workflows/ci.yml` — backend `npm test` + frontend `lint`/`build` on push and PR to `main`, Node from `.nvmrc`, per-package `npm ci` (no root `package.json`).
  - **Runbook**: `DEPLOYMENT.md` at the repo root (`docs/` is gitignored) — ordered Supabase → Render → Vercel steps, verification checklist, troubleshooting table, pre-launch security notes.
  - Verified: backend `npm test` 21/21; frontend `npm run lint` clean + `npm run build` green (with `VITE_API_BASE_URL` set, mirroring CI); `dist/` contains `index.html`, `assets/`, `favicon.svg`; production boot guard exits 1 with the pg-mem refusal instead of starting; TLS matrix checked across no-CA / CA / CA+opt-out / explicit-on / non-Supabase host; `db:bootstrap` exits 1 with a clear message when `DATABASE_URL` is absent.

### 2026-09-02
- **Phase 3 — Ops hardening** (branch: `feat/phase-3-ops-hardening`):
  - **Graceful shutdown**: `SIGTERM`/`SIGINT` → `server.closeIdleConnections()` + `server.close` drain in-flight requests, then `closeDb()` + exit, with a 10s force-exit backstop so a hung drain can't stall a Render restart.
  - **Health endpoints**: `GET /healthz` (liveness, no DB) and `GET /readyz` (runs `SELECT 1`, 200/503). `GET /` stays as the human-facing info root.
  - **Edge hardening**: `helmet` baseline security headers; `express-rate-limit` on `POST /auth/login` (20/15 min → 429); explicit `express.json({ limit: '100kb' })`; CORS allowlist via `CORS_ORIGIN` unchanged.
  - **Schema lifecycle**: forward-only SQL migration runner with a `schema_migrations` table — `backend/db/migrations/*.sql` applied in filename order, each in a transaction. Runs automatically on boot against real PostgreSQL and via `npm run db:migrate`. Baseline `0001_init.sql` is idempotent and backfills `students.phone`; verified live: migration recorded on Supabase and the `phone` column now exists (the standing manual SQL-Editor ALTER is no longer needed).
  - **Reproducibility**: `engines.node >= 20.19.0` in both `package.json`s; root `.nvmrc` pinned to `20.19.0`.
  - **Observability**: dependency-free structured logger (`utils/logger.js`, one JSON object per line, gated by `LOG_LEVEL`); per-request UUID via `middleware/requestContext.js` with status+duration completion logs; `errorHandler` logs the stack through the logger (prod still hides 5xx detail from clients).
  - Verified: backend `npm test` 21/21 (3 new: migrations build-from-scratch, migration idempotency, requestContext UUID); frontend `npm run lint` + `npm run build` green; pg-mem HTTP smoke — `/healthz`, `/readyz`, helmet headers, API 404 all correct; login rate limiter returns 401×20 then 429.

### 2026-08-31
- **Phase 2 — Harden edges + make it feel finished**: all remaining Phase 2 items landed.
  - **Marketplace data hygiene**: `StudentMarketplace.jsx` drops the hard-coded `studentId: 'std-01'` (the backend derives the student from the JWT anyway) and now sends/renders the consistent `companyName` key. Apply action surfaces a dismissible success/error banner instead of silent `console.error`.
  - **Auth polish**: corrected the student demo hint + email placeholder in `StudentAuth.jsx` from the wrong domain (`alex.kamau@strathmore.edu`) to the real seeded account (`alex.kamau@students.strathmore.edu`); verified all portal demo hints now match `seed.sql`. `Sidebar` logout routes to the role's own login page via a `LOGIN_ROUTES` map (firm/university no longer dumped on the student login).
  - **Data hygiene / semantic tokens**: replaced `text-slate-300` dot separators and `bg-slate-400` pipeline fallbacks with theme-flipping `text-ink-5` / `bg-ink-4` in StudentDashboard, FirmDashboard, UniversityDashboard, AuthShell, Navbar, and Landing. Confirmed all `slate-*` literals that remain live on intentionally-dark `bg-slate-950` panels (sidebar rail, auth brand panel, admin cross-portal section) where they are correct.
  - **Mobile pass confirmed**: drawer nav, responsive grids, `truncate` on long names, native `Select` with custom chevron already in place — no gaps found.
  - Verified: frontend `npm run lint` clean + `npm run build` green; backend `npm test` 18/18; pg-mem HTTP smoke — corrected demo login succeeds and marketplace apply with `companyName` payload returns 201 (`TechCorp Solutions / Cloud Architecture Intern / Pending Review`). **Phase 2 exit criteria met: no view shows hard-coded data (the last fake app banner was removed); flows survive refresh/logout/login.**
  - Branch: `feat/phase-2-hardening`.

### 2026-08-29
- **Student logbook backend + view** (Phase 1 items 2–3): the last `// TODO(real-api)` view is now real.
  - `GET /student/logbooks` (`getMyLogbooks`): the student's weeks newest-first with both sign-off pillars + submitted date; firm attached via LEFT JOIN.
  - `PUT /student/logbooks` (`upsertLogbook`): upserts on `UNIQUE(student_id, week_number)`, sets `firm_sign_off='Pending Review'` on submit/resubmit, locks faculty-approved weeks (400), validates `week_number` (positive integer) + requires `weeklyReflection` and ≥1 daily note; inserts pick `firm_id` from the student's most recent application.
  - `StudentLogBook.jsx` form rebuilt around the real schema (`monday..friday` + `weekly_reflection`), replacing the mock `activities/competencies/challenges/dateRange` fields.
  - **Tests**: 7 new pg-mem-backed integration tests (18 total, was 11) covering ordering, create/resubmit status, week-number + content validation, the faculty-approve lock, and a full student→coordinator-pending→approval round-trip. Also confirms importing controllers is side-effect-safe (lazy-init `db.js`).
  - Verified: backend `npm test` 18/18; frontend `npm run lint` clean + `npm run build` green; pg-mem HTTP smoke (Mary Wanjiru logs week 1 → `GET /university/logbooks/pending` sees it → `PATCH` approves). **All four previously-mocked views now read live DB** — Phase 1 exit criteria met.

### 2026-08-29
- **University audits wired to a new minimal endpoint** (Phase 1 item 3 resolved): added `GET /api/v1/university/audits` (`getAuditLog` in `universityController.js`, scoped to the university, newest first) returning the full compliance ledger — student, reg, firm, week, firm + faculty sign-off, submitted date.
  - `universityService.getAuditLog()`; `UniversityAudits.jsx` now renders live rows (loading skeleton + retryable error state), client-side search across student/firm/status, and shows both sign-off pillars.
  - Deleted orphaned `components/StudentAuditRow.jsx` (dead code from the redesign, never imported; removed its empty dir too).
  - Verified: backend `npm test` 11/11; frontend `npm run lint` clean + `npm run build` green; pg-mem smoke test (login as `registrar@jkuat.ac.ke` → `GET /audits`) returned the seeded entry. All four university views are now real-API.

### 2026-08-29
- **University dashboard wired to real API**: `UniversityDashboard.jsx` now loads via `universityService.getCoordinatorMetrics()` + `getPendingLogbooks()` (`Promise.all`, `MetricSkeleton`/`Skeleton` loading, retryable error state).
  - Metrics cards reflect live `totalEnrolled`/`placedInterns`/`unplacedStudents`/`actionRequiredLogs`; the pending sign-off queue renders real logbook rows with an **Approve** action (`signOffLogbook(id, 'Approved')`, optimistic removal + dismissable error banner), plus a derived review-queue breakdown by stage.
  - Dropped fabricated data: fake student registry, cohort selector, and export ledger (no such endpoints). Second remaining mock dashboard resolved.
  - Verified: `npm run lint` clean; `npm run build` green (4.01s).

### 2026-08-29
- **Student dashboard wired to real API** (removed the last remaining fake-data view): `StudentDashboard.jsx` now loads via `studentService.getMetrics()` + `getApplications()` (`Promise.all`, retry error state via `EmptyState`, `MetricSkeleton` loading).
  - Metrics cards now reflect live `metrics` (`totalApplications`, `interviewsScheduled`, `pendingReview`, `profileCompletion`); applications list renders real `companyName`/`role`/`appliedDate`/`status` with `StatusPill`.
  - Dropped hard-coded mock data: the fake skills track and fake logbook entries. The "Skills in progress" card is gone (no API); the logbook card is an honest `EmptyState` until logbook endpoints land (Phase 1 item 4).
  - Verified: `npm run lint` clean; `npm run build` green (3.08s).

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
> Where each frontend view gets its data today, and the service method behind it.
> **Every view reads the real API** — no `// TODO(real-api)` markers remain in `frontend/src`.

| View | Current source | Service methods in use |
|------|----------------|------------------------|
| `StudentDashboard` | **real API** | `studentService.getMetrics()`, `getApplications()` |
| `StudentMarketplace` | **real API** | `getPlacements()`, `applyForPlacement()` |
| `StudentLogBook` | **real API** | `getLogbooks()`, `upsertLogbook()` |
| `StudentProfile` | **real API** | `getProfile()`, `updateProfile()` |
| `FirmDashboard` | **real API** | `getFirmMetrics()` + `getApplicants()`; `updateApplicantStatus()` for Pass/Shortlist/Place actions |
| `FirmApplicants` | **real API** | `getApplicants()`, `updateApplicantStatus()` |
| `UniversityDashboard` | **real API** | `getCoordinatorMetrics()`, `getPendingLogbooks()`, `signOffLogbook()` |
| `UniversityAudits` | **real API** | `getAuditLog()`, `signOffLogbook()` |
| `AdminDashboard` | **real API** | `adminService.getUsers/createUser/resetPassword/deleteUser` |
| Auth (all portals) | **real API** | `authService.login/register/adminLogin` |
| Signup (`/register/*`) | **real API** | `authService.register()` — new in the 2026-10-02 entry |

## Next Steps
1. **Frontend**: (done) visual redesign, responsive shell, de-jargoned copy — see Data Source Status for API wiring
2. **API wiring**: (done) no mock views remain — every portal reads the real API
3. **Testing**: (done for now) 35 backend integration tests; no frontend test runner
4. **Deployment**: (config written but **uncommitted**) run the live deploy in `DEPLOYMENT.md` — provision Supabase, create the Render blueprint, import into Vercel with `VITE_API_BASE_URL`
5. **Open PRs**: `feat/registration-flow` is pushed but has no PR; Phase 4's files are still only in the working tree, so **CI is not running**
6. **Documentation**: (done) `README.md` + `AGENTS.md` + `DEPLOYMENT.md` + this log
7. **Security**: (config done) `render.yaml` generates `JWT_SECRET`; still to do before launch — rotate seeded passwords, pin the Supabase CA, keep `CORS_ORIGIN` set
8. **Deferred**: no self-service password reset — recovery is admin-assisted via `POST /admin/reset-password`, and the auth screens deliberately omit a "Forgot password?" link until a token + delivery flow exists

## Notes
- Backend runs on port 5000 locally, or `process.env.PORT` when hosted (Render injects it)
- The frontend has **no** Vite dev proxy — `VITE_API_BASE_URL` must point at a running backend and dev CORS is permissive
- Database falls back to pg-mem if `DATABASE_URL` is not set, but that is now **fatal** under `NODE_ENV=production`
- Connected to Supabase via the session pooler (`aws-1-eu-west-1.pooler.supabase.com:5432`); SSL auto-enabled in `backend/data/db.js`, verifiable via `DATABASE_SSL_CA_FILE`
- All backend security issues have been remediated
