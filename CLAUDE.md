# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

TailFlow is a single-user, offline, local workstation for creating furry SDXL LoRAs. **What exists today is the dataset and tagging slice only** — project discovery, dataset image management, tag catalogs, AI tag proposals. Sanitization, export, training, and evaluation are documented vision with no code behind them; see the status table in `docs/ARCHITECTURE.md` before assuming a module exists.

## Commands

Backend is Python 3.11+ with its own venv at `backend/.venv`. Frontend is Node 20+ (CI uses 22). Postgres runs in Docker.

```bash
make install                         # venv + backend deps + .env bootstrap + git hooks + npm install
make run                             # db-up, migrate, uvicorn :8001, vite :5173 (Ctrl-C stops both)
make stop                            # kill only TailFlow's listeners on 8001/5173/5174
make db-up / make db-down            # Postgres container only

make test                            # = test-backend + test-frontend. Does NOT include e2e or assets.
make test-backend                    # pytest, in backend/
make test-frontend                   # vitest run, in frontend/
make test-e2e                        # Playwright; mocks the API, never hits the real backend
make test-assets                     # checksum-validate the tag CSVs in assets/

cd backend  && ./.venv/bin/python -m pytest tests/test_projects.py -k sync   # single test
cd backend  && ./.venv/bin/python -m ruff check . && ./.venv/bin/python -m mypy .
cd frontend && npm run lint && npm run typecheck
cd frontend && npm run test:browser  # vitest browser mode; no Make target

python scripts/import_tags.py --source all   # seed tag catalogs — MANUAL, nothing runs it for you
scripts/db_services.sh reset                 # drop the Postgres volume and start clean
```

Before finishing a nontrivial change the bar is what `.githooks/pre-push` enforces: **`ruff check` clean, `mypy` clean (strict mode, on `backend/`), `npm run lint` clean**, plus `make test` green. Note that **CI runs no mypy** and triggers only on `pull_request` — pushing to a branch proves nothing about types.

`ALLOW_MAIN_PUSH=1` skips the entire hook, quality checks included, not just the main-branch block.

### Ports

Backend **8001**, frontend **5173** (5174 is also treated as a frontend port by `make stop`), Postgres host **5433**. 8001 and 5433 are deliberately off the defaults to avoid colliding with other local services. `GET /health` on the backend is what `make run` polls for readiness.

`scripts/dev.ps1` (Windows) is still on port 8000 and never starts Postgres — Windows and Linux dev genuinely diverge. Prefer the Makefile.

## Architecture

FastAPI backend, Vue 3 SPA frontend, PostgreSQL 17 in Docker, separate dependency trees, one repo (ADR-003).

```
frontend/src ──HTTP /api──► backend/app/api/routes ──► backend/app/services ──► models ──► Postgres
                                                              │
                                                              ▼
                                                    PROJECTS_ROOT_PATH on disk
```

**Backend** (`backend/app/`):

- **`main.py`** — app construction, permissive dev CORS, the request-logging middleware, and `/health` (declared *outside* the `/api` prefix).
- **`api/routes/`** — `projects.py` holds nearly the whole surface (projects, dataset images, tagging, onboarding); `tags.py` and `classify.py` are small. Handlers are suffixed `_route`, module-private helpers take a leading `_`.
- **`services/`** — `projects.py` is the domain core (~1100 lines); `classifier.py` is the JTP model runtime; `tag_import.py` reads the catalog CSVs; `tagging.py` is mostly legacy.
- **`core/config.py`** — `Settings` (pydantic-settings, reads `backend/.env`) plus helpers that **write back to `.env` at runtime** and mutate the `settings` singleton in place. The onboarding endpoint is a live config writer.
- **`models/`, `db/`** — SQLAlchemy 2.0 async ORM over `psycopg`. Alembic migrations in `backend/alembic/versions/`, applied automatically by `make run`.

**Frontend** (`frontend/src/`):

