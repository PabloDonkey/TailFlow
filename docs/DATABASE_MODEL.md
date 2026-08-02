# Database Model

## Purpose

Reference for the PostgreSQL schema as it exists today, mapped to the SQLAlchemy models in `backend/app/models/`. For what the tables *mean* in domain terms, read `DOMAIN_MODEL.md` first — this document is about storage.

---

# Engine and access

* **PostgreSQL 17**, run in Docker as `tailflow_postgres` (`docker-compose.yml`), host port **5433** by default — deliberately not 5432, to avoid colliding with other local databases.
* **Driver:** `postgresql+psycopg` (psycopg 3, async). The URL is assembled by the `Settings.database_url` property, which `quote_plus`-escapes the user and password.
* **Session:** `app/db/session.py` creates one module-level `engine` and `AsyncSessionLocal` (`expire_on_commit=False`). Routes depend on `db_session()` from `app/api/deps/`, which is the override point in tests.
* **Declarative base:** `app/db/base.py`, `class Base(DeclarativeBase)`.

The database is an **index and cache, not the source of truth** — the filesystem is. `sync_project()` and `discover_projects()` can rebuild dataset state from disk. Treat any schema addition that cannot be reconstructed from the project directory as an architectural decision worth an ADR.

Conventions across every table: primary keys are `Uuid` defaulting to `uuid.uuid4`; every timestamp is `DateTime(timezone=True)` populated by `lambda: datetime.now(UTC)`.

---

# projects

Fields:

* `id` (`Uuid`) - primary key.
* `name` (`String(255)`) - display name.
* `folder_name` (`String(255)`, unique) - directory name under `PROJECTS_ROOT_PATH`.
* `root_path` (`String(2048)`) - absolute path to the project directory.
* `dataset_path` (`String(2048)`) - absolute path to `<root_path>/dataset`.
* `trigger_tag` (`String(255)`) - the LoRA trigger word. Forced onto every image at position 0.
* `class_tag` (`String(255)`) - the class token. Forced onto every image at position 1.
* `tagging_mode` (`TAGGING_MODE_ENUM`) - which catalog this project draws from.
* `featured_image_id` (`Uuid | None`) - FK to `dataset_images.id`, the project's cover image.
* `last_synced_at` (`datetime | None`) - last successful `sync_project()`.
* `missing_at` (`datetime | None`) - stamped when the folder disappeared from disk; cleared when it returns.
* `created_at`, `updated_at` (`datetime`) - `updated_at` uses `onupdate`.

`tagging_mode` is a **non-native enum** (`native_enum=False, length=16`) with `values_callable`, so the column is a length-16 string storing the lowercase member *values* `"e621"` / `"booru"` — not the Python member names. Adding a `TaggingMode` member is a data change, not just a code change.

`featured_image_id` creates a circular dependency between `projects` and `dataset_images`. `delete_project` nulls it before deleting the row for exactly this reason.

Relationships: `dataset_images` and `image_tag_links`, both `cascade="all, delete-orphan"` and `lazy="selectin"`.

---

# dataset_images

One row per image file found under the project's `dataset/` directory.

Fields:

* `id` (`Uuid`) - primary key.
* `project_id` (`Uuid`) - FK to `projects.id`.
* `relative_path` (`String(2048)`) - path relative to `dataset_path`. The identity used by sync.
* `filename` (`String(255)`) - basename.
* `content_hash` (`String(128) | None`) - also used as a cache-buster in image URLs.
* `file_mtime_ns` (`BigInteger | None`) - modification time in nanoseconds.
* `file_size_bytes` (`BigInteger | None`) - size on disk.
* `discovered_at` (`datetime`) - when sync first saw this path.
* `removed_at` (`datetime | None`) - soft-delete marker; `NULL` means active.

Constraints:

* `uq_dataset_image_path (project_id, relative_path)` - a path is unique within a project. This is what forces the two-phase temporary-name dance in the dataset rename flow.
* `uq_dataset_image_id_project (id, project_id)` - exists solely to be the target of the composite foreign key below.

**Sync does not re-hash content.** `sync_project()` compares `relative_path` for existence and updates `file_mtime_ns` / `file_size_bytes`; it will not notice a file whose bytes changed while path, mtime and size stayed identical.

---

# dataset_image_tag

The tag assignment table. Composite primary key `(image_id, tag_id)`.

Fields:

* `image_id` (`Uuid`) - part of the primary key.
* `tag_id` (`Uuid`) - part of the primary key, FK to `tags.id`.
* `project_id` (`Uuid`) - FK to `projects.id`, denormalized so the composite FK below can exist.
* `position` (`Integer`) - ordering within the image's tag list. Positions 0 and 1 are the protected trigger/class tags.
* `is_protected` (`Boolean`) - true for trigger/class assignments; blocks removal via the API.
* `created_at` (`datetime`).

