# Workspace Card System

## Purpose

The workspace is TailFlow's only real screen, and it is built as a registry of interchangeable **cards** rather than a fixed layout. This document explains that system: the contract a card implements, how the registry resolves it, and what to do to add one. Read it before touching anything under `frontend/src/pages/workspace/` or `frontend/src/cards/`.

This is the Open/Closed seam the architecture asks for. Adding a workflow surface should mean adding a card, not editing `WorkspacePage.vue`.

---

# The idea

`WorkspacePage.vue` never imports card components. It asks the registry for a config and renders it dynamically:

```vue
<component :is="config.component" v-bind="config.props" v-on="config.listeners" />
```

A card is therefore three things: a **component**, a **factory** that binds workspace state to that component's props, and a **meta** object describing where the card wants to live. The page knows about none of them individually.

```
WorkspacePage.vue
      │  buildWorkspaceCardConfig(cardId, state, actions)
      ▼
side-card-service.ts ──► workspaceCardFactories[cardId].build(...)
      │                          │
      │                          ▼
      │                   cards/<name>/<name>.side-card-factory.ts
      ▼
   SideCardConfig { component, props, listeners, headerActions? }
```

---

# Vocabulary

Defined in `frontend/src/pages/workspace/side-card-types.ts`.

* `SideViewId` - a card that lives in the left or right column: `image-browser`, `image-info`, `current-tags`, `ai-proposed-tags`, `tags-library`, `project-details`.
* `CenterCardId` - a card that occupies the centre: `canvas`, `project-browser`.
* `WorkspaceCardId` - the union of both. This is what the registry is keyed by.
* `ToggleCardId` - `SideViewId | 'canvas'`. The cards a user can open and close. **`project-browser` is deliberately absent** — it is not toggled, it appears when no project is selected.
* `WorkspaceCardColumn` - `'left' | 'center' | 'right'`.

---

# The contract

## `CardMeta`

Declarative placement and visibility. The card describes itself; the layout code decides nothing per-card.

```ts
type CardMeta = {
  name: string                      // human label, used in menus and panel headers
  draggable: boolean                // can the user reorder it between columns
  requiresProjectSelected: boolean
  defaultColumn: WorkspaceCardColumn
  defaultOrder: number              // sort key within the column
  isVisible: (context: { isOpen: boolean; selectedProjectId: string | null }) => boolean
}
```

Current registry:

| Card | Column | Order | Draggable | Open by default |
|---|---|---|---|---|
| `image-browser` | left | 10 | yes | yes |
| `canvas` | center | 10 | no | yes |
| `project-browser` | center | 20 | no | n/a (not toggleable) |
| `current-tags` | right | 20 | yes | yes |
| `ai-proposed-tags` | right | 30 | yes | yes |
| `tags-library` | right | 40 | yes | no |
| `project-details` | right | 50 | yes | no |
| `image-info` | right | 60 | yes | no |

`tags-library` is the only card with `requiresProjectSelected: false` among the side views — the global tag catalog is meaningful without a project.

Default open state lives separately, in `defaultToggleCardOpenState`. `defaultSideViewOrder(column)` derives initial column ordering by filtering on `defaultColumn` and sorting on `defaultOrder` — the numbers are spaced by 10 so a new card can slot between two existing ones without renumbering.

## `SideCardState` and `SideCardActions`

Every factory receives the same two objects. They are the entire surface a card is allowed to depend on — a card never imports a store directly.

`SideCardState` carries `selectedProjectId`, `selectedProject`, `projects`, `currentImageId`, `currentImage`, `currentImageTags`, `orderedImages`, `currentImageIndex`, `loading`, `error`, and `framed` (whether the card is rendered inside a panel chrome, which differs between desktop and mobile).

`SideCardActions` carries the callbacks: `selectImage`, `selectProject`, `showTaggingFromProjectBrowser`, `openCreateProject`, `discoverProjects`, `previousImage`, `nextImage`, `jumpToImage`, `deleteCurrentImage`, `setCurrentImageAsFeatured`, `uploadImagesToCurrentProject`, `replaceCurrentImage`, `addAiTag`, `removeAiTag`.

Adding a capability that several cards need means extending these types — that is the intended pressure point, and it is why the types are worth reading before designing a new card.

## `SideCardFactory`

```ts
interface SideCardFactory {
  build(cardId: WorkspaceCardId, state: WorkspaceCardState, actions: WorkspaceCardActions): WorkspaceCardConfig
}
```

Returns `{ component, props, listeners, headerActions? }`. `headerActions` is an optional second component rendered into the panel header — `image-canvas` and `project-browser` use it.

**Every `build()` opens with a defensive identity check** and throws if handed the wrong `cardId`. Follow the convention:

```ts
if (viewId !== 'image-info') {
  throw new Error(`imageInfoSideCardFactory cannot build config for viewId: ${viewId}`)
}
```

---

# Adding a card

