# Development Loop

## Current Feature

Frontend one-page responsive refactor (Phase 3 workspace-first migration)

## Current Step

IMPLEMENT

Possible values:
PLAN
IMPLEMENT
TEST
REFINE

## Objective

Implement Phase 3 workspace-first migration slices while preserving compatibility for legacy routes.

## Files involved

- .github/ui-contract.md
- frontend/src/App.vue
- frontend/src/router/index.ts
- frontend/src/pages/WorkspacePage.vue
- frontend/src/components/layout/AppShell.vue
- frontend/src/components/layout/AppHeader.vue
- frontend/src/components/layout/WorkspaceActionsMenu.vue
- frontend/src/components/layout/WorkspaceLayout.vue
- frontend/src/components/layout/WorkspaceImageViewerPanel.vue
- frontend/src/components/sidebar/WorkspaceImageBrowserPanel.vue
- frontend/src/components/sidebar/WorkspaceProjectPickerPanel.vue
- frontend/src/components/sidebar/WorkspaceTagsLibraryPanel.vue
- frontend/src/components/inspector/WorkspaceTagInspectorPanel.vue
- frontend/src/composables/useTagMutations.ts
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
7. switch default and onboarding redirects to `/workspace` while keeping legacy routes operational
8. move secondary flows (starting with tags library) into workspace panels/drawers incrementally

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
- Refactored `WorkspaceTagInspectorPanel` to orchestrate inspector subcomponents (`TagInspectorTagList`, `TagInspectorMutationControls`, `TagInspectorTagMetadata`) while preserving existing store interactions and behavior.
- Re-ran focused frontend validation after the split: `npm run test -- src/__tests__/image-detail.test.ts src/__tests__/gallery-page.test.ts` (pass).
- Extracted tag mutation logic from `WorkspaceTagInspectorPanel` into shared composable `frontend/src/composables/useTagMutations.ts` and kept inspector rendering/orchestration behavior unchanged.
- Ran broader frontend validation after extraction: `npm run test` (all tests passing) and `npm run lint` (pass).
- Implemented workspace-first routing slice: default `/` redirect now points to `/workspace`, and onboarding completion/configured redirects now route to `/workspace`.
- Validated the routing slice with `npm run test` (all frontend tests passing).
- Implemented tags-library secondary panel path in workspace flow by wiring `openOverflow` to toggle a reusable `WorkspaceTagsLibraryPanel` in the right panel.
- Refactored `/tags` route rendering to reuse `WorkspaceTagsLibraryPanel` so route compatibility is preserved during migration.
- Validated the tags-library migration slice with `npm run test` (pass) and `npm run lint` (pass).
- Replaced placeholder overflow behavior with an explicit `WorkspaceActionsMenu` (desktop + mobile-safe) and wired action handlers to switch between tag inspector and tags library panel states.
- Added overflow accessibility state to `AppHeader` via `aria-haspopup` and `aria-expanded` binding.
- Validated actions menu slice with `npm run test` (pass) and `npm run lint` (pass).
- Wired header project-picker action to a concrete `WorkspaceProjectPickerPanel` (desktop + mobile-safe), including refresh, selection, and close actions.
- Added project-picker accessibility state to `AppHeader` via `aria-haspopup` and `aria-expanded` binding.
- Ensured workspace overlays are mutually exclusive by closing actions menu when opening project picker (and vice versa).
- Validated project picker slice with `npm run test` (pass) and `npm run lint` (pass).

## Next Action

Implement the next Phase 3 slice by adding explicit mobile quick actions for image navigation and panel switching while preserving existing desktop behavior and route compatibility.

## Notes / Resources

See .project/tasks/frontend-one-page-responsive-refactor-planning/

## Notes

Update this file when stopping a development session so work can resume easily.
