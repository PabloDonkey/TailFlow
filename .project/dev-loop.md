# Development Loop

## Current Feature

Frontend one-page responsive refactor planning

## Current Step

TEST

Possible values:
PLAN
IMPLEMENT
TEST
REFINE

## Objective

Implement Phase 2 of the frontend one-page refactor by extracting image browsing/viewing/tag-inspector UI into workspace panels while preserving existing route behavior.

## Files involved

- .github/ui-contract.md
- frontend/src/App.vue
- frontend/src/router/index.ts
- frontend/src/pages/WorkspacePage.vue
- frontend/src/components/layout/AppShell.vue
- frontend/src/components/layout/AppHeader.vue
- frontend/src/components/layout/WorkspaceLayout.vue
- frontend/src/components/layout/WorkspaceImageViewerPanel.vue
- frontend/src/components/sidebar/WorkspaceImageBrowserPanel.vue
- frontend/src/components/inspector/WorkspaceTagInspectorPanel.vue
- frontend/src/pages/GalleryPage.vue
- frontend/src/pages/ImageDetailPage.vue
- frontend/src/pages/TagsPage.vue
- frontend/src/pages/OnboardingPage.vue
- .project/tasks/frontend-one-page-responsive-refactor-planning/implementation-checklist-phase1.md

## Implementation Plan

1. scaffold shell primitives (header + layout + app shell)
2. add `WorkspacePage` and wire non-breaking `/workspace` route
3. keep existing routes operational during migration
4. extract image browser, image viewer, and tag inspector into workspace panel components
5. wire panel orchestration in `WorkspacePage` (selection + prev/next/jump + tag edits)
6. validate each iteration with error checks and focused tests

## Progress

- Updated `.github/ui-contract.md` to v2 with clearer component, layout, and implementation rules.
- Brainstormed two navigation models for the refactor: Option A (floating action menu) and Option B (collapsible side panel).
- Produced ASCII wireframes for both options on desktop and mobile.
- Defined exact shell regions for desktop and mobile, an initial component tree, and a phased migration order.
- Saved planning artifacts under `.project/tasks/frontend-one-page-responsive-refactor-planning/`.
- Created `implementation-checklist-phase1.md` from saved planning notes.
- Added initial shell scaffolding: `AppShell`, `AppHeader`, `WorkspaceLayout`, and `WorkspacePage`.
- Added a non-breaking `/workspace` route and navigation entry for preview.
- Implemented Phase 2 panel components:
	- `WorkspaceImageBrowserPanel`
	- `WorkspaceImageViewerPanel`
	- `WorkspaceTagInspectorPanel`
- Wired panel orchestration in `WorkspacePage` using existing stores while preserving legacy routes.
- Ran targeted compile/error checks for all modified Phase 2 frontend files.
- Updated agent workflow guidance to require plan-first + iterative validation loops.
- Refactored `GalleryPage` to reuse `WorkspaceImageBrowserPanel` while preserving `/image/:id?project=...` navigation behavior.
- Refactored `ImageDetailPage` to compose `WorkspaceImageViewerPanel` + `WorkspaceTagInspectorPanel` while preserving route-driven image context and next/previous/jump behavior.
- Ran focused frontend validation: `npm run test -- src/__tests__/gallery-page.test.ts src/__tests__/image-detail.test.ts` (pass).
- Ran UI contract review on Phase 2 workspace components and route composition.

## Next Action

Address non-blocking UI contract follow-ups (component size and logic extraction), then run a broader frontend validation pass for the Phase 2 refactor.

## Notes / Resources

See .project/tasks/frontend-one-page-responsive-refactor-planning/

## Notes

Update this file when stopping a development session so work can resume easily.
