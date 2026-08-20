# ForgeForce QC App

## Overview

A Mini Quality Control application: engineers inspect machines against a
reusable checklist template, record defects with photos and corrective
actions on failure, and every change to a submitted checklist result is
preserved in a full audit trail. See [PLAN.md](PLAN.md) for the design
written before implementation and [SUMMARY.md](SUMMARY.md) for a short
list of what was built, what was skipped, and judgment calls made.

## Stack

- **Backend:** Laravel 13 (PHP 8.3), Sanctum (Bearer token auth), SQLite.
- **Frontend:** React + TypeScript (Vite), Tailwind CSS, shadcn/ui (Radix +
  class-variance-authority), React Router.

## Setup

### Prerequisites

PHP 8.3+, Composer, Node 18+, npm — all on your shell's `PATH`.

If you installed PHP via **Laragon on Windows**: Laragon only puts `php`/
`composer` on `PATH` inside its own bundled terminal, not a regular Git
Bash / PowerShell / VS Code terminal. If `php -v` or `composer -V` isn't
found, either use Laragon's terminal, or add
`C:\laragon\bin\php\php-<version>` and `C:\laragon\bin\composer` to your
`PATH` for the session. This affects every command below, including
`backend/test-api.sh`, which shells out to `php` for JSON parsing.

### Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate --seed
php artisan storage:link
php artisan serve
```

The API runs at `http://localhost:8000`.

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

Open `http://localhost:5173`, log in with any seeded account below.

## Demo Accounts

Password for all accounts: `password`.

| Email | Role |
|---|---|
| engineer@forgeforce.test | engineer |
| manager@forgeforce.test | quality_manager |
| admin@forgeforce.test | admin |

