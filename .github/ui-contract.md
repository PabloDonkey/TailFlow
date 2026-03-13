# UI Contract v2 — TailFlow Frontend

This contract defines how frontend UI is planned and implemented in TailFlow.
Copilot and contributors must follow it for all new or modified UI code.

---

## 1) Architecture Principles

- Use a component-based architecture.
- Prefer composition over duplicated markup.
- Components should be small, focused, and reusable.
- Target size: up to 150 lines per component; split when it grows beyond that.

---

## 2) Folder Conventions

Prefer this structure for new UI code:

```
src/
  components/
    ui/         # generic reusable UI primitives
    layout/     # layout containers
    sidebar/    # sidebar-focused components
    inspector/  # inspector-focused components
  pages/        # route-level views/pages
  composables/  # reusable stateful logic
```

Notes:

- Keep route-level UI in `pages/`.
- Put reusable visual building blocks in `components/`.
- Put reusable logic in `composables/`, not inside presentational UI components.

---

## 3) Component Design Rules

Reusable components must:

- accept props for configuration
- emit events for user actions
- avoid hardcoded business data
- support slots when flexible composition is needed
- prefer design-system UI primitives (for example, shared typography components) instead of raw repeated HTML tags with ad hoc page-level styling

Do not generate repeated static HTML blocks when a component is appropriate.

---

## 4) Repetition Rule

- If a pattern appears twice, consider extracting a component.
- If a pattern appears three times, extract a component.

---

## 5) Styling Rules

- Prefer Tailwind utility classes for styling.
- Avoid duplicated CSS and avoid inline styles.
- Scoped CSS is allowed only when utilities are insufficient (for example, pseudo-elements or complex selectors).
- Do not introduce new design tokens ad hoc; reuse existing project tokens and patterns.

---

## 6) Layout Rules

- Build layouts with Flexbox or CSS Grid.
- Avoid absolute positioning unless functionally required.

---

## 7) State and Logic Separation

- Keep UI components mostly presentational.
- Move business/stateful logic to `composables/` or stores.
- Components should consume prepared state instead of owning complex business workflows.

---

## 8) Naming Convention

- Use PascalCase component names.
- Use specific names (for example: `AppButton`, `SidebarItem`, `InspectorPanel`).
- Avoid vague names like `Box`, `Container`, or `Element`.

---

## 9) Definition of Done (UI Changes)

A UI task is complete when:

1. Reusable components are extracted where repetition exists.
2. Route/page files focus on composition, not large duplicated markup blocks.
3. Styling follows Tailwind-first rules and avoids unnecessary custom CSS.
4. Logic is placed in composables/stores when not purely presentational.
5. Naming and folder placement follow this contract.

---

## 10) Copilot Implementation Checklist

Before generating UI code:

1. Identify reusable pieces.
2. Decide component vs page responsibilities.
3. Implement reusable components first.
4. Compose them in the page.
5. Verify the Definition of Done checklist above.
