# Task Board

## TODO

- [ ] Start next Phase 3 slice: extract workspace mobile panel content switcher (browser/inspector/tags) into a dedicated component.

## IN PROGRESS

- [ ] Implement workspace-first migration steps incrementally with focused validation.

## DONE

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
