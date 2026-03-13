# TailFlow Agent Guide

## Repository overview

TailFlow is a mobile-friendly image tagging application with a FastAPI backend and a Vue 3 frontend.
The repository is split into `backend/` for the API and persistence layer, and `frontend/` for the browser UI.

## Repo AI context

Persistent AI directives for this repository live under `.ai/`:

- `.ai/rule.md` - directive or instructional project rules

Active development context for this repository lives under `.project/`:

- `.project/dev-loop.md` - current development loop state
- `.project/tasks.md` - current task board

Bootstrap expectation for future sessions:

1. Read `.ai/rule.md` on startup before planning or implementation work.
2. Read `.project/dev-loop.md`.
3. Check `.project/tasks.md`.
4. Add new directive or instructional guidance to `.ai/rule.md`.

## Feature documentation

Feature documentation lives under `docs/`.
When a task touches a documented feature, read the relevant file in `docs/` before planning or implementation if it will help clarify product behavior or data modeling.

Current documented features:

- `docs/project-dataset-workflow.md` - filesystem-backed project discovery, dataset handling, metadata persistence, sync behavior, and class diagram

## UI contract

Frontend UI implementation and planning guidance lives in `.github/ui-contract.md`.
When a task involves frontend UI planning or implementation, read `.github/ui-contract.md` before planning or coding.

## Development Workflow

This repository uses a **Development Loop system** stored in `.project/dev-loop.md`.

Reusable Copilot skills for this workflow:

- `.copilot/skills/start-dev-session.md` (trigger: `start-dev-sess`)
- `.copilot/skills/update-dev-loop.md` (trigger: `update-dev-loop`)
- `.copilot/skills/ui-contract-review.md` (trigger: `ui-contract-review`)

Before starting development work:

1. Read `.project/dev-loop.md`
2. Check `.project/tasks.md`
3. Follow UI rules in `.github/ui-contract.md` if present.
4. When a Decision Trigger occurs, create a new entry in `DECISIONS.md` before implementing the change.

When finishing a work session:

* update `.project/dev-loop.md`
* update `.project/tasks.md`

The goal is to maintain enough context so development can resume quickly after interruptions.

## Tech stack

### Backend

- Python 3.11+ for local development
- FastAPI for the HTTP API
- SQLAlchemy 2.x async ORM
- Alembic for database migrations
- Pydantic v2 and `pydantic-settings` for schemas and environment-based configuration
- Psycopg 3 async driver for PostgreSQL
- `python-dotenv` for `.env` loading
- `python-multipart` for upload handling
- Pillow and `aiofiles` for image processing and file I/O

### Frontend

- Node.js 20+ for local development
- Vue 3 as the UI framework
- Vite 7 for dev server and build tooling
- TypeScript 5 for static typing
- Pinia for client-side state management
- Vue Router 4 for navigation
- Zod for runtime API validation

### Quality and test tooling

- Backend: `pytest`, `pytest-asyncio`, `httpx`, `aiosqlite`, `ruff`, `mypy`
- Frontend: `vitest`, `@vue/test-utils`, `happy-dom`, `eslint`, `vue-tsc`
- CI: GitHub Actions in `.github/workflows/ci.yml`

## Project infrastructure

### Repository layout

- `backend/app/` - FastAPI application code
  - `api/` - API routers and dependency wiring
  - `core/` - configuration
  - `db/` - SQLAlchemy base and database setup
  - `models/` - ORM models
  - `schemas/` - Pydantic schemas
  - `services/` - domain services
- `backend/alembic/` - migration environment and revisions
- `backend/tests/` - backend test suite
- `backend/storage/` - local image storage
- `frontend/src/` - Vue application source
  - `api/` - API client layer
  - `components/` - reusable UI components
  - `pages/` - route-level views
  - `router/` - Vue Router configuration
  - `stores/` - Pinia stores
- `.github/workflows/ci.yml` - CI pipeline definition
- `Makefile` - root development shortcuts
- `docs/` - feature documentation and design notes

### Runtime configuration

Backend configuration is loaded from `backend/.env` via `pydantic-settings`.
The example environment file defines split database settings plus runtime paths:

- `DATABASE_HOST`
- `DATABASE_PORT`
- `DATABASE_NAME`
- `DATABASE_USER`
- `DATABASE_PASSWORD`
- `PROJECTS_ROOT_PATH`
- `MAX_UPLOAD_SIZE_MB`
- `CLASSIFIER_ENABLED`

`PROJECTS_ROOT_PATH` is the configured root whose direct child folders are treated as projects for the project/dataset workflow.

### Data and API infrastructure

- Local development uses PostgreSQL through `psycopg`
- Alembic reads the database URL from app settings and applies migrations from `backend/alembic/`
- Backend tests use in-memory SQLite with `aiosqlite`
- The FastAPI app exposes `/health` and mounts application routes under `/api`
- CORS is currently configured permissively in `backend/app/main.py`

### Frontend development infrastructure

- The Vite dev server runs on port `5173` by default
- `/api` requests are proxied to `http://localhost:8000`
- Defined routes include gallery, upload, image detail, and tag management pages

### Local development workflow

Use the root `Makefile` for the standard setup:

```bash
make install
make run
make test
```

Important commands by area:

```bash
# Backend
cd backend
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -e ".[dev]"
alembic upgrade head
uvicorn app.main:app --reload
pytest
ruff check .
mypy .

# Frontend
cd frontend
npm install
npm run dev
npm run test
npm run lint
npm run typecheck
npm run build

# Root shortcuts
make test
make test-backend
make test-frontend
```

### Continuous integration

GitHub Actions runs two jobs on pushes and pull requests:

- Backend job: Python 3.12, install `backend` dev dependencies, run `pytest` and `ruff check .`
- Frontend job: Node 22, run `npm ci`, `npm run test`, and `npm run build`

## Infrastructure notes

- There are no Docker or Compose files in the repository at this time
- Local orchestration is centered on `make`, Python virtual environments, npm, and GitHub Actions
