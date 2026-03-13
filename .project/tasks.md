# Task Board

## TODO

- [ ] Split `WorkspaceTagInspectorPanel` into smaller subcomponents to stay within UI contract target size.
- [ ] Move tag mutation UI logic from `WorkspaceTagInspectorPanel` into a composable or store helper.
- [ ] Run broader frontend validation for Phase 2 (`npm run test`, optional `npm run lint`).

## IN PROGRESS

- [ ] Validate and stabilize Phase 2 workspace panel extraction with broader frontend checks.

## DONE

- [x] Run UI contract review for Phase 2 workspace panel refactor.
- [x] Run focused frontend tests for Phase 2 workspace panel flow.
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
