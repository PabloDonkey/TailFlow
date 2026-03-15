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

1. [pending] Introduce explicit workspace mode orchestration (`tagging`, `projects`, `tag-library`) in `WorkspacePage`.
1. [pending] Route workspace action/menu events and query `panel` values into mode switching.
1. [pending] Hide image browser + image viewer when mode is `projects`.
1. [pending] Hide non-tag-library surfaces when mode is `tag-library`.

### Slice B — Project Browser Panel (Left)

1. [pending] Create a `ProjectBrowserPanel` component for left panel rendering in project manager mode.
1. [pending] Render Create Project button at top before project cards.
1. [pending] Render project cards with project name + class tag + status, and thumbnail/placeholder.
1. [pending] Select project from card click to drive right details panel.

### Slice C — Project Details Panel (Right)

1. [pending] Create a `ProjectDetailsPanel` component that hosts metadata + sync + upload sections.
1. [pending] Reuse existing `UploadPage` logic by extraction or composition.
1. [pending] Show empty state when no project selected.

### Slice D — Create Project Modal

1. [pending] Create modal component to host existing create form fields/validation.
1. [pending] Open modal from Project Browser button.
1. [pending] Close modal on cancel/success.
1. [pending] Refresh/select project state after successful creation.

### Slice E — Tag Library Full-Width Mode

1. [pending] Make tag library render as full-width single-layout mode in workspace.
1. [pending] Ensure desktop and mobile mode parity for tag library view.

### Slice F — Tests + Tracking

1. [pending] Add/adjust tests for workspace mode switching and conditional panel visibility.
1. [pending] Add tests for project browser card selection and create modal behavior.
1. [pending] Add tests for tag library full-width mode behavior.
1. [pending] Update `.project/dev-loop.md` and `.project/tasks.md` as each slice lands.

## Validation Plan

Per-slice focused checks:

- `cd frontend && npm run test -- <focused tests>`
- `cd frontend && npm run lint`

Phase completion checks:

- `cd frontend && npm run lint`
- `cd frontend && npm run test`
- `cd frontend && npm run build`
