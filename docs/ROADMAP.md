# TailFlow Roadmap

Deferred work only. For what is built versus planned at the workflow-module level, see the implementation status table in `ARCHITECTURE.md`.

## Deferred backend work

- Add real per-user request logging after backend auth or user identification exists. The current backend logging only records request metadata because there is no authenticated user context yet.

## Deferred frontend work

- Define the missing design tokens `--tf-color-accent`, `--tf-color-surface-alt`, and `--tf-radius-sm` in `frontend/src/style.css`. They are referenced across 19 files and currently resolve to nothing, so drag indicators, drop targets, and mobile tab highlights render unstyled. See `UI_CONTRACT.md`.

## Deferred cleanup

- Remove the legacy `images` / `image_tag` tables and `app/models/image.py`, together with the unused parts of `app/services/tagging.py`. They are reachable only through the `Tag.images` relationship. Requires a migration; see `DATABASE_MODEL.md`.
- Remove `frontend/src/pages/ProjectsPage.vue` and its test, or give it a route. It is currently unreachable from the router.
- Repair or delete `app/schemas/__init__.py`, which re-exports 11 of the 22 schemas defined in `app/schemas/project.py` and is bypassed by every caller.

## Completed

- **Playwright coverage of project creation, upload, and tagging mutations.** Previously deferred; `e2e/specs/project-workflows.spec.ts`, `workspace-card-current-tags.spec.ts`, and `workspace-card-ai-proposed-tags.spec.ts` now cover these flows across desktop and mobile.
