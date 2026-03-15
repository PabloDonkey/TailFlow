# Phase 6 Implementation Checklist — Router Convergence

## Goal

Converge legacy page routes into the workspace-first flow so `/workspace` remains the canonical tagging experience while preserving safe compatibility redirects.



## Scope

- Keep `/workspace` + onboarding guard as the primary UX path.
- Replace legacy page-level navigation paths with redirect/shim behavior into workspace state.
- Preserve deep-link continuity for existing links where feasible.

## Out of Scope

- Playwright integration (tracked as deferred roadmap work).
- Backend feature changes.
- Large UI redesign unrelated to route convergence.

## Slice Plan

### Slice A — Route Policy Lock

- [x] Decide policy for each route: `/projects`, `/gallery`, `/image/:id`, `/tags`.
- [x] Document keep vs redirect behavior and rationale in this checklist.
- [x] Confirm whether `/projects` remains first-class during this phase.

Policy decisions:

- `/projects`: remove dedicated route and expose project management via workspace header actions panel.
- `/gallery`: remove dedicated route and page.
- `/image/:id`: remove dedicated route and page.
- `/tags`: remove dedicated route and page.

### Slice B — Router Redirect/State Mapping

- [x] Update `frontend/src/router/index.ts` to workspace-only primary routes with fallback to `/workspace`.
- [x] Ensure onboarding guards still work after route cleanup.
- [x] Preserve workspace query handling for panel/project/image context.

### Slice C — Legacy Page Shims

- [x] Convert `GalleryPage.vue`, `ImageDetailPage.vue`, and `TagsPage.vue` into thin compatibility wrappers or remove direct usage where router redirects replace them.
- [x] Apply `/projects` policy decision to `UploadPage.vue` and route registration.
- [x] Remove redundant page-level behavior duplicated by `WorkspacePage.vue`.

### Slice D — Tests + Tracking

- [x] Add/adjust route regression tests for legacy-path behavior and redirects.
- [x] Run focused tests for changed route/page files.
- [x] Update `.project/dev-loop.md` and `.project/tasks.md` after each completed slice.

## Validation Plan

Per-slice checks (minimum):

- `cd frontend && npm run test -- <focused tests>`
- `cd frontend && npm run lint`

Phase completion checks:

- `cd frontend && npm run lint`
- `cd frontend && npm run test`
- `cd frontend && npm run build`

## Notes

- Start with smallest behavior-preserving redirects first.
- Legacy routes/pages were fully removed in this phase after converging their behavior into workspace panels.