- **`api/index.ts`** — the single client module. Every response is parsed through a Zod schema (ADR-005); `fetchJSON` throws `Error("API {status}: {body}")` on non-OK.
- **`stores/`** — Pinia setup stores: `projects`, `images`, `tags`.
- **`pages/WorkspacePage.vue`** plus `pages/workspace/` composables — the only real screen.
- **`cards/`** — one folder per workspace card, resolved through a registry. See `docs/WORKSPACE_CARDS.md`.
- **`design-system/`** — the only place third-party UI libraries may be imported.

### The filesystem is the source of truth

A project exists on disk; the database indexes it. `discover_projects()` imports folders under `PROJECTS_ROOT_PATH`, `sync_project()` reconciles `dataset_images` rows against the files, and `.txt` sidecars next to each image are the tag interchange format. **Any state that cannot be rebuilt by rescanning the project directory is an architectural decision** — write an ADR before adding it.

Corollary: services touch the filesystem and the database together, and roll both back on failure. `create_project` `rmtree`s the directory it made if the transaction fails; `delete_project` removes the folder from disk.

### Protected tags occupy positions 0 and 1

`ensure_project_image_tag_assignments()` guarantees every image in a project carries the project's `trigger_tag` at position 0 and `class_tag` at position 1, both with `is_protected=True`. Removing either through the API is a 422.

The function shifts existing links to temporary positions ≥ 1000 and flushes before renumbering, because `uq_dataset_image_tag_position` would otherwise collide mid-update. That detour is load-bearing — do not "clean it up".

### Tags are global, filtered per project by tagging mode

There is one `tags` table shared across every project (migration 0005 folded the old per-project table into it). A project's `tagging_mode` (`e621` or `booru`) decides which catalog tags it may use, via `Tag.catalog_ids`. **An empty `catalog_ids` means user-defined and available everywhere**; a populated one restricts the tag to the catalogs it names.

### Error strings are part of the API contract

The frontend string-matches backend error text. **Two** files — `composables/useTagMutations.ts` and `pages/workspace/useWorkspaceAiTagActions.ts` — look for the literal sentence `"Confirm creation before adding it as a shared tag."` to trigger a confirmation dialog; `useWorkspacePersistence` regex-matches `api\s(50[234])\b` to decide a startup failure is retryable. **Rewording a backend error message can silently break a UI flow.** See `docs/API.md`.

### The design-system boundary is lint-enforced

`reka-ui` and `motion-v` may only be imported from `src/design-system/reka/**` and `src/design-system/motion/**`, enforced by `no-restricted-imports` in `frontend/eslint.config.js`. Everything else uses the wrappers.

## Working agreements

- **Plan first.** Start new work in plan mode; propose the change and name the files before editing.
- **Branch off `main`.** The pre-push hook blocks direct pushes to `main`. Branches use `feat/`, `fix/`, `chore/`, `docs/`; commits are conventional with scopes (`feat(projects):`).
- **Small, verifiable iterations.** Run the smallest relevant check after each step rather than one big validation at the end. Error-check modified files before moving on; run both suites before committing.
- **Tests are the source of truth for behavior.** Fix the implementation before considering a test change. **Do not modify existing tests in `backend/tests/`, `frontend/src/__tests__/`, or `frontend/e2e/` without explicit authorization in the current session.** Add tests for new behavior. Never weaken a test to make an implementation pass.
- **Interview before building.** For a new feature request, clarify behavior, constraints, and acceptance criteria first.
- **Record decisions before implementing them.** Architectural choices go in `docs/DECISIONS.md` as a new ADR, written *before* the code.
- **Name things from the domain**, not the implementation: `DatasetImage`, `TrainingExperiment`, `Checkpoint` — not `Manager`, `Helper`, `Utility`, `CommonService`. The test is whether the name means something to someone who understands LoRA training but not this codebase. Vocabulary lives in `docs/DOMAIN_MODEL.md`.
- **Split rather than accumulate.** When a service, composable, or component starts handling a second concern, split it before adding a third. Prefer a new workflow module over extending an unrelated one.
- **Prefer extending the architecture over special-casing.** If a feature is hard to integrate cleanly, name the architectural problem instead of forcing it in.

