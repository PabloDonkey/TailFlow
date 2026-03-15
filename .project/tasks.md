# Task Board

## TODO

1. [pending] Complete Slice A in `.project/tasks/2_project-manager-mode-refactor[in-progress]/implementation-checklist-phase1.md`.
1. [pending] Complete Slice B in `.project/tasks/2_project-manager-mode-refactor[in-progress]/implementation-checklist-phase1.md`.
1. [pending] Complete Slice C in `.project/tasks/2_project-manager-mode-refactor[in-progress]/implementation-checklist-phase1.md`.
1. [pending] Complete Slice D in `.project/tasks/2_project-manager-mode-refactor[in-progress]/implementation-checklist-phase1.md`.
1. [pending] Complete Slice E in `.project/tasks/2_project-manager-mode-refactor[in-progress]/implementation-checklist-phase1.md`.
1. [pending] Complete Slice F in `.project/tasks/2_project-manager-mode-refactor[in-progress]/implementation-checklist-phase1.md`.

## IN PROGRESS

1. [in-progress] Start project manager mode refactor using `.project/tasks/2_project-manager-mode-refactor[in-progress]/implementation-checklist-phase1.md`.

## DONE

1. [finished] Create Phase 6 implementation branch `feature/workspace-router-convergence-phase6`.
1. [finished] Add Phase 6 planning checklist at `.project/tasks/1_frontend-one-page-responsive-refactor-planning[closed]/implementation-checklist-phase6.md`.
1. [finished] Complete Phase 6 Slice A route policy lock for `/projects`, `/gallery`, `/image/:id`, and `/tags`.
1. [finished] Complete Phase 6 Slice B redirects in `frontend/src/router/index.ts` for `/gallery`, `/image/:id`, and `/tags`.
1. [finished] Add workspace query hydration (`panel`, `project`, `image`) in `frontend/src/pages/WorkspacePage.vue`.
1. [finished] Add route convergence regression tests in `frontend/src/__tests__/router-convergence.test.ts`.
1. [finished] Complete Phase 6 Slice C by converting `GalleryPage.vue`, `ImageDetailPage.vue`, and `TagsPage.vue` to compatibility redirects.
1. [finished] Add compatibility redirect tests for legacy pages (`gallery-page`, `image-detail`, `tags-page`).
1. [finished] Validate Phase 6 kickoff slice with full frontend checks (`npm run lint`, `npm run test`, `npm run build`).
1. [finished] Remove legacy routes and pages (`/projects`, `/gallery`, `/image/:id`, `/tags`) from router/page tree and keep workspace/onboarding as primary flows.
1. [finished] Move project management into workspace header actions via right-panel/mobile-panel project manager view.
1. [finished] Remove global app-level top navigation header and rely on workspace header composition.
1. [finished] Remove obsolete legacy-route shim tests and keep focused workspace/upload coverage.
1. [finished] Add 200ms delayed loading indicator behavior in workspace image viewer and image browser to prevent fast-load flash.
1. [finished] Split image store loading state (`imagesLoading`, `imageLoading`, `tagMutationLoading`) so image browser loading appears only on project image-list fetch.
1. [finished] Hide viewer previous/next/jump controls in mobile mode (`WorkspaceImageViewerPanel`).
1. [finished] Place mobile quick actions below workspace image area (`WorkspaceMobileQuickActions`).
1. [finished] Fix mobile workspace actions flow to open corresponding mobile panels (`WorkspacePage` handlers).
1. [finished] Reduce unnecessary image browser rerenders during image navigation using memoized left-panel composition (`WorkspacePage`).
1. [finished] Add deferred Playwright integration note to `ROADMAP.md` (explicitly out of current Phase 4 scope).
1. [finished] Add manual QA checklist and screenshot evidence template to `.project/tasks/1_frontend-one-page-responsive-refactor-planning[closed]/phase4-pr-summary.md`.
1. [finished] Add workspace layout containment regression tests (`frontend/src/__tests__/workspace-layout.test.ts`).
1. [finished] Prepare Phase 4 PR summary artifact under `.project/tasks/1_frontend-one-page-responsive-refactor-planning[closed]/phase4-pr-summary.md`.
1. [finished] Add focused regression tests for overlay click-outside dismissal and workspace layout containment.
1. [finished] Finalize Phase 4 validation with additional targeted regression tests.
1. [finished] Define next post-Phase-3 implementation target and acceptance criteria.
1. [finished] Phase 4 Slice A: implement workspace width/scroll containment/image sizing fixes with focused validation.
1. [finished] Phase 4 Slice B: move tagging mode/count into inspector and remove viewer metadata noise.
1. [finished] Phase 4 Slice C: fix project picker/actions overlay placement and desktop click-outside close.
1. [finished] Phase 4 Slice D: verify project management route continuity (`/projects` remains active and mapped to `UploadPage`).
1. [finished] Extract header slot composition into `frontend/src/components/layout/WorkspaceHeaderSection.vue`.
1. [finished] Run broader Phase 3 frontend stabilization checks (`npm run lint`, `npm run test`, `npm run build`).
1. [finished] Extract workspace header overlays into `frontend/src/components/layout/WorkspaceHeaderOverlays.vue`.
1. [finished] Validate header overlay composition extraction with frontend checks (`npm run lint`, `npm run test`).
1. [finished] Extract workspace mobile panel content switcher into `frontend/src/components/layout/WorkspaceMobilePanelContent.vue`.
1. [finished] Validate mobile panel content switcher extraction with frontend checks (`npm run lint`, `npm run test`).
1. [finished] Extract workspace desktop right-panel switcher into `frontend/src/components/layout/WorkspaceRightPanel.vue`.
1. [finished] Validate desktop right-panel switcher extraction with frontend checks (`npm run lint`, `npm run test`).
1. [finished] Extract mobile quick-actions bar into `frontend/src/components/layout/WorkspaceMobileQuickActions.vue`.
1. [finished] Extract mobile panel sheet markup into `frontend/src/components/layout/WorkspaceMobilePanelSheet.vue`.
1. [finished] Validate mobile component extraction slice with frontend checks (`npm run lint`, `npm run test`).
1. [finished] Extract workspace header action handlers into `frontend/src/composables/useWorkspaceHeaderActions.ts`.
1. [finished] Validate workspace header-actions composable slice with frontend checks (`npm run lint`, `npm run test`).
1. [finished] Extract workspace image-loading orchestration into `frontend/src/composables/useWorkspaceImages.ts`.
1. [finished] Validate workspace image-orchestration composable slice with frontend checks (`npm run test`, `npm run lint`).
1. [finished] Unify workspace overlay state management into `frontend/src/composables/useWorkspaceOverlayState.ts`.
1. [finished] Validate overlay-state composable slice with frontend checks (`npm run test`, `npm run lint`).
1. [finished] Add explicit mobile quick actions for image navigation and panel switching.
1. [finished] Validate mobile quick actions slice with frontend checks (`npm run test`, `npm run lint`).
1. [finished] Introduce a project picker panel/sheet from the workspace header action.
1. [finished] Validate project picker panel/sheet slice with frontend checks (`npm run test`, `npm run lint`).
1. [finished] Replace placeholder workspace overflow interaction with an explicit actions menu/sheet.
1. [finished] Validate actions menu/sheet slice with frontend checks (`npm run test`, `npm run lint`).
1. [finished] Move tags experience into a secondary workspace panel path while keeping `/tags` route available.
1. [finished] Reuse a shared tags library panel component in both `WorkspacePage` and `TagsPage`.
1. [finished] Validate tags panel migration with frontend checks (`npm run test`, `npm run lint`).
1. [finished] Switch default and post-onboarding navigation to workspace-first (`/` and onboarding now route to `/workspace`).
1. [finished] Validate workspace-first routing slice with frontend tests (`npm run test`).
1. [finished] Move tag mutation UI logic from `WorkspaceTagInspectorPanel` into `frontend/src/composables/useTagMutations.ts`.
1. [finished] Run broader frontend validation for Phase 2 (`npm run test`, `npm run lint`).
1. [finished] Run UI contract review for Phase 2 workspace panel refactor.
1. [finished] Run focused frontend tests for Phase 2 workspace panel flow.
1. [finished] Split `WorkspaceTagInspectorPanel` into smaller subcomponents to stay within UI contract target size.
1. [finished] Refactor `GalleryPage` / `ImageDetailPage` to reuse shared workspace panel logic.
1. [finished] Extract image browser, image viewer, and tag inspector into workspace panel components (Phase 2).
1. [finished] Update workflow guidance in `AGENTS.MD` and `.ai/rule.md` to require plan-first, iterative implementation with focused validation at each step.
1. [finished] Tighten `TagRead.catalog_ids` response validation to reject null/non-string values.
1. [finished] Add regression tests for `TagRead` catalog ID value validation.
1. [finished] Make `.githooks/pre-push` Python path resolution work for Unix and Windows virtualenv layouts.
1. [finished] Run targeted backend validation: `backend/tests/test_tags.py`.
1. [finished] Document `make test`, `make test-backend`, and `make test-frontend` in `AGENTS.MD`.
1. [finished] Document `make test`, `make test-backend`, and `make test-frontend` in `README.md`.
1. [finished] Add `When to Create a New Decision` trigger rules to `DECISIONS.md`.
1. [finished] Add Decision Trigger workflow rule to `AGENTS.MD`.
1. [finished] Define exact shell regions for desktop and mobile in the one-page tagging workspace.
1. [finished] Define the initial component tree for the frontend refactor.
1. [finished] Define the phased migration order from current routes/pages to the new shell structure.
1. [finished] Save planning artifacts for frontend one-page responsive refactor under `.project/tasks/1_frontend-one-page-responsive-refactor-planning[closed]/`.
1. [finished] Convert saved planning notes into an implementation checklist for Phase 1 shell scaffolding.
