# Development Loop

## Current Feature

Project manager mode refactor (Phase 1)

## Current Step

IMPLEMENT

Possible values:
PLAN
IMPLEMENT
TEST
REFINE

## Objective

Implement project manager mode with a two-panel layout (left project browser, right project details), create-project modal flow, and full-width tag library mode.

## Files involved

- .github/ui-contract.md
- frontend/src/App.vue
- frontend/src/router/index.ts
- frontend/src/pages/WorkspacePage.vue
- frontend/src/components/layout/AppShell.vue
- frontend/src/components/layout/AppHeader.vue
- frontend/src/components/layout/WorkspaceActionsMenu.vue
- frontend/src/components/layout/WorkspaceMobileQuickActions.vue
- frontend/src/components/layout/WorkspaceMobilePanelSheet.vue
- frontend/src/components/layout/WorkspaceMobilePanelContent.vue
- frontend/src/components/layout/WorkspaceRightPanel.vue
- frontend/src/components/layout/WorkspaceHeaderOverlays.vue
- frontend/src/components/layout/WorkspaceHeaderSection.vue
- frontend/src/components/layout/WorkspaceLayout.vue
- frontend/src/components/layout/WorkspaceImageViewerPanel.vue
- frontend/src/components/inspector/TagInspectorTagList.vue
- frontend/src/components/sidebar/WorkspaceImageBrowserPanel.vue
- frontend/src/components/sidebar/WorkspaceProjectPickerPanel.vue
- frontend/src/components/sidebar/WorkspaceTagsLibraryPanel.vue
- frontend/src/components/inspector/WorkspaceTagInspectorPanel.vue
- frontend/src/components/projects/ProjectBrowserPanel.vue
- frontend/src/components/projects/ProjectDetailsPanel.vue
- frontend/src/components/projects/ProjectCreateModal.vue
- frontend/src/composables/useTagMutations.ts
- frontend/src/composables/useWorkspaceOverlayState.ts
- frontend/src/composables/useWorkspaceImages.ts
- frontend/src/composables/useWorkspaceHeaderActions.ts
- frontend/src/composables/useProjectManagerForm.ts
- frontend/src/__tests__/workspace-overlays.test.ts
- frontend/src/__tests__/project-browser-panel.test.ts
- frontend/src/__tests__/project-create-modal.test.ts
- frontend/src/pages/OnboardingPage.vue
- .project/tasks/2_project-manager-mode-refactor[in-progress]/implementation-checklist-phase1.md
- .ai/rule.md
- AGENTS.MD
- DECISIONS.md
- TESTING.md
- frontend/playwright.config.ts
- frontend/e2e/fixtures/mockApi.ts
- frontend/e2e/pages/OnboardingPageObject.ts
- frontend/e2e/pages/WorkspacePageObject.ts
- frontend/e2e/specs/onboarding.spec.ts
- frontend/e2e/specs/workspace-modes.spec.ts
- frontend/vitest.config.ts
- frontend/.gitignore
- frontend/package.json
- .github/workflows/ci.yml
- Makefile

## Implementation Plan

1. add explicit workspace mode state (`tagging`, `projects`, `tag-library`) and route actions/query through it
2. in projects mode, hide image browser + image viewer and render two-panel manager layout
3. implement left `ProjectBrowserPanel` with top create button and project cards (thumbnail + name + class + status)
4. implement right `ProjectDetailsPanel` with metadata/sync/upload and empty-state when no selection
5. move create form into `ProjectCreateModal` opened from browser top button
6. make tag library a full-width single-layout mode
7. validate with focused tests and full frontend lint/test/build, then update trackers

## Progress

