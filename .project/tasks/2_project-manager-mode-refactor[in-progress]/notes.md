# Notes

## Scope Lock

- Projects mode hides image browser + image viewer.
- Projects mode desktop layout is two panels:
  - Left: project browser
  - Right: project details
- Create Project control is a button at top of project browser (before first project card).
- Create form opens in modal.
- Metadata and upload remain in project details panel only.
- Tag library is full-width single-layout mode.

## Slice Progress

- Slice A complete:
  - Workspace mode orchestration in `WorkspacePage` (`tagging`, `projects`, `tag-library`)
  - Conditional rendering for projects/tag-library modes
  - Projects right panel uses details-only UploadPage embedding
- Slice B next:
  - Extract dedicated `ProjectBrowserPanel`
  - Move left projects scaffold from `WorkspacePage` into component
  - Add thumbnail/placeholder mapping per project
