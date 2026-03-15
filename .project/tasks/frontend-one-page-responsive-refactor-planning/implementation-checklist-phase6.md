# Phase 6 Implementation Checklist — Router Convergence

## Goal

Converge legacy page routes into the workspace-first flow so `/workspace` remains the canonical tagging experience while preserving safe compatibility redirects.

## Dependency Gate

Before code changes in this phase:

- [ ] Complete manual responsive QA in `.project/tasks/frontend-one-page-responsive-refactor-planning/phase4-pr-summary.md`.
- [ ] Capture and attach required Phase 4 screenshots in `.project/tasks/frontend-one-page-responsive-refactor-planning/phase4-pr-summary.md`.
- [ ] Record final QA status in the Phase 4 summary QA Result Log.

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

- `/projects`: keep first-class in Phase 6 for lower migration risk and project management continuity.
- `/gallery`: redirect to `/workspace?panel=browser`.
- `/image/:id`: redirect to `/workspace?image=<id>&project=<query.project?>`.
- `/tags`: redirect to `/workspace?panel=tags`.

### Slice B — Router Redirect/State Mapping

- [ ] Update `frontend/src/router/index.ts` so legacy routes redirect to workspace-compatible targets.
- [ ] Ensure onboarding guards still work after redirects.
- [ ] Preserve query parameters/state needed to hydrate workspace panel state.

### Slice C — Legacy Page Shims

- [ ] Convert `GalleryPage.vue`, `ImageDetailPage.vue`, and `TagsPage.vue` into thin compatibility wrappers or remove direct usage where router redirects replace them.
- [ ] Apply `/projects` policy decision to `UploadPage.vue` and route registration.
- [ ] Remove redundant page-level behavior duplicated by `WorkspacePage.vue`.

### Slice D — Tests + Tracking

- [ ] Add/adjust route regression tests for legacy-path behavior and redirects.
- [ ] Run focused tests for changed route/page files.
- [ ] Update `.project/dev-loop.md` and `.project/tasks.md` after each completed slice.

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
- Keep compatibility behavior explicit until final refactor completion sign-off.
