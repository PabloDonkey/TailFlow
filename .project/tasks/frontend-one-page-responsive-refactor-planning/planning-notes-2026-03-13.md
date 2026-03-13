# Frontend One-Page Refactor Planning Notes (2026-03-13)

## Selected Direction

- Primary pattern: **Option B (collapsible side-panel shell)**
- Blend: hide infrequent actions behind overflow/slide-over (Option A behavior)
- Product goal: one primary tagging workspace that adapts by breakpoint

## Exact Shell Regions

### Mobile

- Header: project name, project switch action, overflow action button
- Main region: active image only (single-focus)
- Sticky controls: previous/next/jump + browse/tags quick actions
- Overlays:
  - Project picker sheet
  - Image browse sheet
  - Tag editor sheet
  - Settings / tag library panel from overflow

### Desktop

- Header: project context + quick actions + overflow
- Left panel (default): image browser / thumbnails / sort
- Center panel: active image + navigation
- Right panel: tag inspector + metadata
- Secondary drawers: project settings, tag library, create project

## Initial Component Tree

### Shell primitives (build first)

- `AppShell`
- `AppHeader`
- `WorkspaceLayout`
- `SlideOverPanel`
- `BottomSheet`
- `OverflowMenu`

### Workspace and feature components

- `ProjectPickerPanel`
- `ProjectList`
- `ProjectCreateModal`
- `ProjectSettingsPanel`
- `ProjectUploadPanel`
- `ImageBrowserPanel`
- `ImageGrid`
- `ImageSortControl`
- `ImageWorkspace`
- `ImageViewer`
- `ImageNavigator`
- `TagInspector`
- `TagList`
- `AddTagForm`
- `TagsLibraryPanel`

### State/composable helpers

- `useWorkspaceShell`
- `useResponsivePanels`
- `useProjectSelection`
- `useImageNavigation`

## Route/Page Mapping to New Structure

- `OnboardingPage.vue` → keep dedicated onboarding route
- `UploadPage.vue` → split into project picker/settings/create/upload components
- `GalleryPage.vue` → convert into image browser panel inside workspace shell
- `ImageDetailPage.vue` → evolve into primary tagging workspace content
- `TagsPage.vue` → convert into secondary tags library panel/drawer

## Phased Migration Order

1. Introduce shell (`WorkspacePage`, header, layout) while preserving behavior
2. Extract image detail into workspace components (viewer/nav/tag inspector)
3. Convert gallery into browser panel and mount in shell
4. Split projects page into project panels/modals/actions
5. Move tags page into secondary panel/drawer
6. Simplify router to onboarding + workspace-first navigation
7. Responsive polish and workflow acceleration (density, shortcuts, defaults)

## Key UX Constraints

- Mobile: avoid showing too many controls simultaneously
- Desktop: avoid narrow centered layout; use multi-pane width
- Primary flow: project selection → tagging workspace
- Secondary flows (settings/tags): accessible but hidden by default
