# Project Manager Mode Refactor — Phase 1 Checklist

## Goal

Refactor workspace project management into a dedicated two-panel mode:

- Left: Project Browser (with Create Project button at top)
- Right: Project Details (metadata + upload)

Also make Tag Library a full-width single-layout mode.

## Approved UI Contract

- In project manager mode, hide image browser and image viewer.
- Project browser is on the left.
- Project details are on the right.
- Create Project button is inside the project browser at the top, before the first project card.
- Create Project opens a modal containing the existing create form.
- Metadata and upload sections appear only inside project details.
- Tag library is a one-layout full-width view.

## Slice Plan

### Slice A — Workspace Mode State + Layout Routing

1. [finished] Introduce explicit workspace mode orchestration (`tagging`, `projects`, `tag-library`) in `WorkspacePage`.
1. [finished] Route workspace action/menu events and query `panel` values into mode switching.
1. [finished] Hide image browser + image viewer when mode is `projects`.
1. [finished] Hide non-tag-library surfaces when mode is `tag-library`.

### Slice B — Project Browser Panel (Left)

1. [finished] Create a `ProjectBrowserPanel` component for left panel rendering in project manager mode.
1. [finished] Render Create Project button at top before project cards.
1. [finished] Render project cards with project name + class tag + status, and thumbnail/placeholder.
1. [finished] Select project from card click to drive right details panel.

### Slice C — Project Details Panel (Right)

1. [finished] Create a `ProjectDetailsPanel` component that hosts metadata + sync + upload sections.
1. [finished] Reuse existing `UploadPage` logic by extraction or composition.
1. [finished] Show empty state when no project selected.

### Slice D — Create Project Modal

1. [finished] Create modal component to host existing create form fields/validation.
1. [finished] Open modal from Project Browser button.
1. [finished] Close modal on cancel/success.
1. [finished] Refresh/select project state after successful creation.

### Slice E — Tag Library Full-Width Mode

1. [finished] Make tag library render as full-width single-layout mode in workspace.
1. [finished] Ensure desktop and mobile mode parity for tag library view.

### Slice F — Tests + Tracking

1. [finished] Add/adjust tests for workspace mode switching and conditional panel visibility.
1. [finished] Add tests for project browser card selection and create modal behavior.
1. [finished] Add tests for tag library full-width mode behavior.
1. [finished] Update `.project/dev-loop.md` and `.project/tasks.md` as each slice lands.

## Validation Plan

Per-slice focused checks:

- `cd frontend && npm run test -- <focused tests>`
- `cd frontend && npm run lint`

Phase completion checks:

- `cd frontend && npm run lint`
- `cd frontend && npm run test`
- `cd frontend && npm run build`
