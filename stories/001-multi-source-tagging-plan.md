# Story 001 - Multi-source project tagging

## Goal

Implement shared global tags with per-project tagging mode, protected trigger/class assignments, source-aware imports from `e621` and `booru`, globally shared user-defined tags, and `.txt` sidecar tag sync.

## References

- `docs/tag-import-plan.md`
- `docs/project-dataset-workflow.md`

## Implementation checklist

### Phase 1 - Shared tag schema and project tagging mode

- [x] Add `Project.tagging_mode` with default `e621`
- [x] Redesign global `Tag` to use unique `name`
- [x] Add `catalog_ids` JSON field to `Tag`
- [x] Define how `category` is stored alongside shared tags
- [x] Create Alembic migration for the shared tag model and project tagging mode
- [x] Update backend schemas for the new tag and project fields

### Phase 2 - Tag import and catalog merge rules

- [x] Implement CSV import for `e621`
- [x] Implement CSV import for `booru`
- [x] Treat CSV `id` values as external source IDs only
- [x] Merge matching tags by `name`
- [x] Store per-source external IDs inside `catalog_ids`
- [x] Preserve or normalize category values during import
- [x] Make import idempotent

### Phase 3 - Shared image-tag assignment model

- [x] Update image-tag assignment schema to reference shared `tag_id`
- [x] Add ordering support so trigger is always first and class is always second
- [x] Add protection flags for trigger/class assignments
- [x] Ensure many images can reference the same shared tag
- [x] Propagate project trigger/class updates to assigned image tags

### Phase 4 - Backend tagging behavior

- [x] Use `tagging_mode` to resolve source-backed tags during tagging
- [x] Keep globally shared user-defined tags available in all modes
- [x] Reuse existing class tag if it already exists in the selected mode
- [x] Prevent trigger/class removal in backend validation
- [x] Define create-or-confirm behavior for unknown manual tags
- [x] Auto-create unknown tags as shared user-defined tags during non-interactive sync

### Phase 5 - Sync and sidecar `.txt` tags

- [x] During sync, detect sibling `.txt` files for dataset images
- [x] Parse `.txt` tags as comma-separated values
- [x] Trim whitespace and ignore empty values
- [x] Resolve tags by shared global name first
- [x] Use `catalog_ids` to determine whether a tag belongs to the active mode
- [x] Preserve trigger/class ordering after sidecar tag import

### Phase 6 - Frontend project and image tagging UI

- [x] Add project-level tagging mode controls in the project metadata view
- [x] Show protected trigger/class tags in the image detail view
- [x] Prevent trigger/class deletion in the UI
- [x] Add mode switch support for `e621` and `booru`
- [x] Keep globally shared user-defined tags available in either mode
- [x] Ask for confirmation before creating an unknown tag manually

### Phase 7 - Validation and polish

- [x] Add backend tests for shared tag import and `catalog_ids` merge behavior
- [x] Add backend tests for protected trigger/class rules
- [x] Add backend tests for `.txt` sidecar sync behavior
- [x] Add frontend tests for mode switching and unknown-tag confirmation
- [x] Review docs and update diagrams if implementation diverges from the current design

## Notes

- `stories/` is intentionally Git-ignored and meant for local execution tracking.
- Start with phases 1 to 3 before touching the UI so the data model and invariants are stable first.