A sample machine (`FF-HP-100`, serial `FF100-2026-001`, type "Hydraulic
Press") is seeded with its 6-item checklist template.

## Architecture

Two independent apps in one repo, talking over JSON/HTTP — see
[PLAN.md §A](PLAN.md#a-architecture) for the full reasoning. Laravel is
API-only with Bearer-token auth (not cookie/SPA-stateful mode, to avoid
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

## Key Technical Decisions

- **SQLite over MySQL/PostgreSQL.** Zero setup for a timed evaluation. The
  app only uses Eloquent, no raw SQL, so switching is a `.env` change
  (`DB_CONNECTION`, `DB_HOST`, …), not a code change.
- **Bearer tokens over Sanctum's SPA cookie mode.** Simpler CORS story for
  two dev servers on different ports; no CSRF cookie dance to debug.
- **Three roles, minimal differentiation.** Engineer, Quality Manager, and
  Admin can all operate the shop-floor workflow identically — start
  inspections, mark items, record defects/corrective actions. Two places
  role matters: the audit-critical rule (once an inspection is submitted,
  only the original inspector, a Quality Manager, or an Admin may correct
  an item, and doing so requires a written reason), and a deliberately
  small **Approve** action — a Quality Manager or Admin can sign off a
  submitted inspection (`PATCH /inspections/{id}/approve`, gated by a
  `role:` middleware alias), which records `approved_at`/`approved_by` and
  is never available to the Engineer role, in the UI or via the API
  directly (returns `403`). This was added as one small, clearly-scoped
  piece of role differentiation, not a full permission system — Engineers
  still do everything else identically to Manager/Admin, and Approve has
  exactly one business rule ("must be submitted, not already approved"),
  no additional checks like "no open defects." I didn't invent further
  restrictions beyond these two rules, since the brief explicitly asked
  not to build a complex permission system and the business scenario
  doesn't call for more.
- **Corrective actions are `hasMany` from Defect, not `hasOne`.** A defect
  can get a follow-up corrective action if the first fix doesn't hold —
  `hasOne` would silently hide a second row rather than prevent one.
- **`php artisan serve`'s single-worker default on Windows is a known,
  accepted dev-only limitation**, not something `PHP_CLI_SERVER_WORKERS`
  can fix on this platform (that flag requires `pcntl_fork()`, which
  Windows doesn't provide). It's not an issue in production, where
  php-fpm gives true concurrency on any platform.

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

## Testing & Verification

The application was verified at two points: during the original
time-boxed build, and again afterward through dedicated verification
passes.

**During the build**, every backend endpoint was exercised via
`backend/test-api.sh` (curl), including the Pass→Fail audit-trail
scenario, and the frontend was walked through in a real browser
end-to-end (login → machine → start inspection → mark items → fail an
item → defect + photo + corrective action → submit).

**After the build**, the application was tested more deliberately: a full
engineer-perspective walkthrough of the entire workflow; two independent
fresh-clone setups following this README with no prior context; deliberate
edge-case testing (submitting with items unanswered, changing a result
without a required reason, empty defect descriptions); a role-comparison
pass confirming Engineer vs. Quality Manager/Admin views differ only where
intended; and a database cross-check of what the UI displayed against the
underlying SQLite data.

During this process, the application was tested through the complete
inspection workflow and several issues were identified and fixed,
including checklist state handling on save, AI-summary persistence across
navigation, and a missing `storage:link` setup step. Every fix was
reverified afterward by re-running the relevant test — the curl script,
a browser walkthrough, or both — rather than assumed correct from the
code looking right.

## Implementation Time

**Initial time-boxed implementation: approximately 6 hours.**

| Stage | ~Time |
|---|---|
| Plan (PLAN.md) | 20 min |
| Scaffold (Laravel + Sanctum, React + Tailwind, CORS, git) | 40 min |
| Schema, models, audit-trail migration, seeder | 45 min |
| Backend API (inspections, items, defects, corrective actions, curl tests) | 75 min |
| Frontend (auth, machine/inspection pages, checklist UI, browser-verified) | 90 min |
| AI feature (real + mock, frontend panel) | 35 min |
| README, self-review, cleanup, SUMMARY.md | 35 min |

Additional verification and hardening were performed **separately, after**
the initial time-boxed implementation, to validate the application and
fix issues discovered during testing (~5h15m total, disclosed
transparently rather than folded into the figure above):

- Two independent fresh-clone verification passes
- Root-cause fix for the checklist save/state-handling bug (see Testing & Verification)
- UI rebuild on shadcn/ui, with a mobile-width (375px) verification pass
- Defect/corrective-action edit capability
- Full end-to-end browser walkthrough, plus the AI-summary persistence fix it surfaced
- Final cleanup pass before submission
- An independent QA pass (role comparison, edge cases, DB cross-check, responsive layout, console/network errors)
- The role-gated Approve action described in Key Technical Decisions

## Intentionally Not Implemented

The following were deliberately excluded to respect the 6-hour time box,
and because they belong to a later, production-focused phase rather than
this evaluation's scope. Full reasoning: [PLAN.md §G](PLAN.md#g-explicitly-not-built-and-why).

- Offline/PWA support
- An admin UI for authoring checklist templates
- Email notifications
- Cloud storage for photos (local disk storage is used instead)
- A full permission matrix beyond the two role rules described in Key Technical Decisions
- An advanced audit diff/version UI beyond the existing chronological history timeline
- CI
- Soft-delete/undo on the audit trail
- Template-versioning UI

This list was confirmed still accurate after implementation; nothing else
was quietly dropped. One related note: the `role:` middleware alias was
built early in the project but wasn't wired to any route until the
Approve action was added later — it's no longer unused.

## What I Would Improve With More Time

- **A real PHPUnit test suite.** Verification for this project happened via
  `backend/test-api.sh` (curl) and browser walkthroughs, not PHPUnit — no
  feature tests hitting the audit-trail service directly, no unit tests
  for `InspectionItemResultService` or `AiSummaryService`. That proves the
  app works *today*; it doesn't catch a regression in CI the way a real
  test suite would.
- **Real device testing, not simulated viewports.** Tablet/phone
  verification was done via simulated viewports (iPad-sized, iPhone
  375px), not physical hardware. That confirms *layout* — it can't confirm
  actual touch-target ergonomics, on-screen keyboard occlusion of the
  comment field, or the real camera-capture flow on a tablet.
- **Richer role/permission granularity.** All three roles can still do the
  same things on the shop floor day-to-day; the app now has two enforced
  role rules (who may correct a submitted item, and who may Approve one)
  rather than zero, but that's a deliberately minimal slice, not full
  coverage. Managing machines and templates, or approving individual
  corrective actions rather than the inspection as a whole, are still
  open — a real next step, not something ruled out by the brief's "don't
  build a complex permission system."
- **MySQL/PostgreSQL instead of SQLite for production.** Chosen for
  zero-setup speed in a timed evaluation, and switching is a `.env` change
  since the app is pure Eloquent with no raw SQL — but it hasn't actually
  been run against a real MySQL/PostgreSQL instance, so a real pass would
  be worth doing before treating that assumption as proven (e.g. enum
  column behavior can differ by driver).
- **Offline tablet support.** Shop-floor connectivity isn't always
  reliable, and this app assumes an always-on connection. Real offline
  support — queueing inspection saves locally, syncing on reconnect — is
  a substantial feature in its own right, not a quick add.
- **Pagination on inspection history.** `GET /machines/{id}/inspections`
  currently returns every inspection for a machine in one response. Fine
  for a demo with one seeded machine and a handful of inspections; a
  machine with years of real history would need cursor or offset
  pagination.
- **The draft-vs-submitted reason-gate scope — an open question, not a
  bug.** Changing a result only requires a written reason once the parent
  inspection is `submitted`, matching the brief's literal wording ("marks
  Pass, *submits*, and later changes it to Fail"). But a first-time
  tester's intuition, confirmed during manual testing, expected the
  reason gate to apply to *any* correction, including during draft
  editing. This is a genuine product decision, not a technical
  limitation — left open rather than assumed, since it changes real
  workflow behavior either way.

## AI Development Usage

This project was built with **Claude Code** running in VS Code, used as a
development assistant throughout — not as a black box that produced a
final answer unreviewed.

**Initial build.** From a single detailed prompt covering the full brief,
ground rules, and a stage-by-stage plan, the build was run largely
unattended per explicit instruction: the plan was written first
(`PLAN.md`), then each stage was implemented, tested (via
`backend/test-api.sh` and browser walkthroughs), committed, and pushed in
sequence.

**Verification was a separate, deliberate step**, not assumed from the
code looking correct — see [Testing & Verification](#testing--verification).
That process surfaced two real bugs (a checklist save/state-handling
issue and an AI-summary persistence issue), both investigated to a root
cause, fixed, and reverified by re-running the relevant tests rather than
by re-reading the code.

**What was reviewed, changed, or rejected:** every generated migration,
model, service, controller, and component was read and reasoned about
before being tested, not merely accepted on generation. Architecture and
business-logic decisions — the audit-trail design, service-layer
boundaries, the real-vs-mock AI binding, the role-gating approach — were
deliberate choices I can explain individually, not unexamined output.
The resulting architecture, code, and business logic were reviewed,
tested, and refined; they were not written end-to-end by hand, but they
were not shipped unverified either.

## Requirements Self-Review

- **Workflow** (inspect → fail → defect → photo → corrective action →
  submit → history): built and verified end-to-end via `test-api.sh` and a
  browser run through the actual UI (login → machine → start inspection →
  mark items → fail Safety Guard → defect + photo + corrective action →
  submit).
- **Schema**: see Database Structure; matches PLAN.md with justified
  deviations.
- **Validation**: every mutating endpoint uses a Form Request, not inline
  `$request->validate()`.
- **Auth**: Sanctum Bearer tokens, 3 seeded roles, two enforced
  authorization rules — the audit-trail reason gate and the Approve
  action's role gate (see Key Technical Decisions).
- **Tablet UX**: large (44–56px) touch targets on all primary actions,
  Pass/Fail/N/A as big colored buttons, a progress bar, photo capture via
  `capture="environment"` on the file input. Verified at both desktop
  width and simulated tablet/mobile viewports, in both orientations, with
  no overflow or broken wrapping.
- **Audit trail**: the core requirement — verified with a real Pass→Fail
  transition, both via API (`test-api.sh`) and in the browser, showing the
  required-reason gate and the resulting history timeline.
- **AI feature**: implemented, advisory-only, real/mock switch — see AI
  Feature above.
- **README**: this document.

No unresolved gaps found in this pass beyond what's listed in "What I
Would Improve With More Time" above.
