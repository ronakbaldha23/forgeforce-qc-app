# ForgeForce QC App — Plan

## A. Architecture

Two independent apps in one repo, talking over JSON/HTTP:

- **`backend/`** — Laravel 13 (PHP 8.3), API-only. Auth via Sanctum personal access
  tokens (Bearer token, not cookie/SPA-stateful mode — avoids CORS/CSRF cookie
  complexity for a frontend served from a different Vite dev origin). Business
  logic lives in `app/Services/`; controllers stay thin (validate via Form
  Request → call service → return API Resource). Local disk storage for photos
  (`storage/app/public`), explicitly labeled as a stand-in for S3/cloud storage.
- **`frontend/`** — React + TypeScript (Vite), Tailwind CSS. Talks to the backend
  purely through a typed `src/lib/api.ts` client. React Router for navigation.
  No global state library — server state lives in hooks, UI state in components.

They run as two dev servers locally (`php artisan serve` :8000, `vite` :5173),
connected via CORS on the backend.

## B. Database Schema

```
users                     — id, name, email, password, role enum(engineer|quality_manager|admin)
machine_types              — id, name
machines                   — id, machine_type_id FK, code, serial_number, name, location
inspection_templates        — id, machine_type_id FK, name, version, is_active
inspection_template_items   — id, inspection_template_id FK, label, help_text, sort_order
inspections                 — id, machine_id FK, inspection_template_id FK, inspector_id FK(users),
                               status(draft|submitted), started_at, submitted_at
inspection_item_results     — id, inspection_id FK, inspection_template_item_id FK,
                               result(pass|fail|na), comment, updated_by FK(users)
                               [CURRENT state — one row per checklist item per inspection]
inspection_item_history     — id, inspection_item_result_id FK, previous_result, new_result,
                               previous_comment, new_comment, changed_by FK(users), changed_at,
                               change_reason
                               [APPEND-ONLY audit ledger — never updated/deleted]
defects                     — id, inspection_item_result_id FK, description, severity, status,
                               created_by FK(users)
attachments                 — id, defect_id FK, disk_path, original_filename, mime_type,
                               size_bytes, uploaded_by FK(users)
corrective_actions          — id, defect_id FK, description, assigned_to FK(users) nullable,
                               due_date, status, completion_notes, completed_at,
                               created_by FK(users)
ai_suggestions               — id, inspection_id FK nullable, defect_id FK nullable,
                               suggestion_type, input_snapshot(json), suggested_text, status,
                               reviewed_by FK(users) nullable, accepted_text
```

Notable choices:
- `machine_types` decouples checklist templates from individual machines — a
  template maps to a *type*, not a specific machine, so new machines of an
  existing type automatically get the right checklist.
- `attachments` is a plain FK to `defects`, not polymorphic — only defects need
  photos in this spec; a polymorphic table would be speculative generality.
- `corrective_actions` is `hasMany` from `Defect` (not `hasOne`) — a follow-up
  corrective action after a failed fix attempt is a realistic QC scenario, and
  `hasOne` would silently hide a second row rather than prevent one.
- `inspection_item_history` uses explicit `previous_result/new_result/previous_comment/new_comment`
  columns rather than a generic EAV-style field/old/new log — more directly
  auditable for the one entity this is graded on, see Section E.

## C. API Endpoints

```
POST   /api/login
POST   /api/logout
GET    /api/me

GET    /api/machines
GET    /api/machines/{id}
GET    /api/machines/{id}/inspections            -- history: past inspections summary

GET    /api/inspection-templates/for-machine/{machine}

POST   /api/inspections                          -- start inspection
GET    /api/inspections/{id}                      -- full detail incl. item results
PATCH  /api/inspections/{id}/submit

PUT    /api/inspection-items/{result}             -- update result/comment (writes history)
GET    /api/inspection-items/{result}/history

POST   /api/defects
PATCH  /api/defects/{id}
POST   /api/defects/{id}/attachments              -- multipart photo upload

POST   /api/corrective-actions
PATCH  /api/corrective-actions/{id}

POST   /api/ai/defect-summary                     -- {inspection_id}
```