- Updated `.github/ui-contract.md` to v2 with clearer component, layout, and implementation rules.
- Brainstormed two navigation models for the refactor: Option A (floating action menu) and Option B (collapsible side panel).
- Produced ASCII wireframes for both options on desktop and mobile.
- Defined exact shell regions for desktop and mobile, an initial component tree, and a phased migration order.
- Saved planning artifacts under `.project/tasks/1_frontend-one-page-responsive-refactor-planning[closed]/`.
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
- Added a mobile-only sticky quick actions bar in `WorkspacePage` for previous/next navigation and direct panel switching.
- Added a mobile workspace panel sheet to expose image browser, tag inspector, and tags library flows that are otherwise desktop-side panels.
- Updated image selection flow to close the mobile panel after choosing an image.
- Validated mobile quick actions slice with `npm run test` (pass) and `npm run lint` (pass).
- Extracted workspace overlay/panel orchestration logic into reusable composable `useWorkspaceOverlayState` to simplify `WorkspacePage` state management.
- Updated `WorkspacePage` to consume composable-provided state/actions for project picker, actions menu, mobile panel controls, and inspector/tags panel switching.
- Validated overlay-state composable slice with `npm run test` (pass) and `npm run lint` (pass).
- Extracted workspace image bootstrap/loading and navigation orchestration into reusable composable `useWorkspaceImages`.
- Refactored `WorkspacePage` to consume composable-provided image state/actions (`orderedImages`, index tracking, select/jump/previous/next handlers).
- Validated workspace image-orchestration composable slice with `npm run test` (pass) and `npm run lint` (pass).
- Extracted workspace header action handlers (project refresh + project selection from picker) into reusable composable `useWorkspaceHeaderActions`.
- Refactored `WorkspacePage` to consume composable-provided header handlers while preserving existing picker close behavior.
- Validated workspace header-actions composable slice with `npm run lint` (pass) and `npm run test` (pass).
- Extracted mobile quick actions bar markup into dedicated component `WorkspaceMobileQuickActions`.
- Extracted mobile panel sheet overlay/sheet markup into dedicated component `WorkspaceMobilePanelSheet`.
- Refactored `WorkspacePage` to compose new mobile components while preserving mobile browser/inspector/tags flows.
- Validated mobile component extraction slice with `npm run lint` (pass) and `npm run test` (pass).
- Extracted desktop right-panel switcher (`WorkspaceTagInspectorPanel` vs `WorkspaceTagsLibraryPanel`) into dedicated composition component `WorkspaceRightPanel`.
- Refactored `WorkspacePage` to consume `WorkspaceRightPanel` and remove inline right-slot switching markup.
- Validated desktop right-panel switcher extraction with `npm run lint` (pass) and `npm run test` (pass).
- Extracted mobile panel content switching (`browser` / `inspector` / `tags`) into dedicated composition component `WorkspaceMobilePanelContent`.
- Refactored `WorkspacePage` mobile sheet content area to consume `WorkspaceMobilePanelContent` and remove inline branch markup.
- Validated mobile panel content switcher extraction with `npm run lint` (pass) and `npm run test` (pass).
- Extracted header overlays (`WorkspaceProjectPickerPanel` + `WorkspaceActionsMenu`) into dedicated composition component `WorkspaceHeaderOverlays`.
- Refactored `WorkspacePage` header slot to consume `WorkspaceHeaderOverlays` and remove inline overlay branch markup.
- Validated header overlay composition extraction with `npm run lint` (pass) and `npm run test` (pass).
- Extracted header slot composition (`AppHeader` + `WorkspaceHeaderOverlays`) into dedicated component `WorkspaceHeaderSection`.
- Refactored `WorkspacePage` to consume `WorkspaceHeaderSection` and remove inline header-slot composition markup.
- Ran broader Phase 3 stabilization sweep: `npm run lint` (pass), `npm run test` (pass), `npm run build` (pass).
- Defined the post-Phase-3 target as Phase 4 Workspace UX Convergence with acceptance criteria.
- Created implementation branch `feature/workspace-ux-convergence-phase4` for Phase 4 delivery work.
- Implemented Phase 4 Slice A: workspace route now runs full-width without the global 768px cap and uses height/overflow containment to prevent desktop page scrolling.
- Updated workspace panel layout (`WorkspaceLayout` + `AppShell` + `WorkspacePage`) so desktop side panels scroll internally while the page remains viewport-bounded.
- Updated `WorkspaceImageViewerPanel` to consume available center panel space with aspect-ratio-preserving image fit.
- Implemented Phase 4 Slice B: moved tagging metadata (mode + count) into `WorkspaceTagInspectorPanel` and reduced viewer content to image + navigation controls.
- Implemented protected-tag UX rule by hiding remove controls for protected tags in `TagInspectorTagList`.
- Implemented Phase 4 Slice C: repositioned project picker/actions overlays below the header and enabled click-outside close on desktop and mobile.
- Improved header project-title readability with explicit high-contrast text styling.
- Updated affected test expectations in `frontend/src/__tests__/image-detail.test.ts`.
- Removed legacy routes/pages (`/projects`, `/gallery`, `/image/:id`, `/tags`) and switched router to workspace/onboarding with catch-all workspace fallback.
- Integrated project-management UI into workspace actions by adding a projects panel mode in `WorkspaceRightPanel` and `WorkspaceMobilePanelContent`.
- Removed the app-level nav header in `frontend/src/App.vue` so workspace header is the primary in-app header surface.
- Removed legacy page/shim tests and validated current coverage set with full frontend lint/test/build (pass).
- Added focused overlay regression coverage in `frontend/src/__tests__/workspace-overlays.test.ts` for below-header placement and backdrop-close behavior.
- Completed Phase 6 Slice C by converting `frontend/src/pages/GalleryPage.vue`, `frontend/src/pages/ImageDetailPage.vue`, and `frontend/src/pages/TagsPage.vue` to compatibility redirect shims.
- Replaced legacy page tests with shim-focused coverage for gallery and image detail flows, and added `frontend/src/__tests__/tags-page.test.ts`.
- Re-ran focused route and shim tests plus full frontend validation (`npm run lint`, `npm run test`, `npm run build`).
- Added workspace layout containment regression coverage in `frontend/src/__tests__/workspace-layout.test.ts`.
- Validated with focused frontend tests, then full frontend checks: `npm run lint`, `npm run test`, `npm run build` (pass).
- Created Phase 4 PR summary artifact at `.project/tasks/1_frontend-one-page-responsive-refactor-planning[closed]/phase4-pr-summary.md` with scope, acceptance-criteria mapping, and validation evidence.
- Added a structured manual QA checklist and screenshot evidence template to `.project/tasks/1_frontend-one-page-responsive-refactor-planning[closed]/phase4-pr-summary.md`.
- Hid viewer previous/next/jump controls on mobile by restricting viewer nav controls to `lg` and up.
- Changed `WorkspaceMobileQuickActions` from sticky overlay behavior to normal flow placement below workspace content.
- Fixed mobile workspace actions behavior by routing header action selections to mobile panel openings (`tags` / `inspector`) when in mobile viewport.
- Reduced unnecessary image-browser rerenders during image selection/navigation via memoized left-panel composition in `WorkspacePage`.
- Added a deferred Playwright integration note to `ROADMAP.md` for future E2E automation (explicitly out of current phase scope).
- Re-ran focused regression tests and full frontend validation (`npm run lint`, `npm run test`, `npm run build`) after these updates.
- Addressed follow-up performance/UX issue where image-browser appeared to re-render on navigation: split image store loading into operation-specific flags and bound browser loading UI to `imagesLoading` only.
- Updated viewer loading bindings to use `imageLoading` and tag mutation loading to use `tagMutationLoading`.
- Added a shared delayed-loading composable (`200ms` threshold) and applied it to workspace image viewer/browser loading indicators to avoid fast loading flashes.
- Re-validated with focused tests (`gallery-page`, `image-detail`, `workspace-overlays`, `workspace-layout`) and full frontend checks (pass).
- Created Phase 6 implementation branch: `feature/workspace-router-convergence-phase6`.
- Added Phase 6 checklist artifact at `.project/tasks/1_frontend-one-page-responsive-refactor-planning[closed]/implementation-checklist-phase6.md`.
- Completed Phase 6 Slice A route policy lock with explicit keep/redirect decisions.
- Implemented initial Phase 6 Slice B redirects in `frontend/src/router/index.ts` for `/gallery`, `/image/:id`, and `/tags`.
- Added workspace query hydration in `frontend/src/pages/WorkspacePage.vue` for `panel`, `project`, and `image` query values.
- Started project-manager refactor branch `feature/project-manager-mode-refactor-phase1`.
- Added phase checklist at `.project/tasks/2_project-manager-mode-refactor[in-progress]/implementation-checklist-phase1.md`.
- Completed Slice A in `WorkspacePage` with explicit workspace modes (`tagging`, `projects`, `tag-library`) and conditional rendering:
	- projects mode hides image browser + image viewer and shows project-manager layout scaffold.
	- tag-library mode renders single-layout full-width tags view.
	- tagging mode preserves existing browser/viewer/inspector flow.
