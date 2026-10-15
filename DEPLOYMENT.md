# Deployment Runbook — Vercel + Render + Supabase

Production topology for Student Connect. Three services, one repo, no root
`package.json` — the backend and frontend are independent npm packages.

| Piece | Host | Runs from | Notes |
|---|---|---|---|
| REST API (`/api/v1`) | **Render** (web service) | `backend/` | `render.yaml` blueprint, Node 20.19.0 |
| React SPA | **Vercel** (static build) | `frontend/` | `frontend/vercel.json`, Vite build → `dist/` |
| PostgreSQL | **Supabase** | — | session pooler (port 5432), migrations on boot |

```
Vercel (SPA, https)  ──HTTPS /api/v1──>  Render (Express, https)
                                              │
                                       TCP 5432 (TLS)
                                              ▼
                                   Supabase (PostgreSQL, eu-west-1)
```

Deployment order matters: **Supabase → Render → Vercel**. The frontend needs the
Render URL (`VITE_API_BASE_URL`) and Render needs the Vercel URL (`CORS_ORIGIN`),
so each host must exist before the next is configured. Start with a permissive
CORS value, then tighten it once you have the real Vercel URL.

---

## 1. Supabase — provision the database

1. Create a project at <https://supabase.com/dashboard>. Pick the region closest
   to your Render region (`render.yaml` defaults to `oregon`; change both if you
   prefer, e.g. `frankfurt` + a Supabase EU project).
2. Copy the **Session pooler** connection string from
   **Project Settings → Database → Connection string → URI**. It looks like:
   ```
   postgresql://postgres.<project-ref>:<PASSWORD>@aws-0-<region>.pooler.supabase.com:5432/postgres
   ```
   - Use the **session pooler**, not the transaction pooler (Supavisor port 6543):
     the app holds a single long-lived pool and prepared statements break on the
     transaction pooler.
   - The username **must** include the project ref after the dot.
   - The direct host `db.<project-ref>.supabase.co` is IPv6-only; Render has IPv4.
   - **Do not append `?sslmode=…`** — `backend/data/db.js` owns the TLS config.
3. Create the schema, and (optionally) demo data, from your machine:
   ```bash
   cd backend
   cp .env.example .env        # paste the pooler URI into DATABASE_URL
   npm install
   npm run db:bootstrap -- --seed
   ```
   `db:bootstrap` applies `db/migrations/*.sql` (all statements are
   `IF NOT EXISTS`, so it is safe to re-run and never drops data — unlike
   `sql/schema.sql`). `--seed` inserts demo data **only if `students` is empty**.
   It prints a row-count summary when it finishes.
4. (Recommended) Download the Supabase CA certificate
   (**Connect → SSL certificate → Download**) and keep it for step 2.

---

## 2. Render — deploy the API

1. **New → Blueprint**, then connect the `student_connect` repository. Render reads
   the committed `render.yaml` and creates `student-connect-api`.
2. Render prompts for the two `sync: false` values:
   - `DATABASE_URL` — the Supabase session pooler URI from step 1.
   - `CORS_ORIGIN` — the Vercel app URL, e.g.
     `https://student-connect.vercel.app`. Comma-separate for preview URLs:
     `https://student-connect.vercel.app,https://student-connect-git-main-yourname.vercel.app`
3. Everything else comes from the blueprint: `NODE_ENV=production`, a
   Render-generated `JWT_SECRET`, `healthCheckPath: /readyz`, `rootDir: backend`.
4. Deploy. Watch the build log for `Connected to PostgreSQL via DATABASE_URL.` —
   if you instead see the pg-mem banner, `DATABASE_URL` is unset or still an
   unsubstituted `${{ … }}` template.
5. Verify: `https://student-connect-api.onrender.com/healthz` → `{"status":"ok"}`
   and `/readyz` → `{"status":"ready"}`.

**Free tier caveat:** the free plan sleeps after ~15 minutes of inactivity, so the
first request after a quiet period takes roughly 30–60 s (cold start). Set
`plan: starter` in `render.yaml` if the demo needs to be snappy.

**Optional: pin the Supabase CA.** By default the DB link accepts the provider
certificate without chain verification (fine for a demo, flagged in the logs).
To verify it properly, commit the PEM as `backend/certs/SupabaseCA.crt` and set
`DATABASE_SSL_CA_FILE=/opt/render/project/src/backend/certs/SupabaseCA.crt` in
the Render dashboard.

---

## 3. Vercel — deploy the SPA

