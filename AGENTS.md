# AGENTS.md

Student Connect: Industrial Attachment platform (students ↔ firms ↔ universities ↔ admins). Monorepo of two independent npm packages — **no root `package.json`**; run every command from `backend/` or `frontend/`.

## Commands

Backend (`backend/`):
- `npm run dev` — nodemon server; `npm start` — plain node.
- `npm test` — the only test suite (`node --test`, 29 tests in `test/unit.test.js`). No backend lint/typecheck. The runner defaults `JWT_SECRET` itself (CI has no `.env`), so auth tests work unattended.
- `npm run db:migrate` — apply pending `db/migrations/*.sql`. `npm run db:bootstrap [-- --seed]` — provision a fresh managed DB (schema is idempotent; `--seed` only fills an empty `students` table).
- Server refuses to start without `JWT_SECRET` set (`server.js:15`). Copy `.env.example` → `.env`.

Frontend (`frontend/`):
- `npm run dev` (port 5173), `npm run lint` (ESLint), `npm run build` (Vite production build → `dist/`).
- No tests and no typecheck (plain JS, no TS).

## Database dual-mode gotcha

`backend/data/db.js` is dual-mode: `DATABASE_URL` set → real PostgreSQL (`pg`); unset → in-memory `pg-mem` seeded from `sql/schema.sql` + `sql/seed.sql` (data resets each boot). Controllers call a shared `query(text, params)` so code is DB-agnostic. Boot log says which mode: `Connected to PostgreSQL via DATABASE_URL.` vs the pg-mem line.

- **Production safety rail**: with `NODE_ENV=production` a missing *or unsubstituted* (`${{ … }}`) `DATABASE_URL` is **fatal** — the pg-mem fallback is dev-only, so a live URL can never silently serve disposable fake data.
- Columns that older databases were missing are handled automatically by the boot-time migration runner, never by hand in the Supabase SQL Editor. `0001_init.sql` backfills `students.phone`; `0002_signup_fields.sql` adds `firms.contact_person`, `universities.staff_id` and `universities.department`. Every file is idempotent (`IF NOT EXISTS`), so a re-run is a no-op. When you add a column, mirror it into **all three** places: `db/migrations/NNNN_*.sql` (real PostgreSQL), `sql/schema.sql` (pg-mem dev — migrations never run there), and `0001_init.sql` (fresh builds). Do **not** run `sql/schema.sql` against a database holding data — it `DROP TABLE`s; use `npm run db:bootstrap`.
- Supabase specifics: use the **session pooler** string (`aws-0-<region>.pooler.supabase.com:5432`, user `postgres.<project-ref>`) on IPv4-only networks — direct host is IPv6-only, and the transaction pooler (6543) breaks the app's prepared statements. Never add `?sslmode=` to the URL; SSL is set in `data/db.js` for supabase hosts. Chain verification is **off by default**; set `DATABASE_SSL_CA_FILE` to the provider's PEM to turn it on (`DATABASE_SSL_REJECT_UNAUTHORIZED` is the explicit override).

## Deployment (Vercel + Render + Supabase)

Full runbook: **`DEPLOYMENT.md`** at the repo root (it lives there because `docs/` is gitignored). Order matters: Supabase → Render → Vercel, because Render needs the Vercel origin and Vercel needs the Render URL.

- `render.yaml` (repo root) — Render blueprint, `rootDir: backend`, health check `/readyz`. `CORS_ORIGIN` + `DATABASE_URL` are `sync: false` (prompted in the dashboard, never committed); `JWT_SECRET` is Render-generated.
- `backend/Procfile` — `web: npm start` (portability only; the blueprint is the source of truth).
- `frontend/vercel.json` — SPA `rewrites`. **Vercel ignores `public/_redirects`**, so that file alone is not enough there.
- `VITE_API_BASE_URL` is inlined by Vite **at build time** — changing it in the Vercel dashboard requires a redeploy, and omitting it silently points the bundle at `localhost:5000`. There is no Vite dev proxy, so local dev needs a running backend plus permissive CORS.
- CI: `.github/workflows/ci.yml` runs backend `npm test` + frontend `lint`/`build` on push/PR to `main`.


## Architecture

