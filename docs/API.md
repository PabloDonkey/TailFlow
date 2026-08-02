# HTTP API

## Purpose

Reference for the HTTP surface exposed by the backend. Describes routes as implemented today, not as planned. Request and response models live in `backend/app/schemas/`; every response listed here is re-validated on the frontend by a Zod schema in `frontend/src/api/index.ts` (ADR-005).

---

# Shape

All application routes are mounted under `/api` by `app.include_router(api_router, prefix="/api")` in `backend/app/main.py`. Three routers are included, in this order: `tags`, `projects`, `classify`.

`GET /health` is declared directly on the app and is **not** under `/api`. It returns `{"status": "ok"}` and is what `make run` polls to decide the backend has come up.

There is **no authentication**. No users, sessions, tokens, or permission checks exist anywhere in the codebase, and CORS is `allow_origins=["*"]`. This is a deliberate consequence of the single-user offline scope declared in `ARCHITECTURE.md` — it is not an oversight to be "fixed" without a decision.

Every request is logged by the `log_requests` middleware to the `tailflow.request` logger as
`request method=%s path=%s status=%s duration_ms=%.2f client=%s`, unless `REQUEST_LOGGING_ENABLED=false`.

---

# Tags

`backend/app/api/routes/tags.py`, prefix `/tags`. Tags are **global** — shared across every project, not owned by one.

| Method | Path | Response | Notes |
|---|---|---|---|
| GET | `/api/tags` | `list[TagRead]` | Ordered by name |
| POST | `/api/tags` | `TagRead`, 201 | 409 when the name already exists |

Names are canonicalized on the way in (ADR-011), so `POST /api/tags` with `"Bedroom Eyes"` creates `bedroom_eyes`, and posting a spelling variant of an existing tag returns 409 rather than creating a near-duplicate. The same applies to tag names in `ProjectImageTagUpdate.add` and to `trigger_tag`/`class_tag` on project create and update.

---

# Projects

`backend/app/api/routes/projects.py`, prefix `/projects`.

## Onboarding

| Method | Path | Response |
|---|---|---|
| GET | `/api/projects/onboarding/status` | `ProjectOnboardingStatus` |
| POST | `/api/projects/onboarding/configure` | `ProjectOnboardingConfigureResponse` |

`configured` is true only when **both** `PROJECTS_ROOT_PATH` and `MODEL_STORAGE_PATH` are set. The frontend router guard calls the status route on every navigation and redirects to `/onboarding` when it is false.

`POST /onboarding/configure` **writes to `backend/.env` at runtime** and mutates the in-process `settings` singleton — it creates `.env` from `.env.example` first if the file is missing. It is a live configuration writer, not a read-only endpoint. Blank `projects_root_path` is 422.

> **Route ordering is load-bearing.** Both onboarding routes are declared *before* `/{project_id}`. Move them below it and `"onboarding"` gets parsed as a `uuid.UUID` path parameter, turning every onboarding call into a 422.

## Project lifecycle

| Method | Path | Handler | Response |
|---|---|---|---|
| POST | `/api/projects` | `create_project_route` | `ProjectCreateResponse`, 201 |
| POST | `/api/projects/discover` | `discover_projects_route` | `ProjectDiscoverResponse` |
| GET | `/api/projects` | `list_projects` | `list[ProjectRead]` |
| PATCH | `/api/projects/{project_id}` | `update_project_route` | `ProjectRead` |
| DELETE | `/api/projects/{project_id}` | `delete_project_route` | 204 |
| POST | `/api/projects/{project_id}/sync` | `sync_project_route` | `ProjectSyncResponse` |
| POST | `/api/projects/{project_id}/featured-image/{image_id}` | `set_project_featured_image_route` | `ProjectRead` |

`create_project` is filesystem-first: it creates `<root>/<folder>/dataset/` on disk and, on any failure, rolls back the database *and* `shutil.rmtree`s the directory it created. `delete_project` removes `Path(dataset_path).parent` from disk before deleting the row, and nulls `featured_image_id` first to break the circular foreign key.

`trigger_tag` and `class_tag` must differ — `_validate_distinct_project_tags` returns 400 otherwise. See the discovery caveat in `CLAUDE.md`.

`ProjectRead.preview_image` is resolved per project by `_read_project_preview_images`, which uses a `row_number()` window function to pick one fallback image per project in a single query.

## Dataset images

| Method | Path | Handler | Response |
|---|---|---|---|
| GET | `/api/projects/{project_id}/images` | `list_project_images_route` | `list[ProjectImageSummary]` |
| GET | `/api/projects/{project_id}/images/{image_id}` | `get_project_image_route` | `ProjectImageRead` |
| GET | `/api/projects/{project_id}/images/{image_id}/file` | `get_project_image_file_route` | `FileResponse` |
| POST | `/api/projects/{project_id}/images` | `upload_project_images_route` | `ProjectImageUploadResponse` |
| POST | `/api/projects/{project_id}/images/{image_id}/replace` | `replace_project_image_route` | `ProjectImageRead` |
| DELETE | `/api/projects/{project_id}/images/{image_id}` | `delete_project_image_route` | 204 |

