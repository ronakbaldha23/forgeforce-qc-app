# ForgeForce QC App

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

## Post-Build Fix: Full-Remount-on-Save

A follow-up manual test round reported "clicking Save causes a full page
reload." It wasn't a literal browser navigation — every `<button>`/`<form>`
in the app already had correct `type` attributes and `e.preventDefault()`
calls (verified by audit, then by instrumenting a real browser for
`domcontentloaded` events during a Save click: zero, both before and after
the fix). The actual cause was architectural: `InspectionPage` held one
`isLoading` flag, and every item save called a full `reload()` of the
inspection, which unmounted the entire checklist behind a blank "Loading…"
screen and remounted it from scratch — visually indistinguishable from a
reload even though it was client-side. Fixed by having `useInspection`
expose `updateItemResult()`/`applySubmission()` so a save patches just that
one item (from the PUT response) with no refetch. Verified via headless
Chromium: 0 `domcontentloaded` events across repeated Save clicks, at both
desktop and 375px mobile width. The UI was also migrated to shadcn/ui in
the same pass, with `cursor-pointer` added explicitly to interactive
elements — native `<button>` does not get pointer cursor by default in any
browser (only `<a href>` does), which was a real, separate gap.

## Setup

### Prerequisites

PHP 8.3+, Composer, Node 18+, npm — all on your shell's `PATH`.

If you installed PHP via **Laragon on Windows**: Laragon only puts `php`/
`composer` on `PATH` inside its own bundled terminal, not a regular Git
Bash / PowerShell / VS Code terminal. If `php -v` or `composer -V` isn't
found, either use Laragon's terminal, or add
`C:\laragon\bin\php\php-<version>` and `C:\laragon\bin\composer` to your
`PATH` for the session (`export PATH="/c/laragon/bin/php/php-8.3.30-...:/c/laragon/bin/composer:$PATH"`
in Git Bash). This affects every command below, including
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
- **`php artisan serve`'s single-threaded default is a known, accepted dev
  limitation on Windows — not fixed by `PHP_CLI_SERVER_WORKERS`.** Real-browser
  testing surfaced that concurrent requests (e.g. two components fetching on
  mount) queue behind each other, adding a visible delay per page. I initially
  "fixed" this by setting `PHP_CLI_SERVER_WORKERS=4`, but on re-verification
  it turned out to be a no-op: that flag requires `pcntl_fork()`, which
  doesn't exist on Windows (`php artisan serve` prints "forking is not
  supported on this platform" and silently falls back to one worker
  regardless). Left commented out in `.env.example` with that explanation
  rather than quietly removed, since it's real on Linux/macOS dev machines.
  Not an issue in production, where php-fpm gives true concurrency on any
  platform.

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

The original, time-boxed build:

| Stage | ~Time |
|---|---|
| 1. Plan (PLAN.md) | 20 min |
| 2. Scaffold (Laravel + Sanctum, React + Tailwind, CORS, git) | 40 min |
| 3. Schema, models, audit-trail migration, seeder | 45 min |
| 4. Backend API (inspections, items, defects, corrective actions, curl tests) | 75 min |
| 5. Frontend (auth, machine/inspection pages, checklist UI, browser-verified) | 90 min |
| 6. AI feature (real + mock, frontend panel) | 35 min |
| 7. README, self-review, cleanup, SUMMARY.md | 35 min |

**Total: ~6 hours.**

### Verification & Hardening (post-build)

Additional verification and polish done *after* the initial 6-hour build, once
real bugs were found through actual testing — not part of the original
constrained build, and not padding to make the effort look larger. Listed
separately and honestly for that reason.

| Work | ~Time |
|---|---|
| Fresh-clone verification passes (×2) + README corrections | 20 min |
| Root-caused and fixed the checklist full-remount-on-save bug | 30 min |
| UI rebuild on shadcn/ui (Radix + cva) + mobile-width (375px) verification pass | 75 min |
| Defect/corrective-action edit capability (backend endpoint + inline UI + "add another defect" ambiguity fix) | 50 min |
| Full end-to-end browser walkthrough, driven as a real user, login through history view | 25 min |
| AI-summary persistence bug found during that walkthrough — fixed and reverified | 20 min |
| Final cleanup pass (scaffold removal, dead-code audit, linter fixes) | 35 min |