Constraints:

* `fk_dataset_image_tag_image_project (image_id, project_id) → dataset_images(id, project_id)` - a composite foreign key that makes it **structurally impossible** for a tag assignment to reference an image belonging to a different project. Added by migration 0003 for exactly this reason; do not replace it with a plain single-column FK.
* `uq_dataset_image_tag_position (image_id, position)` - positions are unique per image.

That uniqueness constraint is the reason `ensure_project_image_tag_assignments()` looks strange: it shifts every existing link to a temporary position ≥ 1000 and flushes *before* renumbering from zero, because a direct renumber would transiently collide.

---

# tags

Global tag catalog. Tags are **shared across all projects** — there is no per-project tag table (there was, until migration 0005 folded `project_tags` into this one).

Fields:

* `id` (`Uuid`) - primary key.
* `name` (`String(255)`, unique) - the **canonical** tag name, e.g. `canine`, `simple_background`. Lowercase, with whitespace runs collapsed to `_` by `canonical_tag_name()` (ADR-011). Uniqueness on this column is what makes canonical name the tag's identity.
* `catalog_ids` (`MutableDict` over `JSON`) - maps catalog key to that catalog's ID, e.g. `{"e621": "7115", "booru": "470575"}`.
* `category` (`String(255) | None`) - catalog category, e.g. `species`, `artist`.
* `created_at` (`datetime`).

`catalog_ids` drives tagging-mode filtering. **An empty dict means the tag is user-defined and available in every mode**; a populated dict restricts the tag to the catalogs it names (`_tag_is_available_in_mode`). Keys are constrained to `TaggingMode` values by `ALLOWED_CATALOGS` in `app/schemas/tag.py`.

Rows are populated by `scripts/import_tags.py` from the CSVs in `assets/`. See `TAG_IMPORT.md`. **Nothing runs this automatically** — until it is run, adding any catalog tag through the API returns 422.

---

## images, image_tag (no longer used)

> **Removed from use.** These tables were created by migration 0001 for a pre-project-era image model and are not referenced by any route or service in the current code. They survive only because `Tag.images` still declares a relationship to `Image`, and because the migration that created them was never reverted. `app/services/tagging.py` operates on them; only its `get_or_create_tag` helper is still live. Kept here as historical documentation — do not build on them.

`images`: `id`, `filename` (unique), `original_name`, `uploaded_at`, `width`, `height`.
`image_tag`: junction of `image_id` and `tag_id`.

---

# Migrations

Alembic, in `backend/alembic/versions/`. Revision IDs are plain sequential strings (`"0001"`…), not hashes, forming a linear chain.

`alembic.ini` carries a placeholder `sqlalchemy.url` which `alembic/env.py` **overwrites at runtime** with `settings.database_url` — migrations therefore always follow `backend/.env`, and editing the ini URL does nothing. `env.py` imports all four model modules explicitly with `# noqa: F401` so autogenerate can see them.

| Rev | What it did |
|---|---|
| 0001 | `images`, `tags`, `image_tag` |
| 0002 | `projects`, `dataset_images`, `project_tags`, `dataset_image_tag` |
| 0003 | Composite unique keys and the composite FK preventing cross-project tag links |
| 0004 | `projects.tagging_mode` (server default `'e621'`, then dropped), `tags.catalog_ids` |
| 0005 | **Data migration** — folds `project_tags` into global `tags` by name, rebuilds `dataset_image_tag` with `position` and `is_protected`, copies links assigning sequential positions, drops the old tables. Has a real `downgrade()`. |
| 0006 | `projects.featured_image_id` and its FK |
| 0007 | **Data migration.** Canonicalizes `tags.name` and `projects.trigger_tag`/`class_tag`, merging tags that differed only by case or space-vs-underscore. Picks a catalog-backed survivor per group, collapses duplicate assignments per image keeping the protected link, and repoints the rest. `downgrade()` is a documented no-op — the merge is lossy (ADR-011). |

`make run` applies `alembic upgrade head` automatically before starting uvicorn.

New migrations should be reversible — write `downgrade()` and verify it against a real database, not just `upgrade head`. Migration 0005 is the reference for how a data migration is expected to look here.

---

# Testing caveat

**Backend tests run against SQLite in memory** (`sqlite+aiosqlite:///:memory:`, `backend/tests/conftest.py`), while production runs Postgres. Tests build the schema with `Base.metadata.create_all`, not by running the migration chain.

Two consequences worth remembering:

* Postgres-specific behavior — the `row_number()` window query in `_read_project_preview_images`, composite foreign key enforcement, `JSON` column semantics — is exercised only at runtime, never in CI.
* A broken migration cannot fail the test suite. Migrations are only proven when someone runs `make run` against a real database.