`list_project_images_route` returns **active images only** (`removed_at IS NULL`). `ProjectImageSummary` carries a `tag_count`; the full `tags` list only comes back from the single-image route and from tag mutations.

Uploads take multipart `files` (a list); replace takes a single multipart `file`. Both enforce `ALLOWED_CONTENT_TYPES` (`image/jpeg`, `image/png`, `image/gif`, `image/webp`) and `MAX_UPLOAD_SIZE_MB`.

Deletion is a **soft delete** — `removed_at` is stamped, the row survives, and a later `sync` can restore it if the file reappears.

The frontend builds file URLs with `getProjectImageFileUrl(projectId, imageId, cacheBuster)` and passes `content_hash` as the cache buster, so replacing an image busts the browser cache.

## Dataset rename

| Method | Path | Response |
|---|---|---|
| POST | `/api/projects/{project_id}/dataset/rename-preview` | `ProjectDatasetRenamePreviewResponse` |
| POST | `/api/projects/{project_id}/dataset/rename-apply` | `ProjectDatasetRenameApplyResponse` |

Renames dataset images to `1.ext`, `2.ext`, … preserving names that are already correctly numbered. Preview is pure; apply runs `sync_project` first, then moves every file through `.tailflow-renaming-<hex>` temporary names before moving into final names — a two-phase move that avoids transient collisions. Database `relative_path` values go through their own `.tailflow-renaming-db-<hex>` placeholder phase for the same reason against `uq_dataset_image_path`. Sidecar `.txt` files are rewritten to match.

## Tagging

| Method | Path | Response |
|---|---|---|
| POST | `/api/projects/{project_id}/images/{image_id}/tags` | `ProjectImageRead` |
| POST | `/api/projects/{project_id}/images/{image_id}/classify` | `ProjectImageClassifyResponse` |

`ProjectImageTagUpdate` is `{add: string[], remove: string[], create_missing: bool}`. Both lists are normalized (strip, drop empties, dedupe, preserve order) before use.

Three ways this route returns 422:

* Removing a protected tag (the project's `trigger_tag` or `class_tag`).
* Adding a catalog tag not available in the project's `tagging_mode`.
* Adding a tag name that does not exist yet, with `create_missing=false`. The message is exactly:
  `Tag '{name}' does not exist. Confirm creation before adding it as a shared tag.`
  **The frontend string-matches on the trailing sentence** — in both `composables/useTagMutations.ts` and `pages/workspace/useWorkspaceAiTagActions.ts` — to raise a confirmation dialog and retry with `create_missing=true`. Changing this message silently breaks both flows.

`classify` never fails for a missing model — see `CLASSIFIER.md` for the disabled/missing/unsupported response shapes. It returns 503 only when inference itself raises.

---

# Classify (ad hoc)

`backend/app/api/routes/classify.py`, prefix `/classify`.

| Method | Path | Response |
|---|---|---|
| POST | `/api/classify` | `ClassifyResponse` |

Takes a multipart `file`, writes it to a `tempfile.NamedTemporaryFile`, classifies, and unlinks in a `finally`. 415 for a content type outside the allowed set. This route is not bound to a project and therefore applies no tagging-mode filtering.

---

# Status codes in use

| Code | Meaning here |
|---|---|
| 400 | `trigger_tag` equals `class_tag` |
| 404 | Project or image missing, or the image does not belong to the project |
| 409 | Duplicate project name/folder, existing folder on disk, missing dataset folder, rename conflict |
| 413 | Upload exceeds `MAX_UPLOAD_SIZE_MB` |
| 415 | Unsupported image content type |
| 422 | Protected-tag removal, tagging-mode violation, unconfirmed tag creation, blank onboarding path |
| 500 | Unhandled — logged by the middleware and re-raised |
| 503 | Classifier inference raised |

Services raise `fastapi.HTTPException` **directly** rather than domain exceptions translated at the boundary. Business logic in `app/services/projects.py` therefore knows about HTTP status codes. This is a deliberate simplification for a single-consumer API, but it means service functions are not reusable outside a request context without catching `HTTPException`.

Both `HTTP_422_UNPROCESSABLE_ENTITY` and `HTTP_422_UNPROCESSABLE_CONTENT` appear in the codebase. They are the same number; the inconsistency is cosmetic.

---

# Frontend contract

`frontend/src/api/index.ts` is the single client module. `fetchJSON` throws `Error("API {status}: {rawBody}")` on a non-OK response, then parses the body through the route's Zod schema. Stores catch and stringify (`error.value = String(e)`), so **error text propagates verbatim into UI state** and some call sites pattern-match on it.

That makes two things API contract in practice, beyond the JSON shapes:

* The tag-confirmation message quoted above.
* Status codes 502/503/504 — `useWorkspacePersistence` regex-matches them to decide a startup failure is transient and worth retrying.