1. **Add New → Project**, import the same repository.
2. **Root Directory: `frontend`** (required — the repo has no root `package.json`).
   The framework preset is detected as Vite; `frontend/vercel.json` supplies
   `installCommand`, `buildCommand`, `outputDirectory: dist` and the SPA rewrite.
3. **Settings → Environment Variables**, add for **all** environments:
   ```
   VITE_API_BASE_URL = https://student-connect-api.onrender.com
   ```
   No trailing slash, no `/api/v1` — `apiClient.js` appends the versioned paths.
4. Deploy. Vite inlines `import.meta.env.*` **at build time**, so the variable
   must exist before the build runs; changing it later requires a redeploy.
5. Verify: open the URL, log in, and confirm the Network tab shows requests to
   the Render host. Deep-link straight to `/login/firm` — it must not 404
   (that is what the `rewrites` rule is for).

### Local dev parity

```bash
cd frontend && cp .env.example .env   # optional; http://localhost:5000 is the default
npm run dev
```
There is no Vite dev proxy — `VITE_API_BASE_URL` must point at a running
backend, and the API is CORS-permissive in development.

---

## 4. Demo credentials (seeded only)

| Portal | Identifier | Password |
|---|---|---|
| Student / firm / university | any seeded email (`alex.kamau@students.strathmore.edu`, `hr@techcorp.io`, `registrar@strathmore.edu`, …) | `password123` |
| Admin | `sysadmin` (username, not email) | `theadmin` |

Change or remove these before any real deployment.

---

## 5. Verification checklist

- [ ] `GET /healthz` and `GET /readyz` both 200 on Render
- [ ] `POST /api/v1/auth/login` succeeds for all four roles
- [ ] Signup works end to end: open `/register/firm` deep-linked, submit a firm, land on `/firm`; repeat for `/register/student` and `/register/university`
- [ ] Signup rejects an admin (`POST /api/v1/auth/register` with `role: admin` → 400) and the 11th signup from one IP returns 429
- [ ] Student applies to a placement → firm changes the application status
- [ ] Student submits a logbook week → firm signs off → university signs off
- [ ] Admin CRUD works (`/admin`)
- [ ] Deep links (`/student`, `/login/university`, `/register`) survive a hard refresh
- [ ] No request in the browser Network tab points at `localhost`
- [ ] Render logs show no `CORS_ORIGIN is not set` warning

> The demo accounts are seeded, so you do **not** need signup to walk the 4 roles.
> Signup is only there to prove the self-service path works against the live database.

---

## 6. Shipping an update

Push to `main`. CI (`.github/workflows/ci.yml`) runs `backend: npm test` and
`frontend: lint + build`; Render and Vercel both auto-deploy from `main`.
Backend schema changes go in `backend/db/migrations/NNNN_name.sql` and are
applied automatically on the next Render boot.

⚠️ **As of 2026-10-02 none of Phase 4 is committed yet**, so the CI workflow does
not exist in git and nothing auto-deploys. Commit `render.yaml`,
`frontend/vercel.json`, `backend/Procfile`, `backend/data/bootstrap-db.js`,
`DEPLOYMENT.md` and `.github/workflows/ci.yml` to `main` before relying on any of
this section. New columns (`0002_signup_fields.sql`) self-apply on the first boot
against the live database — no manual SQL step.

---

## 7. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| SPA shows the API's "Operational" text or 404 on refresh | `rewrites` not applied | Confirm Vercel Root Directory is `frontend` |
| Every request goes to `localhost:5000` | `VITE_API_BASE_URL` missing at build time | Set it, then redeploy (Vite inlines it) |
| Boot log says pg-mem in production | `DATABASE_URL` unset/unsubstituted | Set it on the Render service; restart |
| `Origin … not allowed by CORS policy` | `CORS_ORIGIN` mismatch | Must match the scheme + host exactly, no trailing slash |
| Login 429 | Login rate limit (20 / 15 min) | Expected; wait or use a different egress IP |
| Signup 429 | Register rate limit (10 / hour) | Expected; wait an hour or use a different egress IP |
| Render restarts the service | `/readyz` returned 503 | Check the DB is reachable and migrations succeeded |
| Connection hangs from Render | Transaction pooler (6543) or direct host | Use the session pooler on 5432 |

---

## 8. Pre-launch security notes

- Rotate the seeded passwords and the `sysadmin` account.
- `render.yaml` generates `JWT_SECRET` for you — never commit a real one.
- Keep `CORS_ORIGIN` set; an unset value makes the API reflect any origin.
- Pin the Supabase CA (`DATABASE_SSL_CA_FILE`) for a verified TLS chain.
- Supabase's free tier pauses idle projects; a paused DB will fail `/readyz` and
  Render will restart-loop until the project is resumed.