## Gotchas

Real, currently true, and each one costs an hour to rediscover:

- **Tag catalogs are not seeded automatically.** Neither `make install` nor `make run` invokes `scripts/import_tags.py`. Until it runs, adding any catalog tag returns 422 — even though the AI card will happily propose those tags, since suggestion filtering reads the CSVs directly rather than the database.
- **Backend tests run on SQLite in memory**, production on Postgres, and the schema in tests comes from `create_all` rather than the migration chain. Window functions, composite FK enforcement, and `JSON` semantics are never exercised by CI. A broken migration cannot fail the test suite.
- **`discover_projects()` creates a `dataset/` subdirectory inside every child of `PROJECTS_ROOT_PATH`** as a side effect of scanning. Point it at the wrong directory and it litters the filesystem.
- **Discovered projects get `trigger_tag == class_tag == folder_name`**, a state that `create_project` and `update_project` both reject with a 400. They cannot be `PATCH`ed until one of the two is changed.
- **The classifier is off by default and fails silently by design.** Empty suggestions with a `download_message` is the normal signal for disabled / missing weights / unsupported model. Read that field first. See `docs/CLASSIFIER.md`.
- **`--tf-color-accent`, `--tf-color-surface-alt`, and `--tf-radius-sm` are referenced across 19 files but defined nowhere** in `src/style.css`. Drag indicators and drop targets currently render unstyled.
- **Dead code that looks alive:** `ProjectsPage.vue` (339 lines, no route — only a test mounts it), `app/models/image.py` and most of `app/services/tagging.py` (legacy, kept alive by the `Tag.images` relationship), `app/schemas/__init__.py` (stale barrel — 11 of the 22 schemas in `project.py` are missing from it; import from `app.schemas.project` directly), `ProjectImageReplaceResponse` (declared, never used).
- **`RP_ENGINE_APP_PORT`** appears in a Makefile error message but is never read by anything. Ignore it.

## Documentation map

Read the relevant document before a substantial change:

| Doc | For |
|---|---|
| `docs/ARCHITECTURE.md` | vision, principles, and **what is actually implemented** |
| `docs/DOMAIN_MODEL.md` | ubiquitous language; preferred vs avoided vocabulary |
| `docs/API.md` | every HTTP route, status codes, frontend contract |
| `docs/DATABASE_MODEL.md` | tables, constraints, migration chain |
| `docs/WORKSPACE_CARDS.md` | the workspace card registry and how to add a card |
| `docs/CLASSIFIER.md` | JTP models, enabling AI tagging, threshold semantics |
| `docs/UI_CONTRACT.md` | frontend structure, styling, naming, review checklist |
| `docs/TESTING.md` | test layers, Playwright POM, selector policy, triage order |
| `docs/DECISIONS.md` | ADRs — ADR-005 is Zod contract validation, ADR-009 test authority |
| `docs/DATASET_WORKFLOW.md` | project/dataset filesystem convention and sync design |
| `docs/TAG_IMPORT.md` | multi-source tag catalog import design |
| `docs/ROADMAP.md` | deferred work |

## Dev-loop tracking (`.project/`)

Local, **gitignored** session state — distinct from the committed `docs/`:

- `.project/dev-loop.md` — current feature, current step, objective, progress, next action.
- `.project/tasks.md` — the active task list.
- `.project/tasks/N_task-slug[in-progress|closed]/` — per-task artifacts. Numeric `N`, lowercase kebab-case slug, exactly one status tag.

Read both files when picking up work, and update them when scope changes or a session ends, so the next session can resume without re-deriving context. Task artifacts stay concise and task-focused — ASCII wireframes, planning notes, short decision logs. **Never save full conversation transcripts or long prompt/response dumps.**
