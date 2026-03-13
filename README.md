# TailFlow

TailFlow is a mobile-friendly image tagging app with a FastAPI backend and a Vue 3 frontend.

## Project structure

- `backend/` – FastAPI API, SQLAlchemy models, Alembic migrations
- `frontend/` – Vue 3 + Vite web app

## Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL

## Quick start from the repository root

### Linux

Install backend and frontend dependencies:

```bash
make install
```

Then start both development servers:

```bash
make run
```

`make install` creates `backend/.venv`, installs backend development dependencies, bootstraps `backend/.env` from `backend/.env.example` when needed, auto-generates a random `DATABASE_PASSWORD` when empty, and runs `npm install` in `frontend/`. `PROJECTS_ROOT_PATH` is configured through the web onboarding flow.
`make install` also enables repository-managed git hooks (`core.hooksPath=.githooks`), including a `pre-push` hook that blocks direct pushes to `main`.

### Windows (PowerShell)

Install backend and frontend dependencies:

```powershell
pwsh -File scripts/dev.ps1 install
```

Then start both development servers:

```powershell
pwsh -File scripts/dev.ps1 run
```

Stop running dev processes:

```powershell
pwsh -File scripts/dev.ps1 stop
```

The PowerShell script mirrors the Linux command surface with additional commands: `test`, `lint`, `typecheck`, and `build`.
`pwsh -File scripts/dev.ps1 install` also enables repository-managed git hooks (`core.hooksPath=.githooks`), including a `pre-push` hook that blocks direct pushes to `main`.

## Run the backend

1. Create and activate a virtual environment:

   ```bash
   cd backend
   python3 -m venv .venv
   source .venv/bin/activate
   ```

2. Install dependencies:

   ```bash
   python3 -m pip install -e ".[dev]"
   ```

3. Create a local environment file:

   ```bash
   cp .env.example .env
   ```

4. Update `backend/.env` so it points to an existing PostgreSQL database.
   The default example uses split database settings:

   ```env
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_NAME=tailflow_db
   DATABASE_USER=tailflow
   DATABASE_PASSWORD=generated-or-custom-password
   PROJECTS_ROOT_PATH=
   MAX_UPLOAD_SIZE_MB=50
   CLASSIFIER_ENABLED=false
   LOG_LEVEL=INFO
   REQUEST_LOGGING_ENABLED=true
   FILE_LOG_ENABLED=false
   FILE_LOG_PATH=./storage/logs/tailflow.log
   ```

   `PROJECTS_ROOT_PATH` can stay empty initially; the frontend onboarding page will request and save it.

   If you have PostgreSQL running locally, one possible setup is:

   ```bash
   createdb tailflow
   ```

5. Run the database migrations:

   ```bash
   alembic upgrade head
   ```

6. Start the API server:

   ```bash
   uvicorn app.main:app --reload
   ```

The backend will be available at `http://localhost:8000`, and a health check is exposed at `http://localhost:8000/health`.
Logs are emitted to stdout by default; optional file logging can be enabled with `FILE_LOG_ENABLED`, and request logging can be controlled with `LOG_LEVEL`, `REQUEST_LOGGING_ENABLED`, and `FILE_LOG_PATH`.

## Run the frontend

1. Install dependencies:

   ```bash
   cd frontend
   npm install
   ```

2. Start the Vite development server:

   ```bash
   npm run dev
   ```

The frontend usually starts at `http://localhost:5173`.
During development, Vite proxies `/api` requests to `http://localhost:8000`, so the backend should be running on port `8000`.

## Local development workflow

If you already completed the backend and frontend setup steps, you can start both dev servers together from the repository root:

Linux:

```bash
make run
```

Windows (PowerShell):

```powershell
pwsh -File scripts/dev.ps1 run
```

`make run` starts the FastAPI backend from `backend/.venv` and then launches the Vite frontend. Stop it with `Ctrl+C`, which also stops the backend process.

Start the backend in one terminal:

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload
```

Start the frontend in another terminal:

```bash
cd frontend
npm run dev
```

Then open `http://localhost:5173`.

## Useful commands

### Backend

```bash
cd backend
source .venv/bin/activate
pytest
ruff check .
mypy .
```

### Frontend

```bash
cd frontend
npm run test
npm run lint
npm run typecheck
npm run build
```

### Root shortcut

Linux:

```bash
make install
make run
make test
make test-backend
make test-frontend
```

Windows (PowerShell):

```powershell
pwsh -File scripts/dev.ps1 install
pwsh -File scripts/dev.ps1 run
pwsh -File scripts/dev.ps1 stop
pwsh -File scripts/dev.ps1 test
pwsh -File scripts/dev.ps1 lint
pwsh -File scripts/dev.ps1 typecheck
pwsh -File scripts/dev.ps1 build
```

## Notes

- Alembic reads the database connection from `backend/.env`.
- Uploaded files are stored under `backend/storage/images` by default.
- The frontend includes routes for gallery, upload, image details, and tag management.
