# UI Contract

## Purpose

How frontend UI is planned and implemented in TailFlow. Applies to all new or modified UI code under `frontend/src/`.

For the workspace card system specifically — the registry, the card contract, how to add one — read `WORKSPACE_CARDS.md`. This document covers everything else.

---

# Architecture principles

* Component-based; prefer composition over duplicated markup.
* Components should be small and focused. **Target 150 lines**; split beyond that.
* Reusable logic belongs in `composables/` or stores, not inside presentational components.

## Folder conventions

```
src/
  cards/           one folder per workspace card (see WORKSPACE_CARDS.md)
    shared/        building blocks shared between cards
  components/
    ui/            generic primitives — AppButton, AppText, AppToaster
    layout/        layout containers — AppShell, WorkspaceLayout, WorkspacePanelCard
    header/        header-specific components
    projects/      project-specific components
  design-system/
    reka/          the ONLY place reka-ui may be imported
    motion/        the ONLY place motion-v may be imported
  pages/           route-level views
    workspace/     workspace composables and sub-components
  composables/     reusable stateful logic
  stores/          Pinia stores
  utils/           pure helpers
```

Route-level UI stays in `pages/`. Reusable visual building blocks go in `components/`. A component used by exactly one card belongs in that card's folder, not in `components/`.

---

# The design-system boundary

**`reka-ui` and `motion-v` may only be imported from `src/design-system/reka/**` and `src/design-system/motion/**`.**

This is enforced by `no-restricted-imports` in `frontend/eslint.config.js` — a violation fails lint and the pre-push hook, not just review. Everything else consumes the thin wrappers (`AppSplitterGroup`, `AppSelectField`, `AppToast`, `MotionSwipe`, …).

The point is that swapping or upgrading a third-party UI library touches one directory. Wrappers stay thin; most just forward `$props` and `$attrs`.

---

# Component design

Reusable components must:

* accept props for configuration
* emit events for user actions
* avoid hardcoded business data
* support slots when flexible composition is needed
* use design-system primitives rather than repeated raw HTML with ad-hoc page-level styling

Do not write repeated static HTML blocks where a component is appropriate.

**Repetition rule:** a pattern appearing twice is a candidate for extraction; a pattern appearing three times gets extracted.

---

# Styling

* Tailwind utilities first. Tailwind v4, configured through `@tailwindcss/vite` — there is no `tailwind.config.js`.
* Avoid duplicated CSS and inline styles. Scoped CSS only where utilities genuinely cannot do the job (pseudo-elements, complex selectors).
* **Do not introduce design tokens ad hoc.** Tokens are CSS custom properties declared in `src/style.css` and consumed as arbitrary values: `bg-[var(--tf-color-surface)]`, `rounded-[var(--tf-radius-lg)]`.

Defined tokens today:

`--tf-color-surface`, `--tf-color-surface-border`, `--tf-color-header-bg`, `--tf-color-header-action-bg`, `--tf-color-header-text`, `--tf-color-header-subtle`, `--tf-color-nav-text`, `--tf-color-text-title`, `--tf-color-text-default`, `--tf-color-text-muted`, `--tf-color-text-error`, `--tf-color-danger`, `--tf-color-success`, `--tf-space-2/3/4`, `--tf-radius-md/lg`.

> **Known gap.** 19 files reference `--tf-color-accent` (8), `--tf-color-surface-alt` (10), and `--tf-radius-sm` (9), none of which are defined in `style.css`. Those declarations resolve to nothing — drag indicators, drop targets, and mobile tab highlights are currently invisible or unstyled. Defining the three tokens is the fix; do not work around it by hardcoding colors at the call site.

## Layout

* Build with Flexbox or CSS Grid. Avoid absolute positioning unless functionally required.
* Mobile and desktop workspace layouts are genuinely different component trees driven by `useWorkspaceViewport`, not one tree with responsive classes. Respect that split rather than trying to unify it with breakpoints.

---

# State and logic separation

* Components stay mostly presentational and consume prepared state.
* Business and stateful logic lives in `composables/` or Pinia stores.
* Cards receive state and callbacks through the `SideCardState` / `SideCardActions` contract — **a card never imports a store directly.**

Store error convention: stores catch and stringify (`error.value = String(e)`), so error text reaches the UI verbatim. Some call sites string-match it (see `API.md`). Be aware before rewording anything user-facing that also flows through an error path.

---

# Naming

* PascalCase component names.
* Specific names: `AppButton`, `ProjectPickerPanel`, `WorkspacePanelCard`. Not `Box`, `Container`, `Element`, `Wrapper`.
* Prefer domain vocabulary from `DOMAIN_MODEL.md` — `DatasetImage`, not `ItemThing`.

---

# Definition of done

A UI change is complete when:

1. Reusable components are extracted where repetition exists.
2. Page and card files focus on composition, not large duplicated markup blocks.
3. Styling is Tailwind-first, uses existing tokens, and adds no ad-hoc ones.
4. Non-presentational logic sits in composables or stores.
5. Naming and folder placement follow this contract.
6. `npm run lint` and `npm run typecheck` are clean.
7. New behavior has a test — Vitest for components and composables, Playwright for user flows.

---

# Review checklist

When auditing existing UI against this contract — before refactoring a component-heavy area, or when raw HTML and duplicated styling are suspected — work through this list.

Scope first. To review only what changed on the current branch:

```bash
bash scripts/list_changed_vue_files.sh                 # branch changes + working tree
bash scripts/list_changed_vue_files.sh --committed-only
```

Then check for:

* raw repeated HTML where a shared primitive should be used
* duplicated or ad-hoc styling that should be extracted
* page files holding too much presentational markup
* business or state logic embedded in presentational components
* missing components where repetition exists
* naming or placement that violates the folder rules
* custom CSS that Tailwind utilities could express
* oversized components that should be split
* `reka-ui` / `motion-v` imports outside `design-system/`
* references to undefined design tokens

Report findings grouped by file, each naming the file, the affected component, the rule violated, why, a suggested fix direction, and an impact estimate (`low` / `medium` / `high`).

Order remediation lowest-risk first, separate primitive extraction from composition changes, and call out anything needing a product or UX decision. Prefer concise, actionable findings over prose. If the reviewed scope is compliant, say so plainly. If the scope is broad, propose a phased order rather than forcing one massive audit.