Role gates via Laravel Policies + `role:` middleware alias — no custom
permission-matrix table.

## D. React Structure

```
src/
  lib/api.ts, lib/http.ts       -- typed fetch client
  hooks/                        -- useInspection(), useMachine(), etc. (data + mutations)
  types/                        -- shared TS types mirroring API resources
  pages/
    LoginPage
    MachineListPage
    MachineDetailPage           -- info + start inspection + past inspections
    InspectionRunPage           -- checklist runner (core tablet screen)
    InspectionHistoryPage       -- audit trail view
  components/
    checklist/ItemCard, ProgressBar
    defects/DefectForm, PhotoUpload
    corrective-actions/CorrectiveActionForm
    ai/AiSummaryPanel
    shared/Layout, RoleGate
```

## E. Audit Design — Pass → Fail Walkthrough

1. **Initial entry.** Engineer marks Safety Guard = Pass. A row is written to
   `inspection_item_results` (`result=pass`). In the same transaction, a row is
   written to `inspection_item_history`: `previous_result=null`,
   `new_result=pass`, `changed_by=<engineer>`, `changed_at=now()`,
   `change_reason='initial_entry'`.
2. **Submit.** `inspections.status='submitted'`. No item rows touched by
   submit itself.
3. **Later correction to Fail.** Never a plain `UPDATE`. A dedicated service
   (`InspectionItemResultService::updateResult()`) runs, inside one DB
   transaction:
   - Locks and reads the current `inspection_item_results` row.
   - Inserts a new `inspection_item_history` row: `previous_result='pass'`,
     `new_result='fail'`, `previous_comment`, `new_comment`,
     `changed_by=<current user>`, `changed_at=now()`. If the inspection is
     already `submitted`, `change_reason` is **required** by validation.
   - Only then updates `inspection_item_results.result='fail'`.
   - Both writes commit atomically.
4. **Consequence.** Because the item is now `fail`, the UI/API expects a
   `defects` row referencing this `inspection_item_result_id`.
5. **Read model.** Current-state queries read `inspection_item_results`;
   "what happened" queries read `inspection_item_history` ordered by
   `changed_at` — a complete, immutable, appendable-only ledger.
6. **Authorization.** Only the original engineer, a Quality Manager, or an
   Admin may edit an already-submitted item's result.

## F. AI Feature

**Feature:** defect summary generation from an inspection's failed items.

**Input:** the inspection's failed `inspection_item_results` (label + comment)
and any linked `defects` (description, severity) — no PII beyond
machine/inspector identifiers already in the domain.

**Output:** plain-text summary, stored in `ai_suggestions`
(`status='pending'`), never written into `defects.description` or anywhere
official automatically.

**Staying advisory-only:** the frontend renders it in a visually distinct
panel labeled "AI-generated summary — for review, not an official record."
`input_snapshot` is stored for traceability. If `ANTHROPIC_API_KEY` (or
similar) is present in `.env`, a real call is made; otherwise a clearly named
`MockAiSummaryService` produces a deterministic rule-based summary from the
same input — swapping real for mock is a one-class change behind a shared
interface.

## G. Explicitly Not Built (and why)

- No offline/PWA support — tablet UX means responsive + touch-friendly, not
  offline-first; true offline sync is a separate multi-day feature.
- No admin UI for authoring templates/machine types — seeded via migration.
- No email/push notifications for assigned corrective actions.
- No S3/cloud storage — local disk, clearly labeled.
- No fine-grained permission matrix beyond 3 roles + policies.
- No diff/version-comparison UI beyond a chronological history list.
- No CI pipeline.
- No soft-delete/undo on the audit trail — its entire purpose is to preserve
  history, not allow reverting it.
- No template-versioning UI (schema supports `inspection_templates.version`,
  but switching a machine's active template is a data change, not a feature).
