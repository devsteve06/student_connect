# Student Connect

An Industrial Attachment platform connecting students with firms and universities. Features role-based portals (student, firm, university, admin) with JWT authentication and a PostgreSQL-backed API.

## Architecture

- **Backend**: Express.js API (ES modules) with PostgreSQL — dual-mode: real `pg` or in-memory `pg-mem`
- **Frontend**: React 19 + Vite 8 + Tailwind CSS 4 with role-based dashboards and route guards
- **Auth**: JWT-based with role enforcement via middleware (`protect` + `authorizeRoles`)
- **Database**: 7 tables — universities, students, firms, placements, applications, logbooks, admins

## Project Status

As of **2026-10-02**:

| | State |
|---|---|
| Feature work (Phases 1–3) | Complete and merged to `main` |
| Signup hardening (`/register*`) | Complete, on `feat/registration-flow` — **no PR opened yet, not on `main`** |
| Deploy config + CI (Phase 4) | Written but **uncommitted** — so **CI is not running** and nothing is deployed |
| Live deploy | Not started — no Supabase project, Render service or Vercel project exists |
| Tests | 29 backend (`npm test`), no frontend test runner |

The only substantive work left is the live deploy. `AGENTS.md` tracks the
committed-vs-uncommitted split in detail; `docs/IMPROVEMENT_PLAN.md` has the roadmap.

**Known gap:** there is no self-service password reset. Recovery goes through an
admin (`POST /api/v1/admin/reset-password`), and the sign-in screens deliberately
omit a "Forgot password?" link until a token + delivery flow exists.

## Project Structure

```
student_connect/
├── backend/              # Express API server
│   ├── server.js         # App bootstrap, CORS, route mounting
│   ├── db/migrations/    # Forward-only SQL migrations (applied on boot)
│   ├── sql/              # schema.sql (pg-mem dev) + seed.sql demo data
│   ├── data/             # Dual-mode DB pool, migrations runner, auth lookups
│   ├── routes/           # One router per domain
│   ├── controllers/      # SQL-backed request handlers
│   ├── middleware/        # JWT auth, role guard, error handling
│   └── utils/            # Helpers
├── frontend/             # React + Vite application
│   └── src/
│       ├── features/     # Role-specific views (admin, auth, firm, student, university)
│       ├── config/       # roleTheme.js (accents), registration.js (signup paths)
│       ├── service/      # API clients (axios with JWT interceptor)
│       ├── route/        # AppRoute, ProtectedRoute, GuestRoute
│       ├── context/      # AuthProvider
│       └── components/   # Shared layouts and UI components
├── docs/                 # PROGRESS.md, IMPROVEMENT_PLAN.md
├── AGENTS.md             # Commands, architecture quirks, current standing
├── DEPLOYMENT.md         # Supabase → Render → Vercel runbook
└── README.md             # This file
```

## Prerequisites

- **Node.js 20.19.0 or newer** (pinned in `.nvmrc` and enforced via `engines` in both packages)
- npm
- PostgreSQL — *optional for development* (the backend falls back to an in-memory pg-mem store when `DATABASE_URL` is unset), but **required** when `NODE_ENV=production`

## Getting Started

### 1. Backend

```bash
cd backend
cp .env.example .env     # then edit .env — see Environment Variables below
npm install
npm run dev              # starts with nodemon (auto-reload)
# or: npm start
```

The server listens on `http://localhost:5000` by default.

> **Note:** The backend requires `JWT_SECRET` to be set — it will refuse to start without it.

**Database modes:**

| Mode | When | Behavior |
|------|------|----------|
| **In-memory (pg-mem)** | `DATABASE_URL` unset (default) | Spins up in-process PostgreSQL, loads schema + seed on every boot. Data resets on restart. **Fatal under `NODE_ENV=production`.** |
| **Real PostgreSQL** | `DATABASE_URL` set | Connects to your server. `db/migrations/*.sql` are applied automatically on boot. |

**Using a real PostgreSQL database:**