**Total: ~4h15m of additional verification and hardening**, on top of the
original ~6-hour build.

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

## What I'd Improve With More Time

- **A real PHPUnit test suite.** Verification for this project happened via
  `backend/test-api.sh` (curl) and headless-browser automation, not
  PHPUnit — no feature tests hitting the audit-trail service directly, no
  unit tests for `InspectionItemResultService` or `AiSummaryService`. The
  curl script and browser runs prove the app works *today*; they don't
  catch a regression in CI the way a real test suite would.
- **Real device testing, not simulated viewports.** Tablet/phone
  verification was headless-Chromium viewport simulation (iPad 810×1080,
  iPhone 375px via `hasTouch: true`), not physical hardware. That confirms
  *layout* — it can't confirm actual touch-target ergonomics, on-screen
  keyboard occlusion of the comment field, or the real camera-capture flow
  on a tablet.
- **Richer role/permission granularity.** All three roles can currently do
  the same things on the shop floor, with exactly one enforced rule (who
  may correct a submitted item). A `role:` middleware alias exists but
  isn't wired to any route. If Quality Manager/Admin are meant to have
  visibly different capabilities — approving corrective actions, managing
  machines and templates — that's a real next step, not something ruled
  out by the brief's "don't build a complex permission system."
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

No unresolved gaps found in this pass beyond what's listed in "What I'd
Improve With More Time" above.

## AI Tool Usage Note

This project was built with **Claude Code** running in VS Code.

**Initial build.** From a single detailed prompt covering the full brief,
ground rules, and a stage-by-stage plan, run unattended per the user's
explicit instruction — the plan was written first (`PLAN.md`), then every
stage was implemented, tested (real backend API calls via
`backend/test-api.sh`, plus a headless-browser run through the actual UI),
committed, and pushed without pausing for approval between stages.

**What happened after that wasn't "generate once and ship."** The app then
went through several separate rounds of deliberate manual verification:

- **Two independent fresh `git clone` passes**, following this README with
  no prior context, specifically to catch anything the build-time testing
  might have missed. This found a real gap — a missing `storage:link` step
  — which was fixed.
- **A full end-to-end browser walkthrough**, driven exactly as a real
  engineer would use the app — login, select a machine, start an
  inspection, mark items, fail one, record a defect with a photo and
  corrective action, edit it, submit, generate and accept an AI summary,
  open the machine's history — with explicit instructions not to smooth
  over anything found along the way.
- **Deliberate "break it" testing**: submitting with items unanswered,
  changing a result to Fail without a reason where one is required,
  submitting a defect with no description, navigating away mid-flow —
  specifically to find where validation or state management would fail
  rather than assuming it wouldn't.

**Two real bugs were found and fixed through that process — caught by
actually running and using the app, not by re-reading the code:**

1. A reported "page reload on Save" turned out, on investigation, to not
   be a literal browser reload — every button/form already had correct
   `type` attributes and `preventDefault()` calls. The real cause was
   architectural: the checklist page was fully unmounting and remounting
   behind a loading screen on every save, because saving refetched the
   *entire* inspection instead of patching the one changed item. Confirmed
   by instrumenting the browser for actual navigation events (zero, both
   before and after), then fixed to a targeted state update.
2. During the full walkthrough, navigating away from an inspection and
   back showed the AI summary panel reset to "Generate summary" as if
   nothing had ever been created — even though the backend still had the
   accepted suggestion. The panel never checked for an existing suggestion
   on load, meaning generating again would have silently created a
   **duplicate** database row for the same inspection. Fixed by adding an
   endpoint to fetch the existing suggestion and having the panel check it
   on mount; reverified the suggestions table still held exactly one row.

Every fix above was reverified after the change — by re-running the
relevant browser walkthrough and the curl regression script — rather than
assumed correct because the code looked right on inspection.
