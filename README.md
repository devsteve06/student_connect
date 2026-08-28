# Student Connect

An Industrial Attachment platform connecting students with firms and universities. Features role-based portals (student, firm, university, admin) with JWT authentication and a PostgreSQL-backed API.

## Architecture

- **Backend**: Express.js API (ES modules) with PostgreSQL — dual-mode: real `pg` or in-memory `pg-mem`
- **Frontend**: React 19 + Vite 8 + Tailwind CSS 4 with role-based dashboards and route guards
- **Auth**: JWT-based with role enforcement via middleware (`protect` + `authorizeRoles`)
- **Database**: 7 tables — universities, students, firms, placements, applications, logbooks, admins

## Project Structure

```
student_connect/
├── backend/              # Express API server
│   ├── server.js         # App bootstrap, CORS, route mounting
│   ├── sql/              # DDL, seed data, migrations
│   ├── data/             # Dual-mode DB pool + auth lookups
│   ├── routes/           # One router per domain
│   ├── controllers/      # SQL-backed request handlers
│   ├── middleware/        # JWT auth, role guard, error handling
│   └── utils/            # Helpers
├── frontend/             # React + Vite application
│   └── src/
│       ├── features/     # Role-specific views (admin, auth, firm, student, university)
│       ├── service/      # API clients (axios with JWT interceptor)
│       ├── route/        # AppRoute, ProtectedRoute, GuestRoute
│       ├── context/      # AuthProvider
│       └── components/   # Shared layouts and UI components
├── docs/                 # System documentation
├── PROGRESS.md           # Development progress tracker
└── README.md             # This file
```

## Prerequisites

- Node.js (v18 or higher recommended)
- npm
- PostgreSQL (optional — the backend falls back to an in-memory pg-mem store if `DATABASE_URL` is not set)

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
| **In-memory (pg-mem)** | `DATABASE_URL` unset (default) | Spins up in-process PostgreSQL, loads schema + seed on every boot. Data resets on restart. |
| **Real PostgreSQL** | `DATABASE_URL` set | Connects to your server. Run the SQL files once first (see below). |

**Using a real PostgreSQL database:**

```bash
createdb student_connect
psql -d student_connect -f backend/sql/schema.sql
psql -d student_connect -f backend/sql/seed.sql
```

Then set `DATABASE_URL` in `backend/.env`.

### Using Supabase as the database

The backend connects to Supabase like any PostgreSQL host — no Supabase SDK required; the existing `pg` data layer and JWT auth are used as-is. SSL is enabled automatically by `backend/data/db.js` for any `*.supabase.co` / `*.pooler.supabase.com` host.

1. **Create the project** at [supabase.com](https://supabase.com) and run `backend/sql/schema.sql`, then `backend/sql/seed.sql`, in the dashboard **SQL Editor**.
2. **Copy a connection string** from *Project Settings → Database → Connect*:
   - **Session pooler** (recommended; works on IPv4 networks):
     `postgresql://postgres.<project-ref>:<PASSWORD>@aws-0-<region>.pooler.supabase.com:5432/postgres`
   - **Direct** host `db.<project-ref>.supabase.co` is **IPv6-only** — it will not resolve on most IPv4-only home/office networks.
3. **Set `DATABASE_URL`** in `backend/.env` with that string.
   - The username must include the project reference: `postgres.<project-ref>` (not just `postgres`) — required by the pooler.
   - Do **not** add `?sslmode=...` to the URL; it overrides the SSL config in `data/db.js`.
4. Start the backend: the startup log must show `Connected to PostgreSQL via DATABASE_URL.` (not the pg-mem message).

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
| `npm run api` | Legacy mock server (json-server on `db.json`) |

### Running Both Together

Start the backend on port 5000, then start the frontend — it will connect to the backend automatically. Do **not** run the backend and the legacy mock server (`npm run api`) at the same time on the same port.

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
| `/login/student` | Guest | Student login |
| `/login/firm` | Guest | Firm login |
| `/login/university` | Guest | University login |
| `/login/admin` | Guest | Admin login |
| `/student` | Student | Student dashboard |
| `/student/marketplace` | Student | Browse placements |
| `/student/logbook` | Student | Logbook |
| `/firm` | Firm | Firm dashboard |
| `/firm/applicants` | Firm | Candidate roster |
| `/university` | University | University dashboard |
| `/university/audits` | University | Logbook audits |

All protected routes redirect unauthenticated users to the appropriate login page. Invalid tokens trigger automatic session cleanup.

## API Endpoints

All routes are mounted under `/api/v1`. Every portal route requires a valid JWT with the matching role.

### Auth — `/api/v1/auth`

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/register` | `{ name, email, password, role, ... }` | Create account + receive JWT |
| POST | `/login` | `{ email, password }` | Authenticate + receive JWT |

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

Runs the built-in `node:test` suite (11 tests covering auth, routes, and validation).

## Documentation

Additional system documentation is available in the `docs/` directory. Project progress is tracked in `PROGRESS.md`.
