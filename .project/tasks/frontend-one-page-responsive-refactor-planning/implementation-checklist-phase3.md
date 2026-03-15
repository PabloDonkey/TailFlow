# Phase 3 Implementation Checklist — Workspace-First Migration

## Goal

Continue the one-page workspace migration by reducing `WorkspacePage` complexity through safe extractions while preserving route compatibility and behavior.

## Scope

- Keep `/workspace` as primary flow
- Keep legacy routes compatible (`/projects`, `/gallery`, `/image/:id`, `/tags`)
- Extract orchestration and composition pieces from `WorkspacePage`
- Validate each slice with focused frontend checks

## Completed Slices

- [x] Switch default and post-onboarding routing to workspace-first (`/` and onboarding -> `/workspace`)
- [x] Move tags experience into workspace secondary panel path while preserving `/tags` route
- [x] Add explicit workspace actions menu/sheet for overflow actions
- [x] Add project picker panel/sheet from workspace header action
- [x] Add explicit mobile quick actions for navigation and panel switching
- [x] Extract tag mutation logic into `frontend/src/composables/useTagMutations.ts`
- [x] Extract workspace overlay state into `frontend/src/composables/useWorkspaceOverlayState.ts`
- [x] Extract workspace image loading/navigation orchestration into `frontend/src/composables/useWorkspaceImages.ts`
- [x] Extract workspace header action handlers into `frontend/src/composables/useWorkspaceHeaderActions.ts`
- [x] Extract mobile quick actions markup into `frontend/src/components/layout/WorkspaceMobileQuickActions.vue`
- [x] Extract mobile panel sheet markup into `frontend/src/components/layout/WorkspaceMobilePanelSheet.vue`
- [x] Extract desktop right-panel switcher into `frontend/src/components/layout/WorkspaceRightPanel.vue`
- [x] Extract mobile panel content switcher into `frontend/src/components/layout/WorkspaceMobilePanelContent.vue`
- [x] Extract header overlays composition into `frontend/src/components/layout/WorkspaceHeaderOverlays.vue`
- [x] Extract header slot composition into `frontend/src/components/layout/WorkspaceHeaderSection.vue`

## Remaining Slices

- [ ] Define the next post-Phase-3 migration target and acceptance criteria

## Validation Log

- [x] Repeated slice-level validation with `npm run lint`
- [x] Repeated slice-level validation with `npm run test`
- [x] Final Phase 3 broader validation and cleanup sweep (`npm run lint`, `npm run test`, `npm run build`)
