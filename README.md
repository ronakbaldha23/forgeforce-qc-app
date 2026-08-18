# ForgeForce QC App

A Mini Quality Control application: engineers inspect machines against a
reusable checklist template, record defects with photos and corrective
actions on failure, and every change to a submitted checklist result is
preserved in a full audit trail. See [PLAN.md](PLAN.md) for the design and
[SUMMARY.md](SUMMARY.md) for what was actually built vs. deferred.

## Stack

- **Backend:** Laravel 13 (PHP 8.3), Sanctum (Bearer token auth), SQLite by
  default (see "Database" below).
- **Frontend:** React + TypeScript (Vite), Tailwind CSS, React Router.

## Prerequisites

- PHP 8.3+, Composer
- Node 18+, npm

## Setup

### Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate --seed
php artisan serve
```

The API runs at `http://localhost:8000`.

**Seeded demo accounts** (password for all: `password`):

| Email | Role |
|---|---|
| engineer@forgeforce.test | engineer |
| manager@forgeforce.test | quality_manager |
| admin@forgeforce.test | admin |

A sample machine (`FF-HP-100`, serial `FF100-2026-001`, type "Hydraulic
Press") is seeded with its 6-item checklist template.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`.

## Database

Defaults to **SQLite** rather than MySQL/PostgreSQL. This is a deliberate
scope decision for a timed evaluation — zero setup, and since the app only
uses Eloquent (no raw SQL), switching to MySQL or PostgreSQL is purely a
`.env` change (`DB_CONNECTION`, `DB_HOST`, etc.) with no code changes
required.

## AI Feature

The defect-summary feature calls Anthropic's API if `ANTHROPIC_API_KEY` is
set in `backend/.env`; otherwise it falls back to a clearly labeled mock
implementation. See PLAN.md Section F and SUMMARY.md for details. AI output
is always advisory — it is never written into an official record without a
human explicitly accepting it.

## Repository Layout

```
backend/    Laravel API
frontend/   React + TypeScript SPA
PLAN.md     Design plan (written before implementation)
SUMMARY.md  What was built vs. intentionally skipped
```