1. Create `frontend/src/cards/<my-card>/`.
2. Add `MyCardCard.vue`. It receives plain props and emits plain events — no store imports, no `useRouter`.
3. Add `<my-card>.side-card-factory.ts` exporting `myCardCardMeta: CardMeta` and `myCardSideCardFactory: SideCardFactory`. Centre cards use the `.card-factory.ts` suffix and split meta into a separate `.card-meta.ts` file (see `image-canvas`, `project-browser`).
4. Add the id to the `SideViewId` (or `CenterCardId`) union in `side-card-types.ts`.
5. Register in `side-card-service.ts` — **two records**: `workspaceCardFactories` and `workspaceCardMeta`, plus `sideCardMeta` if it is a side view. TypeScript's `Record<WorkspaceCardId, …>` will fail the build until all are present, which is the intended guard rail.
6. Add a default to `defaultToggleCardOpenState` if it is toggleable.

Nothing else changes. If a new card requires editing `WorkspacePage.vue`, the requirement probably belongs in `SideCardState`/`SideCardActions` instead.

Shared card-internal building blocks live in `cards/shared/` (`TagActionRow`, `TagListFilterInput`, `TagsTextareaField`). Per the repetition rule in `UI_CONTRACT.md`, a pattern appearing three times gets extracted here.

---

# Composables

`WorkspacePage.vue` is thin because state lives in focused composables under `pages/workspace/`.

| File | Owns |
|---|---|
| `useWorkspacePanelState.ts` | `cardOpenState`, `leftViewOrder`/`rightViewOrder`, visible-id computeds, `centerPanel`, drag-and-drop reordering (`draggedSideView`, `sideDropIndicator`, the `handleSide*` handlers), `setViewOpen`, `closeView`, `ensureSideViewPlacement` |
| `useWorkspacePersistence.ts` | localStorage round-trip, sanitizing persisted state, cross-tab `storage` events, the startup restore sequence |
| `useWorkspaceRouteSync.ts` | Two-way sync between query params and selection state |
| `useWorkspaceCardRuntime.ts` | Assembles `workspaceCardState(framed)` and `workspaceCardActions()`, exposes `sideCardConfig`, `centerPanelConfig`, `mobileCanvasConfig`, `mobileProjectBrowserConfig` |
| `useWorkspaceViewport.ts` | `matchMedia('(max-width: 1023px)')` → `isMobileViewport` |
| `useWorkspaceMobileTabs.ts` | Mobile tab selection |
| `useWorkspaceProjectFlows.ts` | Create/discover project modal flow |
| `useWorkspaceAiTagActions.ts` | Add/remove of AI-proposed tags |

`centerPanel` is computed as the first visible of `['canvas', 'project-browser']` — that ordering is what makes the canvas take precedence once a project is selected.

---

# State that survives a reload

**Query params, not path segments.** The workspace route is `/workspace` with `?project=<uuid>`, `?image=<uuid>`, and `?panel=tags|projects|browser`. `useWorkspaceRouteSync` watches these. This means a workspace view is linkable and reloadable.

**localStorage, versioned.** Card layout persists under `tailflow.workspace-card-state.v1` (declared as `WORKSPACE_CARD_STATE_KEY` in `WorkspacePage.vue`). The AI card's collapsed-controls state uses `tailflow.ai-proposed-tags.controls-collapsed.v1`. **Keep the `.vN` suffix and bump it when the persisted shape changes incompatibly** — that is cheaper than writing a migration for a UI preference.

Persisted state is sanitized on read: unknown card ids are dropped and missing ones appended, so removing a card from the registry does not brick a returning user's layout.

**Splitter sizes** persist through Reka's `autoSaveId`, which varies with the visible layout shape: `workspace-tagging-layout-left-center-right`, `-left-center`, `-center-right`, `-center-only`. Sizes are therefore remembered per layout shape rather than being squashed when a column is hidden.

## Startup restore

`useWorkspacePersistence` gates the entire UI behind `isWorkspaceRestorePending` while it restores. The initial project fetch retries with exponential backoff — `STARTUP_PROJECT_FETCH_MAX_ATTEMPTS = 6`, base 250 ms, doubling — but **only for errors it classifies as transient**, matched by `/api\s(502|503|504)\b/` and similar. A backend that is merely slow to boot resolves on its own; a genuine 4xx fails fast.

This retry loop is also what masks a misconfigured dev proxy as "six seconds then an error" rather than an immediate connection failure. If the workspace hangs on "Loading workspace..." at startup, check the backend port before debugging the composable.

---

# Mobile and desktop are different UIs

They share every card and every composable, and diverge only in layout.

**Desktop** (`WorkspaceLayout.vue`) renders a Reka splitter with up to three columns, cards stacked within each, and drag-and-drop between columns.

**Mobile** (`WorkspaceMobileSplitLayout.vue`, `WorkspaceMobileViewsTabs.vue`) is a three-stage machine: `mobileStage` moves through `'project-browser' → 'image-browser' → 'workspace'`. In the workspace stage, `activeMobileBottomPanel` selects one of `current-tags`, `ai-proposed-tags`, `project-details`, `image-info`, with a draggable split percentage and per-panel view modes.

Because the two paths differ, **E2E specs tag their titles `@desktop` or `@mobile`**; the Playwright projects use `grepInvert` to route them. An untagged test runs on both. See `TESTING.md`.