```bash
cd backend
npm run db:bootstrap -- --seed   # idempotent migrations + demo data
```

`--seed` fills demo data only when `students` is empty. An existing database just needs `npm run db:migrate`.

> ⚠️ Do **not** run `backend/sql/schema.sql` against a database that holds data — it starts with `DROP TABLE`. It exists only for the pg-mem dev path, which never runs migrations.

Then set `DATABASE_URL` in `backend/.env`.

### Using Supabase as the database

The backend connects to Supabase like any PostgreSQL host — no Supabase SDK required; the existing `pg` data layer and JWT auth are used as-is. SSL is enabled automatically by `backend/data/db.js` for any `*.supabase.co` / `*.pooler.supabase.com` host.

1. **Create the project** at [supabase.com](https://supabase.com), then provision it from your machine — paste the pooler URI below into `backend/.env`, then run `npm run db:bootstrap -- --seed`. Do **not** paste `sql/schema.sql` into the Supabase **SQL Editor**.
2. **Copy a connection string** from *Project Settings → Database → Connect*:
   - **Session pooler** (recommended; works on IPv4 networks):
     `postgresql://postgres.<project-ref>:<PASSWORD>@aws-0-<region>.pooler.supabase.com:5432/postgres`
   - **Direct** host `db.<project-ref>.supabase.co` is **IPv6-only** — it will not resolve on most IPv4-only home/office networks.
3. **Set `DATABASE_URL`** in `backend/.env` with that string.
   - The username must include the project reference: `postgres.<project-ref>` (not just `postgres`) — required by the pooler.
   - Do **not** add `?sslmode=...` to the URL; it overrides the SSL config in `data/db.js`.
4. Start the backend: the startup log must show `Connected to PostgreSQL via DATABASE_URL.` (not the pg-mem message), and the pending-migration lines confirm the schema is current.

Full production runbook: **[`DEPLOYMENT.md`](DEPLOYMENT.md)**.

### 2. Frontend

```bash
cd frontend
cp .env.example .env     # if one exists, or create frontend/.env
npm install
npm run dev
```

The dev server runs on `http://localhost:5173`. It connects to the backend via `VITE_API_BASE_URL` (defaults to `http://localhost:5000`).

**Available scripts:**

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

### Running Both Together

Start the backend on port 5000, then start the frontend — it will connect to the backend automatically.

## Demo Accounts

Every seeded account uses password **`password123`** (admin password is **`theadmin`**):

| Role | Login | Password |
|------|-------|----------|
| admin | `sysadmin` (username) | `theadmin` |
| student | `alex.kamau@students.strathmore.edu` | `password123` |
| firm | `careers@nexuslabs.io` | `password123` |
| university | `registrar@jkuat.ac.ke` | `password123` |

Five of each non-admin role are seeded. See `backend/sql/seed.sql` for the full list.

## Frontend Routes

| Path | Access | Description |
|------|--------|-------------|
| `/` | Public | Landing page — portal cards + signup CTA |
| `/login/student` | Guest | Student login |
| `/login/firm` | Guest | Firm login |
| `/login/university` | Guest | University login |
| `/login/admin` | Guest | Admin login |
| `/register` | Guest | Signup — pick a portal |
| `/register/student` | Guest | Student signup |
| `/register/firm` | Guest | Firm ("Corporate Gate") signup |
| `/register/university` | Guest | University staff signup |
| `/student` | Student | Student dashboard |
| `/student/marketplace` | Student | Browse placements |
| `/student/logbook` | Student | Logbook |
| `/student/profile` | Student | Profile |
| `/firm` | Firm | Firm dashboard |
| `/firm/applicants` | Firm | Candidate roster |
| `/university` | University | University dashboard |
| `/university/audits` | University | Logbook audits |
| `/admin` | Admin | Admin control plane |

All protected routes redirect unauthenticated users to the appropriate login page. Invalid tokens trigger automatic session cleanup. The `/login/*` screens are **login-only** — signup lives at `/register*` so the URL is shareable and survives a refresh. There is no `/register/admin`: admin accounts are created by an existing admin.

## API Endpoints

All routes are mounted under `/api/v1`. Every portal route requires a valid JWT with the matching role.

### Auth — `/api/v1/auth`

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/register` | `{ role, email, password, ...roleFields }` | Create account + receive JWT (10/hour/IP) |
| POST | `/login` | `{ email, password }` | Authenticate + receive JWT (20/15min/IP) |

Role-specific registration fields, all validated and persisted:

| `role` | Required | Optional |
|--------|----------|----------|
| `student` | `name`, `email`, `password`, `regNumber` | `course`, `universityId` |
| `firm` | `companyName`, `contactPerson`, `email`, `password` | `industrySector`, `location` |
| `university` | `name`, `email`, `password`, `staffId` | `department`, `location` |

`admin` cannot self-register — admin accounts are provisioned through `POST /api/v1/admin/users` or `POST /api/v1/admin/reset-password`.

### Student — `/api/v1/student` (student only)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/metrics` | Dashboard counters |
| GET | `/applications` | User applications (joined to firm name) |
| POST | `/applications` | Create application |
| GET | `/placements` | Open marketplace vacancies |

### Firm — `/api/v1/firm` (firm only)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/metrics` | Corporate dashboard counters |
| GET | `/applicants` | Candidate roster (joined) |
| PATCH | `/applicants/:id` | Update applicant status `{ status }` |

### University — `/api/v1/university` (university only)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/metrics` | Institutional analytics |
| GET | `/logbooks/pending` | Logbooks awaiting sign-off |
| PATCH | `/logbooks/:id` | Faculty sign-off `{ facultySignOff }` |

### Admin — `/api/v1/admin` (admin only)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/users` | List every account across all role tables |
| POST | `/users` | Create any account (roles: `admin`, `student`, `firm`, `university`) |
| POST | `/reset-password` | Reset any party's password `{ role, id, newPassword }` |
| DELETE | `/users/:role/:id` | Delete account (cannot delete self) |

Non-admins receive `403`. Missing or invalid tokens receive `401`.

## Database Schema

Seven tables seeded with 1 admin, 5 universities, 5 firms, 5 students, plus placements, applications, and logbooks:

```
admins (standalone — system administrators)

universities ──┐
               ├─< students ──< applications >── firms ──< placements
               │                    │                         │
               └────────────────────┴──< logbooks >───────────┘
```

- `backend/sql/schema.sql` — full DDL
- `backend/sql/seed.sql` — demo data
- `backend/sql/migrate_admins.sql` — add admin table to existing databases without wiping data

## Environment Variables

### Backend (`backend/.env`)

Copy `backend/.env.example` to get started.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | **Yes** | — | JWT signing secret. Server refuses to start without it. Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `PORT` | No | 5000 | Server port |
| `NODE_ENV` | No | development | `development` or `production` |
| `DATABASE_URL` | No | (uses pg-mem) | PostgreSQL connection string |
| `CORS_ORIGIN` | No | (permissive) | Comma-separated allowlist of browser origins |
| `JWT_EXPIRES_IN` | No | 7d | JWT token lifetime (e.g. `1d`, `12h`, `7d`) |

### Frontend (`frontend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE_URL` | No | `http://localhost:5000` | Backend API base URL |

## Running Tests

```bash
cd backend
npm test
```

Runs the built-in `node:test` suite — **29 tests** covering the logbook submit/sign-off loop and its validation rules, self-service registration (per-role field persistence, admin rejection, case-insensitive duplicate detection, register→login round-trip), the auth/role middleware, the migration runner, and error handling.

## Documentation

- `AGENTS.md` (repo root) — commands, architecture quirks, and what's committed vs still uncommitted.
- `DEPLOYMENT.md` (repo root) — the Supabase → Render → Vercel runbook.
- `docs/PROGRESS.md` — dated changelog of every meaningful change, newest first.
- `docs/IMPROVEMENT_PLAN.md` — the phase roadmap and current standing.
