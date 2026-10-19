# Plan: Job Postings + Notifications + Closing Lifecycle (Firm Dashboard)

**Status: PLANNED — 0% implemented.** No branch, migration, controller, or UI work exists for this feature yet. See [Current Status](#current-status) at the bottom.

## Decisions

| Decision | Value |
|----------|-------|
| Posting entity | Reuse existing `placements` table (add `status` + `closed_at` columns; it already has `firm_id, role, location, duration, slots, description`) |
| Notification transport | In-app only (new `notifications` table); **polling** for counters (no websockets/SSE in the repo — keep it simple) |
| Counter scope | Unread notification count per user, surfaced on the dashboard + bell in `Navbar.jsx` (replaces today's decorative hard-coded red dot) |
| Auto-notify on posting | On firm create → insert one notification per **eligible student** (all students at the firm's affiliated university; batch insert in one statement) |
| Notify on apply | On `POST /students/applications` → one notification to the posting's firm |
| Close lifecycle | Two paths: (a) **manual** — firm closes its own posting; (b) **automatic** — when the firm sets any application on that posting to `Approved`, the posting closes (no further applications) |
| Closed posting behavior | Students can still see it (marked "Closed"), but `applyForPlacement` rejects with 409; new notifications stop |

## Context (read from repo)

### What exists today
- **`placements` table** — `backend/sql/schema.sql:85–94`: `id, firm_id, role, location, duration, slots, description, created_at`. Read-only for students via `GET /students/placements` (`studentController.js:115–138`). **No firm CRUD, no status column.**
- **`applications` table** — `schema.sql:101–111` with `status CHECK ('Pending Review','Interviewing','Approved','Hired','Rejected')`.
- **Student apply** — `studentController.js:77–113` (`POST /students/applications`), resolves placement by `(firm_id, role)`.
- **Firm status change** — `firmController.js:54–87` (`PATCH /firms/applicants/:id`) — the natural hook for "candidate approved → close posting".
- **Notification bell** — `frontend/src/components/layouts/Navbar.jsx:42–48`: decorative button, hard-coded red dot, no handler, no count. **No `notifications` table exists anywhere.**
- **Firm frontend** — `FirmDashboard.jsx`, `FirmApplicants.jsx`; nav has only "Overview" + "Applicants" (`navigationConfig.jsx:21–24`).
- **Service layer pattern** — axios singleton `apiClient.js` + thin per-domain services (`firmService.js`, `studentService.js`, ...). A `notificationService.js` follows suit.
- **Realtime** — none (no socket.io/SSE). Views fetch on mount + `reloadKey` retry.

### Conventions to obey
- Migrations: idempotent `000X_*.sql` (next free number: **0008**) **and** mirrored into `sql/schema.sql` and `0001_init.sql` (three-place rule).
- Tests: `backend/test/unit.test.js` (pg-mem, direct controller calls with `mockRes()`); the canonical table-list assertion at `unit.test.js:343` must add `notifications`.
- Every change logged in `docs/PROGRESS.md`.

---

## Database Schema Changes

### Migration `0008_job_posting_lifecycle.sql`

**`placements` — add:**
| Column | Type | Notes |
|--------|------|-------|
| status | VARCHAR(20) NOT NULL DEFAULT 'Open' | CHECK `('Open','Closed')` |
| closed_at | TIMESTAMPTZ | nullable; set when closed |

**New table `notifications`:**
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| user_role | VARCHAR(20) NOT NULL | CHECK `('student','firm')` — polymorphic recipient (matches how the app stores role-scoped accounts) |
| user_id | INTEGER NOT NULL | student id or firm id (resolved per `user_role`) |
| type | VARCHAR(40) NOT NULL | `'new_posting'`, `'application_received'`, `'application_update'` (extensible) |
| title | VARCHAR(200) NOT NULL | |
| body | TEXT | |
| link | VARCHAR(200) | frontend route to deep-link (e.g. `/student/marketplace`, `/firm/applicants`) |
| is_read | BOOLEAN NOT NULL DEFAULT false | unread = counter source |
| created_at | TIMESTAMPTZ DEFAULT NOW() | |

Indexes: `idx_notifications_user` on `(user_role, user_id, is_read)`, `idx_placements_status` on `(firm_id, status)`.

> Note on `user_role`+`user_id` polymorphism: acceptable here because both `students` and `firms` tables are stable and small; keep FKs out (or add two nullable FK columns `student_id` / `firm_id` with a CHECK that exactly one is set — **preferred for integrity**; decide at implementation time, default = two nullable FKs).

---

## Backend API

### Firm routes (`firmRoutes.js`, `authorizeRoles('firm')`)
| Method | Path | Controller | Purpose |
|--------|------|-----------|---------|
| GET | `/firms/placements` | `listPlacements` | Firm's own postings with live applicant counts + status |
| POST | `/firms/placements` | `createPlacement` | Create posting (`Open`), then batch-insert `new_posting` notifications to eligible students |
| PATCH | `/firms/placements/:id` | `updatePlacement` | Edit an `Open` posting |
| PATCH | `/firms/placements/:id/close` | `closePlacement` | Manual close: set `status='Closed'`, `closed_at=NOW()` |
| GET | `/firms/notifications` | `listNotifications` | Firm's notifications, newest first |
| GET | `/firms/notifications/unread-count` | `getUnreadCount` | Integer for badge |

### Student routes (`studentRoutes.js`, `authorizeRoles('student')`)
| Method | Path | Controller | Purpose |
|--------|------|-----------|---------|
| GET | `/students/notifications` | `listNotifications` | Student's notifications |
| GET | `/students/notifications/unread-count` | `getUnreadCount` | Integer for badge |
| PATCH | `/students/notifications/:id/read` | `markRead` | Mark one read |
| PATCH | `/students/notifications/read-all` | `markAllRead` | Clear badge |

### Modifications to existing controllers
1. **`studentController.applyForPlacement`** —
   - Reject with **409** if placement `status = 'Closed'`.
   - After successful insert: create `application_received` notification for the placement's firm (include student name + role).
2. **`firmController.updateApplicantStatus`** —
   - After a status change: create `application_update` notification for the applicant student.
   - **If new status = `'Approved'`** and the application has a `placement_id`: auto-close that placement (`status='Closed'`, `closed_at=NOW()`) if still `Open`, and (optional) notify other applicants that the posting is closed.
3. **`studentController.getPlacements`** — return `status` so the marketplace can grey out closed postings.

### Eligibility for `new_posting` fan-out
All students whose `university_id` equals the firm's `university_id` (the affiliation model from the registration work). One `INSERT ... SELECT` statement — no N+1.

---

## Frontend

### New service `src/service/notificationService.js`
`getUnreadCount()`, `list()`, `markRead(id)`, `markAllRead()` — role-aware paths (student vs firm), following `firmService.js` style.

### Navbar (`components/layouts/Navbar.jsx`)
- Replace decorative bell with live badge: fetch unread count on mount + on route change (polling every 60s as fallback).
- Click → dropdown listing notifications, "Mark all as read", deep links.

### Firm views
- **New `features/firm/views/FirmPostings.jsx`** — table of the firm's postings: role, location, slots, applicants, status badge (Open/Closed), actions (Edit, **Close posting**), plus a **"New posting"** form/modal (role, location, duration, slots, description).
- **`FirmDashboard.jsx`** — add "New posting" quick action; applications list gains notification-driven highlight; when firm approves a candidate, show toast "Candidate approved — posting closed".
- **`navigationConfig.jsx`** — add "Postings" nav item for firm role.

### Student views
- **`StudentMarketplace.jsx`** — closed postings rendered disabled with "Closed" badge; `handleApply` surfaces the 409 message; applying triggers firm notification server-side.
- **`StudentDashboard.jsx`** — notification counter widget reflecting unread `new_posting` / `application_update` items.

---

## Testing

- pg-mem controller tests in `backend/test/unit.test.js`:
  - create placement → row `Open` + N notifications inserted for affiliated-university students;
  - apply to `Open` placement → firm gets `application_received` notification; apply to `Closed` → 409, no notification;
  - approve application → placement becomes `Closed`, `closed_at` set; second approval is a no-op for closing;
  - unread-count endpoints return correct integers; `read-all` zeroes the count;
  - migration test: add `notifications` to the canonical table-list assertion (`unit.test.js:343`) and assert `placements.status` exists.
- Frontend: `eslint` + `vite build` only (no FE test framework — per `docs/IMPROVEMENT_PLAN.md`).

---

## Phases (with exit criteria)

| Phase | Work | Exit criteria |
|-------|------|---------------|
| **1. Schema** | Migration `0008`, mirror into `schema.sql` + `0001_init.sql` | `npm test` green; table assertion updated |
| **2. Notifications core** | notification endpoints (student + firm), service, Navbar badge | Badge shows live count in dev |
| **3. Firm posting CRUD** | placements endpoints + FirmPostings view + nav | Firm can create/edit/close a posting |
| **4. Event wiring** | fan-out on create; notify firm on apply; 409 on closed apply | End-to-end flow works via API |
| **5. Close lifecycle** | manual close + auto-close on `Approved` + student-side "Closed" UI | Approving a candidate closes the posting everywhere |
| **6. Polish + docs** | toasts, empty states, `docs/PROGRESS.md` entries, lint/build | CI green |

---

## Current Status

**Status: PLANNED — not started (0/6 phases complete).**

Verified against the repo on branch `feat/gateway-naming`:

- ✅ Plan document written (`JOB_POSTING_PLAN.md`) — this file.
- ❌ No migration, no `notifications` table, no `status` column on `placements`.
- ❌ No backend endpoints for posting CRUD or notifications (grep for `notif|posting|close` in backend controllers: zero relevant hits).
- ❌ No `notificationService.js`, no firm "Postings" view, nav entry, or real badge (bell in `Navbar.jsx` is decorative with a hard-coded dot).
- ❌ No realtime transport and no polling in place — counters will use on-mount + interval polling.
- ⚠️ Note: there is unrelated uncommitted CV-builder work in the working tree; this feature should start on a **fresh branch** (e.g. `feat/job-postings`) after that work is committed/PR'd, to keep changes reviewable.
