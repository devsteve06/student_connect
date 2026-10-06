# Student Connect — Backend API

Express API engine for the Industrial Attachment platform. It serves every endpoint
the React frontend's service layer calls (`frontend/src/service/*`) and is backed by a
**PostgreSQL** schema (`sql/schema.sql` + `sql/seed.sql`).

## Database modes

The data layer (`data/db.js`) is **dual-mode** — the same query code runs either way:

| Mode | When | Behaviour |
|------|------|-----------|
| **In-memory (`pg-mem`)** | `DATABASE_URL` **unset** (default) | Spins up an in-process PostgreSQL, loads `sql/schema.sql` + `sql/seed.sql` on every boot. Zero setup; data resets on restart. Fatal under `NODE_ENV=production`. |
| **Real PostgreSQL (`pg`)** | `DATABASE_URL` **set** | Connects to your server. Schema is applied from `db/migrations/*.sql` automatically on boot. |

### Schema and migrations

`db/migrations/*.sql` are applied in filename order by the runner in
`data/migrations.js`, each in a transaction and recorded in `schema_migrations`,
so re-running is a no-op. Two commands:

```bash
npm run db:migrate                # apply pending migrations
npm run db:bootstrap -- --seed    # provision a fresh empty database, then seed demo data
```

⚠️ Do **not** run `sql/schema.sql` against a database that holds data — it starts
with `DROP TABLE`. It exists for the pg-mem dev path, which never runs migrations.
When adding a column, mirror it into **all three** of `db/migrations/NNNN_*.sql`,
`sql/schema.sql` and `db/migrations/0001_init.sql`.

## Run

```bash
cd backend
npm install
npm run dev      # nodemon, auto-reload
# or: npm start
```

Listens on `http://localhost:5000` (override with `PORT` in `.env`). `JWT_SECRET`
must be set or the server refuses to start — copy `.env.example` to `.env`.

### Point at a real PostgreSQL database

```bash
cd backend
cp .env.example .env       # paste DATABASE_URL into it
npm run db:bootstrap -- --seed
```

`--seed` inserts demo data only when `students` is empty. Existing databases only
need `npm run db:migrate`.

SSL is enabled automatically for Supabase hosts (`db.<ref>.supabase.co` direct, or
`aws-0-<region>.pooler.supabase.com` session pooler). For Supabase, use the **session pooler**
string on IPv4-only networks (the direct host is IPv6-only), keep the `postgres.<project-ref>`
username the pooler requires, and omit any `?sslmode=` param from the URL — `data/db.js`
owns TLS. Chain verification is off unless you point `DATABASE_SSL_CA_FILE` at the
provider's CA bundle (`DATABASE_SSL_REJECT_UNAUTHORIZED` is an explicit override).

## Tests

```bash
npm test
```

29 tests via `node --test`: the logbook submit/sign-off loop and its validation
rules, self-service registration, auth/role middleware, the migration runner,
and error handling. The runner defaults `JWT_SECRET` itself, so no `.env` is
needed.

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

All API routes are mounted under **`/api/v1`** (see `server.js`), including the firm
endpoints (`/api/v1/firm/...`).

### Auth — `/api/v1/auth`
| Method | Path        | Body                                        | Returns            |
|--------|-------------|---------------------------------------------|--------------------|
| POST   | `/register` | see role table below                        | account + JWT      |
| POST   | `/login`    | `{ email, password }`                       | account + JWT      |

Login and register span all three role tables (`students`, `firms`, `universities`).
Emails are stored and matched lowercased. Both endpoints are rate limited per IP —
`/register` at 10/hour, `/login` at 20 per 15 minutes.

| `role` | Required | Optional |
|--------|----------|----------|
| `student` | `name`, `email`, `password`, `regNumber` | `course`, `universityId` |
| `firm` | `companyName`, `contactPerson`, `email`, `password` | `industrySector`, `location` |
| `university` | `name`, `email`, `password`, `staffId` | `department`, `location` |

`admin` is rejected by `/register` — admins are created via `/api/v1/admin/users`.

### Student — `/api/v1/student`
| Method | Path            | Notes                                  |
|--------|-----------------|----------------------------------------|
| GET    | `/metrics`      | dashboard counters                     |
| GET    | `/applications` | applications (joined to firm name)     |
| POST   | `/applications` | `{ companyName, role, appliedDate?, status? }` |
| GET    | `/placements`   | open marketplace vacancies             |

### Firm — `/api/v1/firm`
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