- **Backend**: Express 5 (ESM). Routes mounted under `/api/v1` in `server.js`. One router per domain (`routes/`), controllers are **raw SQL** classes (no ORM) — map snake_case columns to camelCase API responses yourself. Auth: JWT via `protect` + `authorizeRoles(...)` in `middleware/authMiddleware.js`. Login/register span `students`/`firms`/`universities`; `admins` is a separate username-based table (admin seed: `sysadmin` / `theadmin`).
- **Registration**: `POST /auth/register` validates a per-role required-field set (`REQUIRED_FIELDS` in `controllers/authController.js`), rejects `admin`, lowercases the email on write *and* lookup, and is rate limited at 10/hour/IP separately from `/login`'s 20/15min. Because the controller rejects incomplete payloads, a signup form that collects a field but doesn't send it fails loudly at the API boundary rather than silently dropping it — that's what bit us once already.
- **Frontend**: React 19 + Vite 8 + Tailwind 4. Tailwind is configured **in CSS** (`@import "tailwindcss"` + `@theme` in `src/index.css`), not `tailwind.config`. Dark mode is a 3-state System/Light/Dark toggle driven by semantic `--sc-*` tokens with `@custom-variant dark`; use those tokens, not literal slate/gray utilities. Per-role accents live in `src/config/roleTheme.js`.
- **API client**: `src/service/apiClient.js` attaches the JWT from `localStorage` and auto-logs-out (redirects to `/login/<portal>`) on 401/403. All service methods must use the full `/api/v1/...` prefix (a stale `/firm/...` prefix previously caused 404s).
- **Routing**: `src/route/AppRoute.jsx` + `ProtectedRoute`/`GuestRoute`; guest routes redirect to portal login pages.
- **Signup**: `/register` shows a portal picker, `/register/:role` locks the form to one. `src/config/registration.js` is the single source of truth pairing each registrable role with its login/register/home paths — `admin` is deliberately absent so admin self-signup is impossible. The `/login/*` screens are **login-only**; do not reintroduce an in-page register toggle, it would break deep-linking.

## Workflow conventions

- **Update `docs/PROGRESS.md`** with every meaningful change (newest entry first, dated) and finish the `Verified:` line with the commands you ran. `docs/IMPROVEMENT_PLAN.md` tracks the in-flight phase plan.
- Commits use foldered conventional style: `feat(firm): ...`, `fix(backend): ...`. Stage only related files.
- `.env` files are gitignored; never commit secrets. `docs/` is listed in `.gitignore` (tracked files remain, new ones won't be added) — put any **new** doc that must be committed at the repo root, like `DEPLOYMENT.md`.

## In-progress / known-stale

- Phases 1–3 are complete and every view reads the real API — there are no `// TODO(real-api)` markers left in `frontend/src`. The student profile feature is committed and shipped.
- **Signup hardening is committed but not merged.** The `/register` work (new routes + `Register.jsx`, the `0002_signup_fields.sql` migration, the `/auth/register` hardening) lives on branch **`feat/registration-flow`**, pushed to origin, with no PR opened yet. `main` does not have it, so a fresh clone of `main` still has no registration route.
- **Phase 4 is written but entirely uncommitted.** `render.yaml`, `DEPLOYMENT.md`, `frontend/vercel.json`, `frontend/.env.example`, `backend/Procfile`, `backend/data/bootstrap-db.js`, `.github/workflows/ci.yml` and the `AGENTS.md`/`db.js`/`server.js`/`package.json` edits are sitting in the working tree of the registration branch, not in git. Consequences: **CI does not run at all** (the workflow file is uncommitted), and no Supabase project, Render service or Vercel project has been created yet. `docs/PROGRESS.md` is deliberately held back from the registration commit for the same reason — its 2026-10-02 entry and the uncommitted 2026-09-30 Phase 4 entry are in one file. Committing Phase 4 and the PROGRESS entry together is the obvious next step.
- **No self-service password reset.** The auth screens say "Locked out? Ask your admin to reset it." and point at `POST /admin/reset-password`. Do not add a "Forgot password?" link without first building the token + delivery flow.
- `node_modules` is not committed and is not present on a fresh clone — run `npm ci` in both packages before `npm test` / `npm run build`.
