# Development Loop

## Current Feature

Frontend one-page responsive refactor planning

## Current Step

IMPLEMENT

Possible values:
PLAN
IMPLEMENT
TEST
REFINE

## Objective

Implement Phase 1 of the frontend one-page refactor by scaffolding the workspace shell while preserving existing route behavior.

## Files involved

- .github/ui-contract.md
- frontend/src/App.vue
- frontend/src/router/index.ts
- frontend/src/pages/WorkspacePage.vue
- frontend/src/components/layout/AppShell.vue
- frontend/src/components/layout/AppHeader.vue
- frontend/src/components/layout/WorkspaceLayout.vue
- frontend/src/pages/GalleryPage.vue
- frontend/src/pages/ImageDetailPage.vue
- frontend/src/pages/TagsPage.vue
- frontend/src/pages/OnboardingPage.vue
- .project/tasks/frontend-one-page-responsive-refactor-planning/implementation-checklist-phase1.md

## Implementation Plan

1. scaffold shell primitives (header + layout + app shell)
2. add `WorkspacePage` and wire non-breaking `/workspace` route
3. keep existing routes operational during migration
4. begin Phase 2 extraction of gallery/detail/tags into shell panels

## Progress

- Updated `.github/ui-contract.md` to v2 with clearer component, layout, and implementation rules.
- Brainstormed two navigation models for the refactor: Option A (floating action menu) and Option B (collapsible side panel).
- Produced ASCII wireframes for both options on desktop and mobile.
- Defined exact shell regions for desktop and mobile, an initial component tree, and a phased migration order.
- Saved planning artifacts under `.project/tasks/frontend-one-page-responsive-refactor-planning/`.
- Created `implementation-checklist-phase1.md` from saved planning notes.
- Added initial shell scaffolding: `AppShell`, `AppHeader`, `WorkspaceLayout`, and `WorkspacePage`.
- Added a non-breaking `/workspace` route and navigation entry for preview.

## Next Action

Start Phase 2 by extracting image browsing and tagging UI from current pages into workspace panel components, then mount them inside `WorkspacePage`.

## Notes / Resources

See .project/tasks/frontend-one-page-responsive-refactor-planning/

## Notes

Update this file when stopping a development session so work can resume easily.
