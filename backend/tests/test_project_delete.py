import io
import uuid
from pathlib import Path

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.dataset_image import DatasetImage
from app.models.project import Project
from tests.conftest import make_png_bytes


@pytest.mark.asyncio
async def test_delete_project_removes_record_and_project_folder(
    client: AsyncClient,
    session: AsyncSession,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr("app.core.config.settings.projects_root_path", tmp_path)

    create_response = await client.post(
        "/api/projects",
        json={"folder_name": "delete-project", "class_tag": "subject"},
    )
    assert create_response.status_code == 201
    project_id = create_response.json()["project"]["id"]

    upload_response = await client.post(
        f"/api/projects/{project_id}/images",
        files=[
            (
                "files",
                ("image.png", io.BytesIO(make_png_bytes(16, 16)), "image/png"),
            )
        ],
    )
    assert upload_response.status_code == 200

    project_dir = tmp_path / "delete-project"
    assert project_dir.is_dir()

    delete_response = await client.delete(f"/api/projects/{project_id}")
    assert delete_response.status_code == 204

    listed_projects_response = await client.get("/api/projects")
    assert listed_projects_response.status_code == 200
    listed_project_ids = {project["id"] for project in listed_projects_response.json()}
    assert project_id not in listed_project_ids

    persisted_project = await session.get(Project, uuid.UUID(project_id))
    assert persisted_project is None

    images_result = await session.execute(
        select(DatasetImage).where(DatasetImage.project_id == uuid.UUID(project_id))
    )
    assert images_result.scalars().all() == []

    assert not project_dir.exists()


@pytest.mark.asyncio
async def test_delete_project_returns_not_found_for_unknown_project(
    client: AsyncClient,
) -> None:
    missing_project_id = "11111111-1111-1111-1111-111111111111"

    response = await client.delete(f"/api/projects/{missing_project_id}")

    assert response.status_code == 404
    assert response.json()["detail"] == "Project not found."
