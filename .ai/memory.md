# TailFlow AI Memory

- 2026-03-07T03:55:55.413Z - TailFlow stores repo-backed AI context under `.ai/`, separating directives in `.ai/rule.md` from dated, non-directive project memory in `.ai/memory.md`.
- 2026-03-07T03:55:55.413Z - TailFlow is split between `backend/` (FastAPI, SQLAlchemy 2, Pydantic v2) and `frontend/` (Vue 3, Vite, TypeScript, Pinia).
- 2026-03-07T03:55:55.413Z - The standard local workflow uses `make install` for setup and `make run` to start the backend and frontend together.
- 2026-03-07T03:55:55.413Z - Frontend API responses are validated with Zod schemas through a shared `fetchJSON` wrapper in `frontend/src/api/index.ts`.
- 2026-03-07T03:55:55.413Z - Pinia stores use composition-style stores with `loading` and `error` refs around async actions.
- 2026-03-07T03:55:55.413Z - Backend tests run against in-memory SQLite, and backend models favor SQLAlchemy's cross-database `sa.Uuid` type.
