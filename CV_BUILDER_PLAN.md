# Plan: CV Builder Feature (Student Dashboard)

## Decisions (approved)

| Decision | Value |
|----------|-------|
| PDF export | Server-side (no new frontend deps; backend generates PDF) |
| ATS scoring | Simple keyword/skills overlap (dependency-free) |
| CV versions | Versioned history (`is_primary` flag, multiple CVs per student) |
| Guided prompts | Hardcoded curated question set per section |

## Context (read from repo)

### Frontend (`frontend/`)
- React 19 + Vite 8 + Tailwind 4 (CSS-based `@theme` config)
- Role-based routing via `AppRoute.jsx` + `ProtectedRoute` / `GuestRoute`
- Student hub mounted under `/student/*` with `DashboardLayout`
- Existing student views: `StudentDashboard`, `StudentMarketplace`, `StudentLogBook`, `StudentProfile`
- API client: `src/service/apiClient.js` (axios, JWT from localStorage, auto-logout on 401/403)
- Student service: `src/service/studentService.js` (calls `/api/v1/student/...`)
- Components: `components/common/`, `components/data-display/`, `components/layouts/`
- Role accents: `src/config/roleTheme.js`

### Backend (`backend/`)
- Express 5 (ESM), routes under `/api/v1`
- One router per domain in `routes/`, raw SQL controllers in `controllers/`
- Student routes: `backend/routes/studentRoutes.js`
- Student controller: `backend/controllers/studentController.js`
- Auth: JWT via `protect` + `authorizeRoles(...)` in `middleware/authMiddleware.js`
- DB: dual-mode `data/db.js` (PostgreSQL via `DATABASE_URL`, else pg-mem from `sql/schema.sql` + `sql/seed.sql`)
- Migrations in `db/migrations/` — idempotent, three-place rule
- Tests: `npm test` (42 tests after auth hardening)

### Database schema relevant to CV
- `students(id, full_name, email, reg_number, course, phone, university_id, ...)`
- `universities(id, name, ...)`
- `placements(id, firm_id, role, location, duration, slots, description, ...)`
- `firms(id, company_name, contact_email, industry, location, ...)`
- `applications(student_id, firm_id, placement_id, role, status, ...)`

---

## Feature Overview

**CV Builder** — guided multi-step wizard inside the student dashboard to create ATS-friendly CVs. Includes a **Job Analyzer** that compares a student's CV against a job description/placement and scores ATS compatibility with gap suggestions.

**Design principles:**
- Guided prompts (hardcoded, step-by-step wizard)
- ATS-friendly output (clean structure, standard sections, keyword-friendly)
- Versioned CV storage per student (`is_primary` flag)
- Reuses existing student profile data as defaults
- Students only; protected by `protect` + `authorizeRoles('student')`
- Follows existing conventions: Express controllers + raw SQL, React + Vite + Tailwind, full `/api/v1/...` prefix

---

## Database Schema (new tables)

### `student_cvs`
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| student_id | INTEGER FK → students(id) | NOT NULL, CASCADE |
| title | VARCHAR(150) | |
| is_primary | BOOLEAN | default false; one primary per student |
| personal_info | JSONB | name, email, phone, location, links |
| professional_summary | TEXT | |
| education | JSONB | array |
| experience | JSONB | array |
| skills | JSONB | array of {category, items[]} |
| projects | JSONB | array |
| certifications | JSONB | array |
| created_at / updated_at | TIMESTAMPTZ | default NOW() |

### `cv_analyses`
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| student_id | INTEGER FK → students(id) | NOT NULL |
| cv_id | INTEGER FK → student_cvs(id) | nullable |
| placement_id | INTEGER FK → placements(id) | nullable |
| job_title | VARCHAR(150) | |
| job_description | TEXT | |
| match_score | INTEGER | 0–100 |
| keyword_match | JSONB | matched/missing keywords |
| gap_analysis | TEXT | |
| section_scores | JSONB | per-section scores |
| created_at | TIMESTAMPTZ | default NOW() |

Three-place rule: `backend/db/migrations/0006_cv_builder.sql`, `backend/sql/schema.sql`, `backend/db/migrations/0001_init.sql`.

---

## Backend API Endpoints

All under `protect` + `authorizeRoles('student')`, mounted at `/api/v1/student/cv`.

### CV Management
| Method | Path |
|--------|------|
| GET | `/api/v1/student/cv` |
| POST | `/api/v1/student/cv` |
| GET | `/api/v1/student/cv/:id` |
| PATCH | `/api/v1/student/cv/:id` |
| DELETE | `/api/v1/student/cv/:id` |
| POST | `/api/v1/student/cv/:id/primary` |

### Export (server-side PDF)
| Method | Path |
|--------|------|
| GET | `/api/v1/student/cv/:id/export` |

### Job Analyzer
| Method | Path |
|--------|------|
| POST | `/api/v1/student/cv/analyze` |
| GET | `/api/v1/student/cv/analyses` |

---

## Frontend Routes

| Path | View | Guard |
|------|------|-------|
| `/student/cv-builder` | `CvBuilderWizard` | student |
| `/student/cv-builder/:cvId` | `CvBuilderWizard` (edit) | student |
| `/student/cv-analyzer` | `CvAnalyzer` | student |
| `/student/cv/:cvId/view` | `CvPreview` | student |

---

## Phased Implementation

### Phase 1 — Schema + Backend CRUD
- Migration `0006_cv_builder.sql` + mirrors in `sql/schema.sql` and `0001_init.sql`
- `backend/controllers/cvController.js`, `backend/routes/cvRoutes.js`
- Wire into `routes/index.js`
- pg-mem tests: create, list, get, update, delete, set primary, one-primary-per-student

### Phase 2 — Guided Wizard UI
- `CvBuilderWizard.jsx` multi-step form (personal → summary → education → experience → skills → projects → certifications → review)
- Pre-fill from `/student/profile`
- ATS checklist review step
- Save → POST `/api/v1/student/cv`

### Phase 3 — Export + Preview
- `CvPreview.jsx` read-only render
- Server-side PDF export via GET `/api/v1/student/cv/:id/export`

### Phase 4 — Job Analyzer
- `CvAnalyzer.jsx` — paste JD or select placement
- Backend keyword/skills overlap scoring (0–100), gap suggestions
- Store in `cv_analyses`, list past analyses

### Phase 5 — Dashboard Integration + Tests
- CV Builder card on `StudentDashboard`
- Backend + frontend tests, lint, build

---

## Files to Create / Modify

### Backend (create)
- `backend/controllers/cvController.js`
- `backend/routes/cvRoutes.js`
- `backend/db/migrations/0006_cv_builder.sql`

### Backend (modify)
- `backend/routes/index.js`
- `backend/sql/schema.sql`
- `backend/db/migrations/0001_init.sql`
- `backend/test/unit.test.js`

### Frontend (create)
- `frontend/src/features/student/views/CvBuilderWizard.jsx`
- `frontend/src/features/student/views/CvAnalyzer.jsx`
- `frontend/src/features/student/views/CvPreview.jsx`
- `frontend/src/features/student/components/CvStepper.jsx`
- `frontend/src/features/student/components/CvSectionForm.jsx`
- `frontend/src/service/cvService.js`

### Frontend (modify)
- `frontend/src/route/AppRoute.jsx`
- `frontend/src/features/student/views/StudentDashboard.jsx`
- `frontend/src/service/studentService.js` (or new cvService)

---

## Status
Plan saved. All phases NOT STARTED. Waiting for instructions to begin Phase 1.
