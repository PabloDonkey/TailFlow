"""Tests for project discovery and sync API endpoints."""

import io
import uuid
from pathlib import Path

import pytest
from httpx import AsyncClient
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.dataset_image import DatasetImage
from app.models.tag import Tag
from app.schemas.project import ProjectCreate
from app.services.projects import create_project
from tests.conftest import make_png_bytes


@pytest.mark.asyncio
async def test_list_projects_reads_lowercase_tagging_mode_rows(
    client: AsyncClient, session: AsyncSession
) -> None:
    project_id = str(uuid.uuid4())
    await session.execute(
        text(
            """
            INSERT INTO projects (
                id,
                name,
                folder_name,
                root_path,
                dataset_path,
                trigger_tag,
                class_tag,
                tagging_mode,
                created_at,
                updated_at
            ) VALUES (
                :id,
                :name,
                :folder_name,
                :root_path,
                :dataset_path,
                :trigger_tag,
                :class_tag,
                :tagging_mode,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
            """
        ),
        {
            "id": project_id,
            "name": "Lowercase Mode",
            "folder_name": "lowercase-mode",
            "root_path": "/tmp/projects",
            "dataset_path": "/tmp/projects/lowercase-mode/dataset",
            "trigger_tag": "lowercase-mode",
            "class_tag": "subject",
            "tagging_mode": "e621",
        },
    )
    await session.commit()

    response = await client.get("/api/projects")

    assert response.status_code == 200
    assert response.json()[0]["tagging_mode"] == "e621"


