# Task Board

## TODO

- [ ] Phase 6 Slice C: convert legacy page components into thin compatibility shims or remove direct usage after redirect convergence.

## IN PROGRESS

- [ ] Phase 6 Slice C: implement remaining compatibility cleanup for legacy page components.

## DONE

- [x] Create Phase 6 implementation branch `feature/workspace-router-convergence-phase6`.
- [x] Add Phase 6 planning checklist at `.project/tasks/frontend-one-page-responsive-refactor-planning/implementation-checklist-phase6.md`.
- [x] Complete Phase 6 Slice A route policy lock for `/projects`, `/gallery`, `/image/:id`, and `/tags`.
- [x] Complete Phase 6 Slice B redirects in `frontend/src/router/index.ts` for `/gallery`, `/image/:id`, and `/tags`.
- [x] Add workspace query hydration (`panel`, `project`, `image`) in `frontend/src/pages/WorkspacePage.vue`.
- [x] Add route convergence regression tests in `frontend/src/__tests__/router-convergence.test.ts`.
- [x] Validate Phase 6 kickoff slice with full frontend checks (`npm run lint`, `npm run test`, `npm run build`).
- [x] Add 200ms delayed loading indicator behavior in workspace image viewer and image browser to prevent fast-load flash.
- [x] Split image store loading state (`imagesLoading`, `imageLoading`, `tagMutationLoading`) so image browser loading appears only on project image-list fetch.
- [x] Hide viewer previous/next/jump controls in mobile mode (`WorkspaceImageViewerPanel`).
- [x] Place mobile quick actions below workspace image area (`WorkspaceMobileQuickActions`).
- [x] Fix mobile workspace actions flow to open corresponding mobile panels (`WorkspacePage` handlers).
- [x] Reduce unnecessary image browser rerenders during image navigation using memoized left-panel composition (`WorkspacePage`).
- [x] Add deferred Playwright integration note to `ROADMAP.md` (explicitly out of current Phase 4 scope).
- [x] Add manual QA checklist and screenshot evidence template to `.project/tasks/frontend-one-page-responsive-refactor-planning/phase4-pr-summary.md`.
- [x] Add workspace layout containment regression tests (`frontend/src/__tests__/workspace-layout.test.ts`).
- [x] Prepare Phase 4 PR summary artifact under `.project/tasks/frontend-one-page-responsive-refactor-planning/phase4-pr-summary.md`.
- [x] Add focused regression tests for overlay click-outside dismissal and workspace layout containment.
- [x] Finalize Phase 4 validation with additional targeted regression tests.
- [x] Define next post-Phase-3 implementation target and acceptance criteria.
- [x] Phase 4 Slice A: implement workspace width/scroll containment/image sizing fixes with focused validation.
- [x] Phase 4 Slice B: move tagging mode/count into inspector and remove viewer metadata noise.
- [x] Phase 4 Slice C: fix project picker/actions overlay placement and desktop click-outside close.
- [x] Phase 4 Slice D: verify project management route continuity (`/projects` remains active and mapped to `UploadPage`).
- [x] Extract header slot composition into `frontend/src/components/layout/WorkspaceHeaderSection.vue`.
- [x] Run broader Phase 3 frontend stabilization checks (`npm run lint`, `npm run test`, `npm run build`).
- [x] Extract workspace header overlays into `frontend/src/components/layout/WorkspaceHeaderOverlays.vue`.
- [x] Validate header overlay composition extraction with frontend checks (`npm run lint`, `npm run test`).
- [x] Extract workspace mobile panel content switcher into `frontend/src/components/layout/WorkspaceMobilePanelContent.vue`.
- [x] Validate mobile panel content switcher extraction with frontend checks (`npm run lint`, `npm run test`).
- [x] Extract workspace desktop right-panel switcher into `frontend/src/components/layout/WorkspaceRightPanel.vue`.
- [x] Validate desktop right-panel switcher extraction with frontend checks (`npm run lint`, `npm run test`).
- [x] Extract mobile quick-actions bar into `frontend/src/components/layout/WorkspaceMobileQuickActions.vue`.
- [x] Extract mobile panel sheet markup into `frontend/src/components/layout/WorkspaceMobilePanelSheet.vue`.
- [x] Validate mobile component extraction slice with frontend checks (`npm run lint`, `npm run test`).
- [x] Extract workspace header action handlers into `frontend/src/composables/useWorkspaceHeaderActions.ts`.
- [x] Validate workspace header-actions composable slice with frontend checks (`npm run lint`, `npm run test`).
- [x] Extract workspace image-loading orchestration into `frontend/src/composables/useWorkspaceImages.ts`.
- [x] Validate workspace image-orchestration composable slice with frontend checks (`npm run test`, `npm run lint`).
- [x] Unify workspace overlay state management into `frontend/src/composables/useWorkspaceOverlayState.ts`.
- [x] Validate overlay-state composable slice with frontend checks (`npm run test`, `npm run lint`).
- [x] Add explicit mobile quick actions for image navigation and panel switching.
- [x] Validate mobile quick actions slice with frontend checks (`npm run test`, `npm run lint`).
- [x] Introduce a project picker panel/sheet from the workspace header action.
- [x] Validate project picker panel/sheet slice with frontend checks (`npm run test`, `npm run lint`).
- [x] Replace placeholder workspace overflow interaction with an explicit actions menu/sheet.
- [x] Validate actions menu/sheet slice with frontend checks (`npm run test`, `npm run lint`).
- [x] Move tags experience into a secondary workspace panel path while keeping `/tags` route available.
- [x] Reuse a shared tags library panel component in both `WorkspacePage` and `TagsPage`.
- [x] Validate tags panel migration with frontend checks (`npm run test`, `npm run lint`).
- [x] Switch default and post-onboarding navigation to workspace-first (`/` and onboarding now route to `/workspace`).
- [x] Validate workspace-first routing slice with frontend tests (`npm run test`).
- [x] Move tag mutation UI logic from `WorkspaceTagInspectorPanel` into `frontend/src/composables/useTagMutations.ts`.
- [x] Run broader frontend validation for Phase 2 (`npm run test`, `npm run lint`).
- [x] Run UI contract review for Phase 2 workspace panel refactor.
- [x] Run focused frontend tests for Phase 2 workspace panel flow.
- [x] Split `WorkspaceTagInspectorPanel` into smaller subcomponents to stay within UI contract target size.
- [x] Refactor `GalleryPage` / `ImageDetailPage` to reuse shared workspace panel logic.
- [x] Extract image browser, image viewer, and tag inspector into workspace panel components (Phase 2).
- [x] Update workflow guidance in `AGENTS.MD` and `.ai/rule.md` to require plan-first, iterative implementation with focused validation at each step.
- [x] Tighten `TagRead.catalog_ids` response validation to reject null/non-string values.
- [x] Add regression tests for `TagRead` catalog ID value validation.
- [x] Make `.githooks/pre-push` Python path resolution work for Unix and Windows virtualenv layouts.
- [x] Run targeted backend validation: `backend/tests/test_tags.py`.
- [x] Document `make test`, `make test-backend`, and `make test-frontend` in `AGENTS.MD`.
- [x] Document `make test`, `make test-backend`, and `make test-frontend` in `README.md`.
- [x] Add `When to Create a New Decision` trigger rules to `DECISIONS.md`.
- [x] Add Decision Trigger workflow rule to `AGENTS.MD`.
- [x] Define exact shell regions for desktop and mobile in the one-page tagging workspace.
- [x] Define the initial component tree for the frontend refactor.
- [x] Define the phased migration order from current routes/pages to the new shell structure.
- [x] Save planning artifacts for frontend one-page responsive refactor under `.project/tasks/frontend-one-page-responsive-refactor-planning/`.
- [x] Convert saved planning notes into an implementation checklist for Phase 1 shell scaffolding.
