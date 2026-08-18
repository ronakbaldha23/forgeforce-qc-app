# Summary

## What was built

A working Laravel + React QC app covering the full brief:

- Machine → inspection template (checklist) → inspection → per-item
  Pass/Fail/N/A results, with the reusable `inspection_templates` /
  `inspection_template_items` structure so different machine types can
  have different checklists without code changes.
- Defects (description, severity, status) linked to a failed checklist
  item, with photo upload to local disk and one or more linked corrective
  actions (description, assignee, due date, status, completion notes).
- **The audit trail**, the most heavily-weighted requirement: an
  append-only `inspection_item_history` table, written in the same
  transaction as every result change, capturing previous/new value,
  who, when, and (once submitted) a required reason. Verified via both
  a curl script (`backend/test-api.sh`) and a real headless-browser run
  through the actual UI — screenshots taken during the build show the
  exact Pass→Fail scenario from the brief rendering correctly, including
  the required-reason gate.
- Sanctum Bearer-token auth with 3 seeded roles (engineer, quality_manager,
  admin).
- A tablet-oriented React frontend: large touch targets, Pass/Fail/N/A as
  big colored buttons, inline defect/photo/corrective-action flow on Fail,
  a progress bar, and a history view rendering the audit ledger in plain
  language. Verified visually at both desktop and iPad-sized viewports
  (portrait + landscape).
- An AI-assisted defect summary (`POST /api/ai/defect-summary`), advisory
  only — stored with `status: pending`, never auto-applied to any record,
  with a real Anthropic-backed implementation and a clearly separate
  rule-based mock used when no API key is configured. Reviewed in the UI
  via an explicit Accept/Reject action.
- A GitHub repo with staged, meaningful commits per milestone (schema,
  auth, backend API, frontend, AI feature) — not one giant commit.

## What was intentionally skipped

See [PLAN.md §G](PLAN.md#g-explicitly-not-built-and-why) and the
"Intentionally Not Implemented" section of [README.md](README.md) for the
full, reasoned list. Highlights: no offline/PWA support, no admin UI for
authoring checklist templates (seeded via migration instead), no email
notifications, no cloud file storage (local disk, clearly labeled), no
fine-grained permission matrix beyond the one audit-critical rule, no
CI pipeline, no undo/soft-delete on the audit trail (that would defeat its
purpose).

## Judgment calls made without the user available

- **Database engine: SQLite instead of MySQL/PostgreSQL.** The brief named
  MySQL or PostgreSQL, but SQLite needs zero local setup and the app only
  uses Eloquent (no raw SQL), so this is a one-line `.env` change to
  reverse if a real MySQL/PostgreSQL instance is expected for grading.
- **Auth transport: Sanctum Bearer tokens instead of Sanctum's SPA cookie
  mode.** Chosen to avoid CORS/CSRF cookie complexity between two
  independent dev-server origins; documented in README as a deliberate
  choice, not an oversight.
- **AI feature choice: defect summary over corrective-action suggestion.**
  Both were offered as acceptable options; summary was chosen as
  lower-risk to demonstrate "advisory, not authoritative" since it's prose
  rather than a value that could be mistaken for a real field.
- **`corrective_actions` modeled as `hasMany` from `Defect`, not `hasOne`**,
  even though the brief's phrasing ("a linked corrective action," singular)
  could read either way — a follow-up corrective action after a failed fix
  attempt seemed like a realistic scenario worth not silently precluding.
- **Role differentiation kept minimal.** All three roles can run the
  shop-floor workflow identically; the only enforced rule is who may
  correct an already-submitted item. This directly follows "do not build
  a complex permission system," but is worth flagging as a scope choice
  rather than an accidental gap, since a reviewer might expect Quality
  Manager/Admin to have visibly different capabilities elsewhere.
- **`PHP_CLI_SERVER_WORKERS=4` set in `backend/.env.example`.** Found
  during browser testing that the single-threaded default caused multi-
  second request queuing under a real browser's concurrent fetches; set
  explicitly since it's a real, reproduced finding rather than a guess,
  and has no effect in a production php-fpm deployment.
- **Removed the placeholder `/api/ping` route** added during initial
  scaffolding once the real login flow made it redundant as a
  connectivity check, rather than leaving unused scaffold code in place.

## Process note

Built with Claude Code (unattended, per the user's explicit instruction
to plan once and proceed through every stage without stopping for
approval). Where a decision was genuinely the user's to make and not
resolvable from the brief or the code, the most sensible assumption was
made and documented above and in README.md, rather than blocking on it.
