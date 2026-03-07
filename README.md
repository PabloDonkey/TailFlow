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

Install backend and frontend dependencies:

```bash
make install
```

Then start both development servers:

```bash
make run
```

`make install` creates `backend/.venv`, installs the backend development dependencies, copies `backend/.env` from `backend/.env.example` when needed, and runs `npm install` in `frontend/`.

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

4. Update `backend/.env` so `DATABASE_URL` points to an existing PostgreSQL database.
   The default example uses:

   ```env
   DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/tailflow
   STORAGE_PATH=./storage/images
   MAX_UPLOAD_SIZE_MB=50
   CLASSIFIER_ENABLED=false
   ```

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

```bash
make run
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

```bash
make install
make run
```

## Notes

- Alembic reads the database connection from `backend/.env`.
- Uploaded files are stored under `backend/storage/images` by default.
- The frontend includes routes for gallery, upload, image details, and tag management.
