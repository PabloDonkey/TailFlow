"""Tests for project discovery and sync API endpoints."""

import io
from pathlib import Path

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tag import Tag
from app.schemas.project import ProjectCreate
from app.services.projects import create_project
from tests.conftest import make_png_bytes


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

    response = await client.get("/api/projects/onboarding/status")

    assert response.status_code == 200
    payload = response.json()
    assert payload["configured"] is False
    assert payload["projects_root_path"] is None
    assert payload["default_projects_root_path"]


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

    target_root = tmp_path / "tailflow-projects"
    configure_response = await client.post(
        "/api/projects/onboarding/configure",
        json={"projects_root_path": str(target_root)},
    )

    assert configure_response.status_code == 200
    payload = configure_response.json()
    assert payload["projects_root_path"] == str(target_root.resolve())
    assert target_root.is_dir()
    env_content = env_file.read_text(encoding="utf-8")
    assert f'PROJECTS_ROOT_PATH="{target_root.resolve()}"' in env_content

    status_response = await client.get("/api/projects/onboarding/status")
    assert status_response.status_code == 200
    status_payload = status_response.json()
    assert status_payload["configured"] is True
    assert status_payload["projects_root_path"] == str(target_root.resolve())


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

    add_tags = await client.post(
        f"/api/projects/{project_id}/images/{image_id}/tags",
        json={"add": ["portrait", "style-a"], "remove": [], "create_missing": True},
    )
    assert add_tags.status_code == 200
    tag_names = [tag["name"] for tag in add_tags.json()["tags"]]
    assert tag_names == ["tag-project", "subject", "portrait", "style-a"]
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
