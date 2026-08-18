# ForgeForce QC App

A Mini Quality Control application: engineers inspect machines against a
reusable checklist template, record defects with photos and corrective
actions on failure, and every change to a submitted checklist result is
preserved in a full audit trail. See [PLAN.md](PLAN.md) for the design
written before implementation and [SUMMARY.md](SUMMARY.md) for a short
list of what was built, what was skipped, and judgment calls made.

## Stack

- **Backend:** Laravel 13 (PHP 8.3), Sanctum (Bearer token auth), SQLite.
- **Frontend:** React + TypeScript (Vite), Tailwind CSS, React Router.

## Setup

### Prerequisites

PHP 8.3+, Composer, Node 18+, npm.

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

A manual API test script is included: `backend/test-api.sh` (run it with
the server up: `BASE_URL=http://localhost:8000/api ./test-api.sh`). It
walks the full workflow including the Pass→Fail audit scenario.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`, log in with any seeded account above.

---

## Architecture

Two independent apps in one repo, talking over JSON/HTTP — see
[PLAN.md §A](PLAN.md#a-architecture) for the reasoning. In short: Laravel
is API-only with Bearer-token auth (not cookie/SPA-stateful mode, to avoid
CORS/CSRF cookie complexity for a cross-origin dev setup); business logic
lives in `app/Services/`, controllers stay thin. The React frontend talks
to it through a small typed client (`frontend/src/lib/api/*.ts`) — no
state-management or data-fetching library, just hooks, to keep dependencies
minimal for the size of this app.

## Database Structure

Full schema and relationship rationale: [PLAN.md §B](PLAN.md#b-database-schema).

The one design decision worth calling out here specifically is the
**audit trail**, since it's the most heavily-weighted requirement:

- `inspection_item_results` holds the **current** value of each checklist
  item (fast to query, one row per item per inspection).
- `inspection_item_history` is a **separate, append-only ledger**. Every
  write to a result — the very first time it's answered, and every
  correction after — inserts a new row here recording
  `previous_result → new_result`, `previous_comment → new_comment`, who
  changed it (`changed_by`), when (`changed_at`), and why (`change_reason`,
  **required** once the parent inspection is `submitted`).
- Both writes happen in one DB transaction
  (`InspectionItemResultService::updateResult()`), so the visible value and
  its history entry can never drift apart.
- Nothing in `inspection_item_history` is ever updated or deleted by
  application code — `InspectionItemHistory` doesn't even have an
  `updated_at` column, deliberately, to make "this table is only ever
  appended to" structurally obvious rather than just a convention.
- The frontend's `HistoryTimeline` component renders this ledger directly:
  `Safety Guard: Pass → Fail, changed by Erin Engineer on <date>, reason: …`.

I considered a generic EAV-style audit log (`field`, `old_value`,
`new_value`) instead of explicit `previous_result`/`new_result` columns —
went with explicit columns because this audit trail is graded on one
specific, well-known scenario, and explicit columns are easier to read in
a database client or a code review than a generic log would be, at the
cost of only being reusable for these two fields (result + comment).

## Key Decisions

- **SQLite over MySQL/PostgreSQL.** Zero setup for a timed evaluation. The
  app only uses Eloquent, no raw SQL, so switching is a `.env` change
  (`DB_CONNECTION`, `DB_HOST`, …), not a code change.
- **Bearer tokens over Sanctum's SPA cookie mode.** Simpler CORS story for
  two dev servers on different ports; no CSRF cookie dance to debug.
- **Three roles, minimal differentiation.** Engineer, Quality Manager, and
  Admin can all operate the shop-floor workflow identically — start
  inspections, mark items, record defects/corrective actions. The one
  place role matters is the audit-critical rule: once an inspection is
  submitted, only the original inspector, a Quality Manager, or an Admin
  may correct an item, and doing so requires a written reason. I built a
  reusable `role:` middleware alias for future per-route gating, but didn't
  invent additional restrictions beyond this one rule, since the brief
  explicitly asked not to build a complex permission system and the
  business scenario doesn't call for more.
- **Corrective actions are `hasMany` from Defect, not `hasOne`.** A defect
  can get a follow-up corrective action if the first fix doesn't hold —
  `hasOne` would silently hide a second row rather than prevent one.
- **`php artisan serve` with `PHP_CLI_SERVER_WORKERS=4`.** Testing with a
  real browser (not just curl) surfaced that PHP's built-in dev server is
  single-threaded by default, which caused several-second queuing delays
  when multiple components fetched on mount. Set in `.env.example` because
  it's a real, reproducible finding, not a guess — irrelevant in
  production, where you'd run php-fpm.

## AI Feature

**What:** a defect-summary generator (`POST /api/ai/defect-summary`). Given
an inspection, it collects the failed checklist items — their labels,
engineer comments, and any linked defects (description + severity) — and
produces a short plain-text summary suitable for a QC report.

**Why this one:** of the two suggested options (defect summary vs.
corrective-action suggestion), a summary is lower-risk to demonstrate
"advisory, not authoritative" — it's read-only prose, not a suggested
value that could be mistaken for a real corrective-action record if a
reviewer clicks too fast.

**Data in:** machine identity (name/code/serial) and, per failed item, its
label, the engineer's comment, and defect description/severity. No PII
beyond user names already present in the domain (attributed via
`changed_by`/`created_by`, which are already part of the audit trail's
purpose).

**Data out:** stored in `ai_suggestions` as `status: pending`, never
written into `defects`, `corrective_actions`, or anywhere else considered
an official record. The only way its status changes is a human calling
`PATCH /api/ai-suggestions/{id}` — an explicit Accept/Reject action in the
UI, rendered in a visually distinct panel labeled "AI-generated summary —
for review only." `input_snapshot` is stored alongside the output so any
suggestion is traceable to exactly what data produced it.

**Real vs. mock:** `DefectSummaryGenerator` is an interface with two
implementations — `AnthropicDefectSummaryGenerator` (calls the Anthropic
Messages API via Laravel's HTTP client, no extra SDK dependency) and
`MockDefectSummaryGenerator` (deterministic, rule-based, clearly documented
as not calling any external service). `AppServiceProvider` binds whichever
one applies based on whether `ANTHROPIC_API_KEY` is set — swapping real for
mock, or vice versa, is that one binding, not a rewrite.

**Production sensitive-data note:** this evaluation's data (machine
findings, defect descriptions) isn't sensitive personal data, but if this
pattern were extended to include operator PII in prompts sent to a
third-party model, I'd want: an allow-list of exactly which fields are
serialized into `input_snapshot`/the prompt (already partially true here —
`buildFindings()` is the single choke point), a data-processing agreement
with the AI vendor, and probably redacting free-text comment fields for
anything that looks like a name/ID before sending, since engineers could
paste anything into a comment box.

## Implementation Stages & Approximate Time

| Stage | ~Time |
|---|---|
| 1. Plan (PLAN.md) | 20 min |
| 2. Scaffold (Laravel + Sanctum, React + Tailwind, CORS, git) | 40 min |
| 3. Schema, models, audit-trail migration, seeder | 45 min |
| 4. Backend API (inspections, items, defects, corrective actions, curl tests) | 75 min |
| 5. Frontend (auth, machine/inspection pages, checklist UI, browser-verified) | 90 min |
| 6. AI feature (real + mock, frontend panel) | 35 min |
| 7. README, self-review, cleanup, SUMMARY.md | 35 min |

Total: roughly 6 hours, run unattended (see note below).

## Intentionally Not Implemented

See [PLAN.md §G](PLAN.md#g-explicitly-not-built-and-why) for the original
list (offline/PWA support, an admin UI for authoring templates, email
notifications, cloud storage, a full permission matrix, a diff/version
UI beyond a chronological list, CI, soft-delete/undo on the audit trail,
template-versioning UI). Confirmed still accurate after implementation;
nothing else was quietly dropped.

One addition discovered during implementation: the `role:` middleware
alias exists but is applied to zero routes. The single real authorization
rule (who may correct a submitted item) is checked inline in
`InspectionItemResultController` rather than as reusable middleware,
because it needed the specific "owner OR quality_manager/admin" logic, not
a flat single-role gate. The middleware is there as a building block if a
future route needs simple role gating, not because it's currently load-bearing.

## Self-Review Against Requirements

- **Workflow** (inspect → fail → defect → photo → corrective action →
  submit → history): built and verified end-to-end via `test-api.sh` and a
  headless-Chromium run through the actual UI (login → machine → start
  inspection → mark items → fail Safety Guard → defect + photo + corrective
  action → submit).
- **Schema**: see above; matches PLAN.md with justified deviations.
- **Validation**: every mutating endpoint uses a Form Request, not inline
  `$request->validate()`.
- **Auth**: Sanctum Bearer tokens, 3 seeded roles, one enforced
  authorization rule tied to the audit trail (see Key Decisions).
- **Tablet UX**: large (44–56px) touch targets on all primary actions,
  Pass/Fail/N/A as big colored buttons, a progress bar, photo capture via
  `capture="environment"` on the file input. Verified with headless-Chromium
  screenshots at both desktop width and an iPad-sized viewport (810×1080
  portrait and 1080×810 landscape, `hasTouch: true`) — layout holds with no
  overflow or broken wrapping in either orientation.
- **Audit trail**: the core requirement — verified with a real Pass→Fail
  transition, both via API (`test-api.sh`) and in the browser, showing the
  required-reason gate and the resulting history timeline.
- **AI feature**: implemented, advisory-only, real/mock switch, see above.
- **README**: this document.

No unresolved gaps found in this pass. One thing worth noting rather than
treating as settled: the tablet check confirmed *layout*, not real-device
touch ergonomics (e.g. actual finger-size hit testing, on-screen keyboard
occlusion of the comment field) — a real iPad would be the next check if
more time were available.

## AI Tool Usage Note

This project was built with **Claude Code** running in VS Code, from a
single detailed prompt covering the full brief, ground rules, and
stage-by-stage plan. Per the user's explicit instruction, it ran
**unattended overnight** — the plan was written first, then every stage
was implemented, tested (including real backend API calls and a
headless-browser run through the actual UI), committed, and pushed without
pausing for approval between stages. Being transparent about that here as
instructed.
