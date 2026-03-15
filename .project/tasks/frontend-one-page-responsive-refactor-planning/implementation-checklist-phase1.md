# Phase 1 Implementation Checklist — Workspace Shell Scaffolding

## Goal

Introduce the new one-page workspace shell structure without breaking existing route behavior.

## Scope

- Add shell primitives
- Add a `WorkspacePage` scaffold
- Add non-breaking `/workspace` route
- Keep current `/projects`, `/gallery`, `/image/:id`, and `/tags` behavior unchanged

## Tasks

- [x] Create `AppShell` layout component
- [x] Create `AppHeader` component with project context and placeholder quick actions
- [x] Create `WorkspaceLayout` component for desktop/mobile panel regions
- [x] Create `WorkspacePage` scaffold that composes shell components
- [x] Wire `/workspace` route while preserving current default redirects/navigation
- [x] Add panel components (`ImageBrowserPanel`, `ImageWorkspace`, `TagInspector`) and move existing page logic into them
- [x] Switch default post-onboarding route from `/projects` to `/workspace`
- [ ] Remove legacy top nav links once workspace shell is fully operational

## Validation

- [x] Frontend tests pass
- [ ] Existing routes still render
- [ ] `/workspace` loads and displays responsive shell regions
