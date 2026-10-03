# AGENTS.md

Student Connect: Industrial Attachment platform (students ↔ firms ↔ universities ↔ admins). Monorepo of two independent npm packages — **no root `package.json`**; run every command from `backend/` or `frontend/`.

## Commands

Backend (`backend/`):
- `npm run dev` — nodemon server; `npm start` — plain node.
- `npm test` — the only test suite (`node --test`, 11 tests in `test/unit.test.js`). No backend lint/typecheck.
- Server refuses to start without `JWT_SECRET` set (`server.js:12`). Copy `.env.example` → `.env`.

Frontend (`frontend/`):
- `npm run dev` (port 5173), `npm run lint` (ESLint), `npm run build` (Vite production build).
- No tests and no typecheck (plain JS, no TS).

## Database dual-mode gotcha

`backend/data/db.js` is dual-mode: `DATABASE_URL` set → real PostgreSQL (`pg`); unset → in-memory `pg-mem` seeded from `sql/schema.sql` + `sql/seed.sql` (data resets each boot). Controllers call a shared `query(text, params)` so code is DB-agnostic. Boot log says which mode: `Connected to PostgreSQL via DATABASE_URL.` vs the pg-mem line.

- Backend `.env` currently points at live Supabase (session pooler). The live DB is **missing the `students.phone` column** that's in `schema.sql` — hitting `GET/PATCH /api/v1/student/profile` against real PG errors with `column s.phone does not exist` until you run `ALTER TABLE students ADD COLUMN IF NOT EXISTS phone VARCHAR(20);` in the Supabase SQL Editor. pg-mem mode works fine without it.
- Supabase specifics: use the **session pooler** string (`aws-0-<region>.pooler.supabase.com`, user `postgres.<project-ref>`) on IPv4-only networks — direct host is IPv6-only. Never add `?sslmode=` to the URL; SSL is auto-enabled in `data/db.js` for supabase hosts.

## Architecture

- **Backend**: Express 5 (ESM). Routes mounted under `/api/v1` in `server.js`. One router per domain (`routes/`), controllers are **raw SQL** classes (no ORM) — map snake_case columns to camelCase API responses yourself. Auth: JWT via `protect` + `authorizeRoles(...)` in `middleware/authMiddleware.js`. Login/register span `students`/`firms`/`universities`; `admins` is a separate username-based table (admin seed: `sysadmin` / `theadmin`).
- **Frontend**: React 19 + Vite 8 + Tailwind 4. Tailwind is configured **in CSS** (`@import "tailwindcss"` + `@theme` in `src/index.css`), not `tailwind.config`. Dark mode is a 3-state System/Light/Dark toggle driven by semantic `--sc-*` tokens with `@custom-variant dark`; use those tokens, not literal slate/gray utilities. Per-role accents live in `src/config/roleTheme.js`.
- **API client**: `src/service/apiClient.js` attaches the JWT from `localStorage` and auto-logs-out (redirects to `/login/<portal>`) on 401/403. All service methods must use the full `/api/v1/...` prefix (a stale `/firm/...` prefix previously caused 404s).
- **Routing**: `src/route/AppRoute.jsx` + `ProtectedRoute`/`GuestRoute`; guest routes redirect to portal login pages.

## Workflow conventions

- **Update `docs/PROGRESS.md`** with every meaningful change (newest entry first, dated) and finish the `Verified:` line with the commands you ran. `docs/IMPROVEMENT_PLAN.md` tracks the in-flight 3-day plan.
- Commits use foldered conventional style: `feat(firm): ...`, `fix(backend): ...`. Stage only related files.
- `.env` files are gitignored; never commit secrets. `docs/` is listed in `.gitignore` (tracked files remain, new ones won't be added).

## In-progress / known-stale

- Mock views still carrying `// TODO(real-api)` markers: `StudentDashboard`, `StudentLogBook`, `UniversityDashboard`, `UniversityAudits`. Student marketplace + firm + admin + auth are wired to the real API.
- The student profile feature (backend routes + `StudentProfile.jsx`) is uncommitted work-in-progress.