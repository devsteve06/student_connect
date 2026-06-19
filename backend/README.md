# Student Connect — Backend API

Express API engine for the Industrial Attachment platform. It serves every endpoint
the React frontend's service layer calls (`frontend/src/service/*`) and is backed by a
**PostgreSQL** schema (`sql/schema.sql` + `sql/seed.sql`).

## Database modes

The data layer (`data/db.js`) is **dual-mode** — the same query code runs either way:

| Mode | When | Behaviour |
|------|------|-----------|
| **In-memory (`pg-mem`)** | `DATABASE_URL` **unset** (default) | Spins up an in-process PostgreSQL, loads `sql/schema.sql` + `sql/seed.sql` on every boot. Zero setup; data resets on restart. |
| **Real PostgreSQL (`pg`)** | `DATABASE_URL` **set** | Connects to your server. Run `sql/schema.sql` + `sql/seed.sql` against it once first. |

## Run

```bash
cd backend
npm install
npm run dev      # nodemon, auto-reload
# or: npm start
```

Listens on `http://localhost:5000` (override with `PORT` in `.env`). This replaces the old
`frontend/mock-server.cjs` (json-server) — run **one or the other** on the same port, not both.

### Point at a real PostgreSQL database

```bash
createdb student_connect
psql -d student_connect -f sql/schema.sql
psql -d student_connect -f sql/seed.sql
# then in .env:
# DATABASE_URL=postgresql://user:password@localhost:5432/student_connect
```

## Demo accounts

Seeded by `sql/seed.sql`. Every account's password is **`password123`**:

| Role       | Login                                   | Password     |
|------------|-----------------------------------------|--------------|
| admin      | `sysadmin` (username)                   | `theadmin`   |
| student    | `alex.kamau@students.strathmore.edu`    | `password123`|
| firm       | `careers@nexuslabs.io`                  | `password123`|
| university | `registrar@jkuat.ac.ke`                 | `password123`|

(5 of each non-admin role are seeded — see `sql/seed.sql` for the full list.)

## API

The frontend calls student/university routes under `/api/v1/...` and firm routes under
`/firm/...`. The router is mounted at **both** `/api/v1` and `/`, so either prefix works.

### Auth — `/api/v1/auth`
| Method | Path        | Body                                        | Returns            |
|--------|-------------|---------------------------------------------|--------------------|
| POST   | `/register` | `{ name, email, password, role, regNumber?, companyName?, course?, location? }` | account + JWT |
| POST   | `/login`    | `{ email, password }`                       | account + JWT      |

Login and register span all three role tables (`students`, `firms`, `universities`).

### Student — `/api/v1/student`
| Method | Path            | Notes                                  |
|--------|-----------------|----------------------------------------|
| GET    | `/metrics`      | dashboard counters                     |
| GET    | `/applications` | applications (joined to firm name)     |
| POST   | `/applications` | `{ companyName, role, appliedDate?, status? }` |
| GET    | `/placements`   | open marketplace vacancies             |

### Firm — `/firm` (also `/api/v1/firm`)
| Method | Path             | Notes                          |
|--------|------------------|--------------------------------|
| GET    | `/metrics`       | corporate dashboard counters   |
| GET    | `/applicants`    | candidate roster (joined)      |
| PATCH  | `/applicants/:id`| `{ status }`                   |

### University — `/api/v1/university`
| Method | Path                | Notes                          |
|--------|---------------------|--------------------------------|
| GET    | `/metrics`          | institutional analytics        |
| GET    | `/logbooks/pending` | logbooks awaiting sign-off     |
| PATCH  | `/logbooks/:id`     | `{ facultySignOff }`           |

### Admin — `/api/v1/admin`  🔒 admin only
Absolute access across the platform. Every route requires
`Authorization: Bearer <token>` from an account with the `admin` role.
Log in via `/auth/login` with **username `sysadmin`** and password **`theadmin`**.

| Method | Path                  | Body / Notes                                   |
|--------|-----------------------|------------------------------------------------|
| GET    | `/users`              | list every account across all role tables      |
| POST   | `/users`              | `{ role, name, email, password, ... }` — create any account (incl. admin via `{ role:'admin', username, password }`) |
| POST   | `/reset-password`     | `{ role, id, newPassword }` — reset any party's password |
| DELETE | `/users/:role/:id`    | delete any account (cannot delete self)        |

`role` is one of `admin`, `student`, `firm`, `university`. Non-admins receive `403`;
missing/invalid tokens receive `401`.

## Schema

Seven tables (`sql/schema.sql`), seeded with 1 admin, 5 universities, 5 firms,
5 students plus placements, applications, and logbooks (`sql/seed.sql`):

```
admins (standalone — system administrators)

universities ──┐
               ├─< students ──< applications >── firms ──< placements
               │                    │                         │
               └────────────────────┴──< logbooks >───────────┘
```

> Already have a `studentConnectDB` from the original `schema.sql`/`seed.sql`?
> Add the admin table without wiping data: `psql -d studentConnectDB -f sql/migrate_admins.sql`

## Structure

```
backend/
├── server.js                 # app bootstrap, CORS, route mounting, initDb()
├── sql/
│   ├── schema.sql            # DDL (PostgreSQL)
│   └── seed.sql              # 5 universities / firms / students + related rows
├── data/
│   ├── db.js                 # dual-mode pool: real pg | seeded pg-mem
│   └── accounts.js           # auth lookups across the three role tables
├── routes/                   # one router per domain + index aggregator
├── controllers/              # SQL-backed request handlers
├── middleware/               # auth (JWT + role guard) + error/404 handlers
└── utils/format.js           # date formatting helpers
```

`protect` and `authorizeRoles(...)` in `middleware/authMiddleware.js` are ready to guard
routes once the frontend starts sending the `Authorization: Bearer <token>` header.
