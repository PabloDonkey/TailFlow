"""Tests for project discovery and sync API endpoints."""

import io
from pathlib import Path

import pytest
from httpx import AsyncClient

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
    assert payload["discovered_projects"] == 1
    assert payload["imported_projects"] == 1
    assert payload["marked_missing_projects"] == 0

    list_response = await client.get("/api/projects")
    assert list_response.status_code == 200
    projects = list_response.json()
    assert len(projects) == 1
    assert projects[0]["folder_name"] == "project-a"
    assert projects[0]["trigger_tag"] == "project-a"
    assert projects[0]["class_tag"] == "project-a"
    assert projects[0]["missing_at"] is None


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
    assert (tmp_path / "new-project").is_dir()
    assert (tmp_path / "new-project" / "dataset").is_dir()


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