@pytest.mark.asyncio
async def test_discover_projects_imports_valid_dataset_folders(
    client: AsyncClient, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    (tmp_path / "project-a" / "dataset").mkdir(parents=True)
    (tmp_path / "project-b").mkdir()
    monkeypatch.setattr("app.core.config.settings.projects_root_path", tmp_path)

    response = await client.post("/api/projects/discover")

    assert response.status_code == 200
    payload = response.json()
    assert payload["discovered_projects"] == 2
    assert payload["imported_projects"] == 2
    assert payload["marked_missing_projects"] == 0

    assert (tmp_path / "project-b" / "dataset").is_dir()

    list_response = await client.get("/api/projects")
    assert list_response.status_code == 200
    projects = list_response.json()
    assert len(projects) == 2
    folder_names = {project["folder_name"] for project in projects}
    assert folder_names == {"project-a", "project-b"}
    assert {project["tagging_mode"] for project in projects} == {"e621"}


@pytest.mark.asyncio
async def test_onboarding_status_reports_unconfigured_when_projects_root_missing(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr("app.core.config.settings.projects_root_path", None)
    monkeypatch.setattr("app.core.config.settings.model_storage_path", None)

    response = await client.get("/api/projects/onboarding/status")

    assert response.status_code == 200
    payload = response.json()
    assert payload["configured"] is False
    assert payload["projects_root_path"] is None
    assert payload["model_storage_path"] is None
    assert payload["default_projects_root_path"]
    assert payload["default_model_storage_path"]


@pytest.mark.asyncio
async def test_onboarding_configure_sets_projects_root_and_updates_env(
    client: AsyncClient,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    env_file = tmp_path / ".env"
    example_env_file = tmp_path / ".env.example"
    example_env_file.write_text("DATABASE_PASSWORD=\n", encoding="utf-8")

    monkeypatch.setattr("app.core.config.get_backend_env_file_path", lambda: env_file)
    monkeypatch.setattr(
        "app.api.routes.projects.get_backend_env_file_path",
        lambda: env_file,
    )
    monkeypatch.setattr(
        "app.api.routes.projects.get_backend_env_example_file_path",
        lambda: example_env_file,
    )
    monkeypatch.setattr("app.core.config.settings.projects_root_path", None)
    monkeypatch.setattr("app.core.config.settings.model_storage_path", None)

    target_root = tmp_path / "tailflow-projects"
    configure_response = await client.post(
        "/api/projects/onboarding/configure",
        json={
            "projects_root_path": str(target_root),
            "model_storage_path": str(tmp_path / "tailflow-models"),
        },
    )

    assert configure_response.status_code == 200
    payload = configure_response.json()
    assert payload["projects_root_path"] == str(target_root.resolve())
    assert payload["model_storage_path"] == str(
        (tmp_path / "tailflow-models").resolve()
    )
    assert target_root.is_dir()
    assert (tmp_path / "tailflow-models").is_dir()
    env_content = env_file.read_text(encoding="utf-8")
    assert f'PROJECTS_ROOT_PATH="{target_root.resolve()}"' in env_content
    assert (
        f'MODEL_STORAGE_PATH="{(tmp_path / "tailflow-models").resolve()}"'
        in env_content
    )

    status_response = await client.get("/api/projects/onboarding/status")
    assert status_response.status_code == 200
    status_payload = status_response.json()
    assert status_payload["configured"] is True
    assert status_payload["projects_root_path"] == str(target_root.resolve())
    assert status_payload["model_storage_path"] == str(
        (tmp_path / "tailflow-models").resolve()
    )


@pytest.mark.asyncio
async def test_onboarding_configure_defaults_model_storage_to_projects_sibling(
    client: AsyncClient,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    env_file = tmp_path / ".env"
    example_env_file = tmp_path / ".env.example"
    example_env_file.write_text("DATABASE_PASSWORD=\n", encoding="utf-8")

    monkeypatch.setattr("app.core.config.get_backend_env_file_path", lambda: env_file)
    monkeypatch.setattr(
        "app.api.routes.projects.get_backend_env_file_path",
        lambda: env_file,
    )
    monkeypatch.setattr(
        "app.api.routes.projects.get_backend_env_example_file_path",
        lambda: example_env_file,
    )
    monkeypatch.setattr("app.core.config.settings.projects_root_path", None)
    monkeypatch.setattr("app.core.config.settings.model_storage_path", None)

    target_root = tmp_path / "tailflow-projects"
    configure_response = await client.post(
        "/api/projects/onboarding/configure",
        json={"projects_root_path": str(target_root)},
    )

    assert configure_response.status_code == 200
    payload = configure_response.json()
    assert payload["projects_root_path"] == str(target_root.resolve())
    default_models_path = (Path.home() / "tailflow/models").resolve()
    assert payload["model_storage_path"] == str(default_models_path)
    assert default_models_path.is_dir()


@pytest.mark.asyncio
async def test_discover_projects_marks_missing_when_folder_removed(
    client: AsyncClient, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    project_dir = tmp_path / "project-a" / "dataset"
    project_dir.mkdir(parents=True)
    monkeypatch.setattr("app.core.config.settings.projects_root_path", tmp_path)

    first_response = await client.post("/api/projects/discover")
    assert first_response.status_code == 200

    project_dir.rmdir()
    (tmp_path / "project-a").rmdir()

    second_response = await client.post("/api/projects/discover")
    assert second_response.status_code == 200
    payload = second_response.json()
    assert payload["marked_missing_projects"] == 1

    list_response = await client.get("/api/projects")
    projects = list_response.json()
    assert len(projects) == 1
    assert projects[0]["missing_at"] is not None


@pytest.mark.asyncio
async def test_sync_project_adds_and_removes_dataset_images(
    client: AsyncClient, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    dataset_dir = tmp_path / "project-sync" / "dataset"
    dataset_dir.mkdir(parents=True)
    first_image = dataset_dir / "one.png"
    first_image.write_bytes(b"first")
    monkeypatch.setattr("app.core.config.settings.projects_root_path", tmp_path)

    discover_response = await client.post("/api/projects/discover")
    assert discover_response.status_code == 200

    projects = (await client.get("/api/projects")).json()
    project_id = projects[0]["id"]

    first_sync = await client.post(f"/api/projects/{project_id}/sync")
    assert first_sync.status_code == 200
    first_payload = first_sync.json()
    assert first_payload["added_images"] == 1
    assert first_payload["removed_images"] == 0
    assert first_payload["restored_images"] == 0
    assert first_payload["missing"] is False

    second_image = dataset_dir / "two.jpg"
    second_image.write_bytes(b"second")
    first_image.unlink()

    second_sync = await client.post(f"/api/projects/{project_id}/sync")
    assert second_sync.status_code == 200
    second_payload = second_sync.json()
    assert second_payload["added_images"] == 1
    assert second_payload["removed_images"] == 1
    assert second_payload["missing"] is False


@pytest.mark.asyncio
async def test_sync_project_marks_missing_when_dataset_disappears(
    client: AsyncClient, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    dataset_dir = tmp_path / "project-missing" / "dataset"
    dataset_dir.mkdir(parents=True)
    monkeypatch.setattr("app.core.config.settings.projects_root_path", tmp_path)

    discover_response = await client.post("/api/projects/discover")
    assert discover_response.status_code == 200
    projects = (await client.get("/api/projects")).json()
    project_id = projects[0]["id"]

    dataset_dir.rmdir()
    (tmp_path / "project-missing").rmdir()

    sync_response = await client.post(f"/api/projects/{project_id}/sync")
    assert sync_response.status_code == 200
    payload = sync_response.json()
    assert payload["missing"] is True

    refreshed = (await client.get("/api/projects")).json()[0]
    assert refreshed["missing_at"] is not None


@pytest.mark.asyncio
async def test_create_project_creates_directory_and_dataset(
    client: AsyncClient, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr("app.core.config.settings.projects_root_path", tmp_path)

    response = await client.post(
        "/api/projects",
        json={"folder_name": "new-project", "class_tag": "animal"},
    )

    assert response.status_code == 201
    project = response.json()["project"]
    assert project["folder_name"] == "new-project"
    assert project["trigger_tag"] == "new-project"
    assert project["class_tag"] == "animal"
    assert project["tagging_mode"] == "e621"
    assert (tmp_path / "new-project").is_dir()
    assert (tmp_path / "new-project" / "dataset").is_dir()


@pytest.mark.asyncio
async def test_create_project_rejects_equal_trigger_and_class_tags(
    client: AsyncClient,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr("app.core.config.settings.projects_root_path", tmp_path)

    response = await client.post(
        "/api/projects",
        json={
            "folder_name": "same-tags-project",
            "trigger_tag": "same-tag",
            "class_tag": "same-tag",
        },
    )

    assert response.status_code == 400
    assert (
        response.json()["detail"]
        == "Project trigger_tag and class_tag must be different."
    )


@pytest.mark.asyncio
async def test_create_project_cleans_directory_when_commit_fails(
    session: AsyncSession,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr("app.core.config.settings.projects_root_path", tmp_path)

    async def failing_commit() -> None:
        raise RuntimeError("database unavailable")

    monkeypatch.setattr(session, "commit", failing_commit)

    with pytest.raises(RuntimeError, match="database unavailable"):
        await create_project(
            session,
            ProjectCreate(folder_name="rollback-project", class_tag="subject"),
        )

    assert not (tmp_path / "rollback-project").exists()


@pytest.mark.asyncio
async def test_upload_project_images_writes_into_project_dataset(
    client: AsyncClient, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr("app.core.config.settings.projects_root_path", tmp_path)
    create_response = await client.post(
        "/api/projects",
        json={"folder_name": "upload-project", "class_tag": "subject"},
    )
    assert create_response.status_code == 201
    project_id = create_response.json()["project"]["id"]

    first = make_png_bytes(10, 10)
    second = make_png_bytes(20, 20)

    upload_response = await client.post(
        f"/api/projects/{project_id}/images",
        files=[
            ("files", ("one.png", io.BytesIO(first), "image/png")),
            ("files", ("two.png", io.BytesIO(second), "image/png")),
        ],
    )

    assert upload_response.status_code == 200
    payload = upload_response.json()
    assert payload["created_records"] == 2
    assert payload["restored_records"] == 0
    assert sorted(payload["uploaded_files"]) == ["one.png", "two.png"]

    dataset_dir = tmp_path / "upload-project" / "dataset"
    assert (dataset_dir / "one.png").is_file()
    assert (dataset_dir / "two.png").is_file()

    sync_response = await client.post(f"/api/projects/{project_id}/sync")
    assert sync_response.status_code == 200
    sync_payload = sync_response.json()
    assert sync_payload["added_images"] == 0
    assert sync_payload["removed_images"] == 0


@pytest.mark.asyncio
async def test_delete_project_image_soft_deletes_record_and_unlinks_file(
    client: AsyncClient,
    session: AsyncSession,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr("app.core.config.settings.projects_root_path", tmp_path)
    create_response = await client.post(
        "/api/projects",
        json={"folder_name": "delete-image-project", "class_tag": "subject"},
    )
    assert create_response.status_code == 201
    project_id = create_response.json()["project"]["id"]

    image_bytes = make_png_bytes(12, 12)
    upload_response = await client.post(
        f"/api/projects/{project_id}/images",
        files=[("files", ("delete-me.png", io.BytesIO(image_bytes), "image/png"))],
    )
    assert upload_response.status_code == 200

    images_before_delete = await client.get(f"/api/projects/{project_id}/images")
    assert images_before_delete.status_code == 200
    image_payload = images_before_delete.json()[0]
    image_id = image_payload["id"]

    dataset_file = (
        tmp_path
        / "delete-image-project"
        / "dataset"
        / image_payload["relative_path"]
    )
    assert dataset_file.is_file()

    delete_response = await client.delete(
        f"/api/projects/{project_id}/images/{image_id}"
    )
    assert delete_response.status_code == 204

    images_after_delete = await client.get(f"/api/projects/{project_id}/images")
    assert images_after_delete.status_code == 200
    assert images_after_delete.json() == []

    deleted_record = await session.get(DatasetImage, uuid.UUID(image_id))
    assert deleted_record is not None
    assert deleted_record.removed_at is not None
    assert not dataset_file.exists()


@pytest.mark.asyncio
async def test_set_project_featured_image_updates_list_preview(
    client: AsyncClient,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr("app.core.config.settings.projects_root_path", tmp_path)
    created = await client.post(
        "/api/projects",
        json={"folder_name": "featured-project", "class_tag": "subject"},
    )
    assert created.status_code == 201
    project_id = created.json()["project"]["id"]

    first = make_png_bytes(8, 8)
    second = make_png_bytes(9, 9)
    uploaded = await client.post(
        f"/api/projects/{project_id}/images",
        files=[
            ("files", ("one.png", io.BytesIO(first), "image/png")),
            ("files", ("two.png", io.BytesIO(second), "image/png")),
        ],
    )
    assert uploaded.status_code == 200

    listed_images = await client.get(f"/api/projects/{project_id}/images")
    assert listed_images.status_code == 200
    images = listed_images.json()
    assert len(images) == 2

    chosen_featured_image_id = images[1]["id"]

    set_featured = await client.post(
        f"/api/projects/{project_id}/featured-image/{chosen_featured_image_id}"
    )
    assert set_featured.status_code == 200
    payload = set_featured.json()
    assert payload["featured_image_id"] == chosen_featured_image_id
    assert payload["preview_image"]["id"] == chosen_featured_image_id

    projects = (await client.get("/api/projects")).json()
    assert projects[0]["featured_image_id"] == chosen_featured_image_id
    assert projects[0]["preview_image"]["id"] == chosen_featured_image_id


@pytest.mark.asyncio
async def test_delete_featured_image_reassigns_to_next_available_image(
    client: AsyncClient,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr("app.core.config.settings.projects_root_path", tmp_path)
    created = await client.post(
        "/api/projects",
        json={"folder_name": "featured-delete", "class_tag": "subject"},
    )
    assert created.status_code == 201
    project_id = created.json()["project"]["id"]

    upload_response = await client.post(
        f"/api/projects/{project_id}/images",
        files=[
            ("files", ("first.png", io.BytesIO(make_png_bytes(10, 10)), "image/png")),
            ("files", ("second.png", io.BytesIO(make_png_bytes(11, 11)), "image/png")),
        ],
    )
    assert upload_response.status_code == 200

    listed_images = await client.get(f"/api/projects/{project_id}/images")
    assert listed_images.status_code == 200
    images = listed_images.json()
    assert len(images) == 2

    fallback_image_id = images[0]["id"]
    featured_image_id = images[1]["id"]

    set_featured = await client.post(
        f"/api/projects/{project_id}/featured-image/{featured_image_id}"
    )
    assert set_featured.status_code == 200
    assert set_featured.json()["featured_image_id"] == featured_image_id

    delete_featured = await client.delete(
        f"/api/projects/{project_id}/images/{featured_image_id}"
    )
    assert delete_featured.status_code == 204

    projects = (await client.get("/api/projects")).json()
    assert projects[0]["featured_image_id"] == fallback_image_id
    assert projects[0]["preview_image"]["id"] == fallback_image_id


@pytest.mark.asyncio
async def test_update_project_tags_metadata(
    client: AsyncClient,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr("app.core.config.settings.projects_root_path", tmp_path)
    created = await client.post(
        "/api/projects",
        json={"folder_name": "meta-project", "class_tag": "base"},
    )
    project_id = created.json()["project"]["id"]

    updated = await client.patch(
        f"/api/projects/{project_id}",
        json={
            "trigger_tag": "new-trigger",
            "class_tag": "new-class",
            "tagging_mode": "booru",
        },
    )
    assert updated.status_code == 200
    payload = updated.json()
    assert payload["trigger_tag"] == "new-trigger"
    assert payload["class_tag"] == "new-class"
    assert payload["tagging_mode"] == "booru"


@pytest.mark.asyncio
async def test_update_project_metadata_rejects_equal_trigger_and_class_tags(
    client: AsyncClient,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr("app.core.config.settings.projects_root_path", tmp_path)
    created = await client.post(
        "/api/projects",
        json={"folder_name": "equal-update", "class_tag": "base"},
    )
    project_id = created.json()["project"]["id"]

    updated = await client.patch(
        f"/api/projects/{project_id}",
        json={"trigger_tag": "same-tag", "class_tag": "same-tag"},
    )

    assert updated.status_code == 400
    assert (
        updated.json()["detail"]
        == "Project trigger_tag and class_tag must be different."
    )


@pytest.mark.asyncio
async def test_update_project_metadata_propagates_protected_tags_to_images(
    client: AsyncClient, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr("app.core.config.settings.projects_root_path", tmp_path)
    created = await client.post(
        "/api/projects",
        json={"folder_name": "meta-sync", "class_tag": "base"},
    )
    project_id = created.json()["project"]["id"]

    image_bytes = make_png_bytes(10, 10)
    uploaded = await client.post(
        f"/api/projects/{project_id}/images",
        files=[("files", ("face.png", io.BytesIO(image_bytes), "image/png"))],
    )
    assert uploaded.status_code == 200

    image_id = (await client.get(f"/api/projects/{project_id}/images")).json()[0]["id"]

    updated = await client.patch(
        f"/api/projects/{project_id}",
        json={"trigger_tag": "new-trigger", "class_tag": "new-class"},
    )
    assert updated.status_code == 200

    image = await client.get(f"/api/projects/{project_id}/images/{image_id}")
    assert image.status_code == 200
    assert [tag["name"] for tag in image.json()["tags"]] == ["new-trigger", "new-class"]
    assert [tag["is_protected"] for tag in image.json()["tags"]] == [True, True]


@pytest.mark.asyncio
async def test_create_project_uses_default_tagging_mode(
    client: AsyncClient,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr("app.core.config.settings.projects_root_path", tmp_path)

    created = await client.post(
        "/api/projects",
        json={"folder_name": "default-mode", "class_tag": "base"},
    )

    assert created.status_code == 201
    assert created.json()["project"]["tagging_mode"] == "e621"


@pytest.mark.asyncio
async def test_create_project_allows_explicit_tagging_mode(
    client: AsyncClient,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr("app.core.config.settings.projects_root_path", tmp_path)

    created = await client.post(
        "/api/projects",
        json={
            "folder_name": "booru-mode",
            "class_tag": "base",
            "tagging_mode": "booru",
        },
    )

    assert created.status_code == 201
    assert created.json()["project"]["tagging_mode"] == "booru"


@pytest.mark.asyncio
async def test_project_image_tagging_and_tag_preservation_across_sync(
    client: AsyncClient, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr("app.core.config.settings.projects_root_path", tmp_path)
    create_response = await client.post(
        "/api/projects",
        json={"folder_name": "tag-project", "class_tag": "subject"},
    )
    assert create_response.status_code == 201
    project_id = create_response.json()["project"]["id"]

    image_bytes = make_png_bytes(10, 10)
    uploaded = await client.post(
        f"/api/projects/{project_id}/images",
        files=[("files", ("face.png", io.BytesIO(image_bytes), "image/png"))],
    )
    assert uploaded.status_code == 200

    listed = await client.get(f"/api/projects/{project_id}/images")
    assert listed.status_code == 200
    images = listed.json()
    assert len(images) == 1
    image_id = images[0]["id"]
    assert images[0]["tag_count"] == 2

    add_tags = await client.post(
        f"/api/projects/{project_id}/images/{image_id}/tags",
        json={"add": ["portrait", "style-a"], "remove": [], "create_missing": True},
    )
    assert add_tags.status_code == 200
    tag_names = [tag["name"] for tag in add_tags.json()["tags"]]
    assert tag_names == ["tag-project", "subject", "portrait", "style-a"]
    assert add_tags.json()["tag_count"] == 4
    assert [tag["position"] for tag in add_tags.json()["tags"]] == [0, 1, 2, 3]
    assert [tag["is_protected"] for tag in add_tags.json()["tags"]] == [
        True,
        True,
        False,
        False,
    ]

    remove_tag = await client.post(
        f"/api/projects/{project_id}/images/{image_id}/tags",
        json={"add": [], "remove": ["portrait"]},
    )
    assert remove_tag.status_code == 200
    tag_names_after_remove = [tag["name"] for tag in remove_tag.json()["tags"]]
    assert tag_names_after_remove == ["tag-project", "subject", "style-a"]
    assert remove_tag.json()["tag_count"] == 3

    relisted = await client.get(f"/api/projects/{project_id}/images")
    assert relisted.status_code == 200
    assert relisted.json()[0]["tag_count"] == 3

    blocked_remove = await client.post(
        f"/api/projects/{project_id}/images/{image_id}/tags",
        json={"add": [], "remove": ["tag-project"]},
    )
    assert blocked_remove.status_code == 422

    dataset_file = tmp_path / "tag-project" / "dataset" / "face.png"
    dataset_file.unlink()

    remove_sync = await client.post(f"/api/projects/{project_id}/sync")
    assert remove_sync.status_code == 200
    assert remove_sync.json()["removed_images"] == 1

    dataset_file.write_bytes(image_bytes)
    restore_sync = await client.post(f"/api/projects/{project_id}/sync")
    assert restore_sync.status_code == 200
    assert restore_sync.json()["restored_images"] == 1

    restored_image = await client.get(f"/api/projects/{project_id}/images/{image_id}")
    assert restored_image.status_code == 200
    restored_tag_names = [tag["name"] for tag in restored_image.json()["tags"]]
    assert restored_tag_names == ["tag-project", "subject", "style-a"]
    assert restored_image.json()["tag_count"] == 3


@pytest.mark.asyncio
async def test_manual_tagging_rejects_source_tag_outside_project_mode(
    client: AsyncClient,
    session: AsyncSession,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    session.add(Tag(name="wolf", catalog_ids={"e621": "42"}))
    await session.commit()

    monkeypatch.setattr("app.core.config.settings.projects_root_path", tmp_path)
    created = await client.post(
        "/api/projects",
        json={
            "folder_name": "booru-project",
            "class_tag": "base",
            "tagging_mode": "booru",
        },
    )
    project_id = created.json()["project"]["id"]

    image_bytes = make_png_bytes(10, 10)
    uploaded = await client.post(
        f"/api/projects/{project_id}/images",
        files=[("files", ("face.png", io.BytesIO(image_bytes), "image/png"))],
    )
    assert uploaded.status_code == 200

    image_id = (await client.get(f"/api/projects/{project_id}/images")).json()[0]["id"]

    response = await client.post(
        f"/api/projects/{project_id}/images/{image_id}/tags",
        json={"add": ["wolf"], "remove": []},
    )

    assert response.status_code == 422
    assert response.json()["detail"] == "Tag 'wolf' is not available in booru mode."


@pytest.mark.asyncio
async def test_manual_tagging_allows_shared_user_defined_tags_in_any_mode(
    client: AsyncClient,
    session: AsyncSession,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    session.add(Tag(name="shared-style", catalog_ids={}))
    await session.commit()

    monkeypatch.setattr("app.core.config.settings.projects_root_path", tmp_path)
    created = await client.post(
        "/api/projects",
        json={
            "folder_name": "shared-tags",
            "class_tag": "base",
            "tagging_mode": "booru",
        },
    )
    project_id = created.json()["project"]["id"]

    image_bytes = make_png_bytes(10, 10)
    uploaded = await client.post(
        f"/api/projects/{project_id}/images",
        files=[("files", ("face.png", io.BytesIO(image_bytes), "image/png"))],
    )
    assert uploaded.status_code == 200

    image_id = (await client.get(f"/api/projects/{project_id}/images")).json()[0]["id"]
    response = await client.post(
        f"/api/projects/{project_id}/images/{image_id}/tags",
        json={"add": ["shared-style"], "remove": []},
    )

    assert response.status_code == 200
    assert [tag["name"] for tag in response.json()["tags"]] == [
        "shared-tags",
        "base",
        "shared-style",
    ]


@pytest.mark.asyncio
async def test_manual_tagging_requires_confirmation_before_creating_unknown_tag(
    client: AsyncClient, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr("app.core.config.settings.projects_root_path", tmp_path)
    created = await client.post(
        "/api/projects",
        json={"folder_name": "confirm-tags", "class_tag": "base"},
    )
    project_id = created.json()["project"]["id"]

    image_bytes = make_png_bytes(10, 10)
    uploaded = await client.post(
        f"/api/projects/{project_id}/images",
        files=[("files", ("face.png", io.BytesIO(image_bytes), "image/png"))],
    )
    assert uploaded.status_code == 200

    image_id = (await client.get(f"/api/projects/{project_id}/images")).json()[0]["id"]

    rejected = await client.post(
        f"/api/projects/{project_id}/images/{image_id}/tags",
        json={"add": ["new-shared-tag"], "remove": []},
    )
    assert rejected.status_code == 422
    expected_detail = (
        "Tag 'new-shared-tag' does not exist. Confirm creation before adding "
        "it as a shared tag."
    )
    assert (
        rejected.json()["detail"]
        == expected_detail
    )

    created_tag = await client.post(
        f"/api/projects/{project_id}/images/{image_id}/tags",
        json={"add": ["new-shared-tag"], "remove": [], "create_missing": True},
    )
    assert created_tag.status_code == 200
    added_tag = created_tag.json()["tags"][2]
    assert added_tag["name"] == "new-shared-tag"
    assert added_tag["catalog_ids"] == {}


@pytest.mark.asyncio
async def test_protected_class_tag_reuses_existing_catalog_tag_in_project_mode(
    client: AsyncClient,
    session: AsyncSession,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    existing_class_tag = Tag(name="character", catalog_ids={"booru": "55"})
    session.add(existing_class_tag)
    await session.commit()

    monkeypatch.setattr("app.core.config.settings.projects_root_path", tmp_path)
    created = await client.post(
        "/api/projects",
        json={
            "folder_name": "reuse-class",
            "class_tag": "character",
            "tagging_mode": "booru",
        },
    )
    project_id = created.json()["project"]["id"]

    image_bytes = make_png_bytes(10, 10)
    uploaded = await client.post(
        f"/api/projects/{project_id}/images",
        files=[("files", ("face.png", io.BytesIO(image_bytes), "image/png"))],
    )
    assert uploaded.status_code == 200

    image_id = (await client.get(f"/api/projects/{project_id}/images")).json()[0]["id"]
    image = await client.get(f"/api/projects/{project_id}/images/{image_id}")

    assert image.status_code == 200
    protected_class_tag = image.json()["tags"][1]
    assert protected_class_tag["id"] == str(existing_class_tag.id)
    assert protected_class_tag["name"] == "character"
    assert protected_class_tag["catalog_ids"] == {"booru": "55"}

    tags_result = await session.execute(select(Tag).where(Tag.name == "character"))
    assert len(tags_result.scalars().all()) == 1


@pytest.mark.asyncio
async def test_sync_project_imports_sidecar_tags_with_mode_filtering_and_auto_create(
    client: AsyncClient,
    session: AsyncSession,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    session.add_all(
        [
            Tag(name="booru-wolf", catalog_ids={"booru": "42"}),
            Tag(name="e621-wolf", catalog_ids={"e621": "99"}),
            Tag(name="shared-style", catalog_ids={}),
        ]
    )
    await session.commit()

    monkeypatch.setattr("app.core.config.settings.projects_root_path", tmp_path)
    created = await client.post(
        "/api/projects",
        json={
            "folder_name": "sidecar-sync",
            "class_tag": "subject",
            "tagging_mode": "booru",
        },
    )
    assert created.status_code == 201
    project_id = created.json()["project"]["id"]

    dataset_dir = tmp_path / "sidecar-sync" / "dataset"
    (dataset_dir / "fox.png").write_bytes(b"fox")
    (dataset_dir / "fox.txt").write_text(
        " booru-wolf, shared-style, new-shared, e621-wolf, , booru-wolf ",
        encoding="utf-8",
    )

    sync_response = await client.post(f"/api/projects/{project_id}/sync")
    assert sync_response.status_code == 200
    assert sync_response.json()["added_images"] == 1

    image_id = (await client.get(f"/api/projects/{project_id}/images")).json()[0]["id"]
    image_response = await client.get(f"/api/projects/{project_id}/images/{image_id}")

    assert image_response.status_code == 200
    tags = image_response.json()["tags"]
    assert [tag["name"] for tag in tags] == [
        "sidecar-sync",
        "subject",
        "booru-wolf",
        "shared-style",
        "new-shared",
    ]
    assert [tag["position"] for tag in tags] == [0, 1, 2, 3, 4]
    assert [tag["is_protected"] for tag in tags] == [
        True,
        True,
        False,
        False,
        False,
    ]

    created_tag = await session.execute(select(Tag).where(Tag.name == "new-shared"))
    assert created_tag.scalar_one().catalog_ids == {}


@pytest.mark.asyncio
async def test_sync_project_sidecar_import_preserves_existing_manual_tags(
    client: AsyncClient,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr("app.core.config.settings.projects_root_path", tmp_path)
    created = await client.post(
        "/api/projects",
        json={"folder_name": "sidecar-preserve", "class_tag": "subject"},
    )
    assert created.status_code == 201
    project_id = created.json()["project"]["id"]

    image_bytes = make_png_bytes(10, 10)
    uploaded = await client.post(
        f"/api/projects/{project_id}/images",
        files=[("files", ("fox.png", io.BytesIO(image_bytes), "image/png"))],
    )
    assert uploaded.status_code == 200

    image_id = (await client.get(f"/api/projects/{project_id}/images")).json()[0]["id"]

    manual_update = await client.post(
        f"/api/projects/{project_id}/images/{image_id}/tags",
        json={"add": ["manual-style"], "remove": [], "create_missing": True},
    )
    assert manual_update.status_code == 200

    dataset_dir = tmp_path / "sidecar-preserve" / "dataset"
    (dataset_dir / "fox.txt").write_text("sidecar-style", encoding="utf-8")

    sync_response = await client.post(f"/api/projects/{project_id}/sync")
    assert sync_response.status_code == 200

    image_response = await client.get(f"/api/projects/{project_id}/images/{image_id}")
    assert image_response.status_code == 200
    assert [tag["name"] for tag in image_response.json()["tags"]] == [
        "sidecar-preserve",
        "subject",
        "manual-style",
        "sidecar-style",
    ]


@pytest.mark.asyncio
async def test_classify_project_image_returns_empty_when_classifier_disabled(
    client: AsyncClient,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr("app.core.config.settings.projects_root_path", tmp_path)
    monkeypatch.setattr("app.core.config.settings.classifier_enabled", False)

    created = await client.post(
        "/api/projects",
        json={"folder_name": "classify-disabled", "class_tag": "subject"},
    )
    assert created.status_code == 201
    project_id = created.json()["project"]["id"]

    image_bytes = make_png_bytes(10, 10)
    uploaded = await client.post(
        f"/api/projects/{project_id}/images",
        files=[("files", ("fox.png", io.BytesIO(image_bytes), "image/png"))],
    )
    assert uploaded.status_code == 200

    image_id = (await client.get(f"/api/projects/{project_id}/images")).json()[0]["id"]
    response = await client.post(
        f"/api/projects/{project_id}/images/{image_id}/classify",
        json={"model_id": "jtp-3-hydra", "threshold": 0.35, "max_tags": 16},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["suggestions"] == []
    assert payload["model_id"] == "jtp-3-hydra"
    assert payload["model_available"] is False
    assert payload["download_progress_percent"] == 0
    assert payload["download_proposal_url"] == "https://huggingface.co/RedRocket/JTP-3/tree/main/models"
    assert payload["download_message"]


@pytest.mark.asyncio
async def test_classify_project_image_returns_503_when_inference_fails(
    client: AsyncClient,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr("app.core.config.settings.projects_root_path", tmp_path)
    monkeypatch.setattr("app.core.config.settings.classifier_enabled", True)

    classifiers_root = tmp_path / "classifiers"
    model_dir = classifiers_root / "JTP-3"
    model_dir.mkdir(parents=True)
    (model_dir / "jtp-3-hydra.safetensors").write_bytes(b"mock-model")
    monkeypatch.setattr("app.services.classifier.CLASSIFIERS_ROOT", classifiers_root)

    created = await client.post(
        "/api/projects",
        json={"folder_name": "classify-enabled", "class_tag": "subject"},
    )
    assert created.status_code == 201
    project_id = created.json()["project"]["id"]

    image_bytes = make_png_bytes(10, 10)
    uploaded = await client.post(
        f"/api/projects/{project_id}/images",
        files=[("files", ("fox.png", io.BytesIO(image_bytes), "image/png"))],
    )
    assert uploaded.status_code == 200

    image_id = (await client.get(f"/api/projects/{project_id}/images")).json()[0]["id"]
    response = await client.post(
        f"/api/projects/{project_id}/images/{image_id}/classify",
        json={"model_id": "jtp-3-hydra", "threshold": 0.3, "max_tags": 5},
    )

    assert response.status_code == 503
    payload = response.json()
    assert "detail" in payload
    assert "Classifier inference failed:" in payload["detail"]