- Updated `UploadPage`/`WorkspaceRightPanel` integration so projects view can render details-only panel content.
- Validated Slice A via focused tests (`workspace-layout`, `workspace-overlays`, `upload-page`) and broader frontend checks (`npm run lint`, `npm run build`).
- Completed Slice B by extracting `frontend/src/components/projects/ProjectBrowserPanel.vue` and wiring it into `WorkspacePage` for projects mode left-panel rendering.
- Added project card status labels (`Active`/`Missing` from `missing_at`) while preserving thumbnail placeholder, class tag metadata, and card-based project selection behavior.
- Validated Slice B with focused frontend tests (`workspace-layout`, `workspace-overlays`, `upload-page`) and `npm run lint` (pass).
- Completed Slice C by introducing `frontend/src/components/projects/ProjectDetailsPanel.vue` and routing projects mode right-panel rendering through it.
- Implemented explicit no-selection empty state in `ProjectDetailsPanel` and reused existing metadata/sync/upload functionality via `UploadPage` `details-only` composition.
- Completed Slice D by introducing `frontend/src/components/projects/ProjectCreateModal.vue` and wiring modal open/close/create handlers in `WorkspacePage`.
- Added focused modal coverage in `frontend/src/__tests__/project-create-modal.test.ts` and validated with focused frontend tests (`workspace-layout`, `workspace-overlays`, `upload-page`, `project-create-modal`) plus `npm run lint` (pass).
- Confirmed Slice E full-width tag-library mode behavior in workspace and added mode-specific regression coverage in `frontend/src/__tests__/workspace-page-modes.test.ts`.
- Completed Slice F testing scope with `frontend/src/__tests__/project-browser-panel.test.ts` covering card ordering/selection and create-button interactions.
- Ran full frontend validation at phase completion: `npm run lint`, `npm run test`, `npm run build` (pass).
- Added explicit AI testing authority rules in `AGENTS.MD` and `.ai/rule.md`: tests are source of truth, no existing test edits without explicit user authorization.
- Added ADR-009 in `DECISIONS.md` to formalize accessibility-first E2E policy and agent constraints.
- Created root `TESTING.md` as canonical testing guide for backend/frontend/e2e layers, selector hierarchy, responsive strategy, and references.
- Added Playwright foundation in frontend (`playwright.config.ts`, `e2e/specs`, `e2e/pages`, `e2e/fixtures`) using Page Object Model and API mocking for deterministic onboarding/workspace coverage.
- Added frontend scripts `test:e2e`, `test:e2e:ui`, and `test:e2e:headed`; added root `make test-e2e`.
- Integrated E2E gate into frontend CI with Chromium install and Playwright report artifact upload on failure.
- Updated `frontend/vitest.config.ts` to exclude `e2e/**` from Vitest collection.
- Ran validation after fixes: `npm run lint` (pass), `npm run test` (pass), `npm run test:e2e` (pass).

## Next Action

Expand Playwright E2E coverage to project creation/upload and tagging mutation flows while preserving accessibility-first locator and Page Object rules.

## Notes / Resources

See .project/tasks/2_project-manager-mode-refactor[in-progress]/

## Notes

Update this file when stopping a development session so work can resume easily.
