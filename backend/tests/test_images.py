"""Tests for image API endpoints."""

import io
from pathlib import Path

import pytest
from httpx import AsyncClient
from PIL import Image as PILImage

from tests.conftest import make_png_bytes


@pytest.mark.asyncio
async def test_upload_image(client: AsyncClient, tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setattr("app.core.config.settings.storage_path", str(tmp_path))
    png = make_png_bytes()
    response = await client.post(
        "/api/images",
        files={"file": ("test.png", io.BytesIO(png), "image/png")},
    )
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert "suggested_tags" in data


@pytest.mark.asyncio
async def test_upload_invalid_type(client: AsyncClient, tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setattr("app.core.config.settings.storage_path", str(tmp_path))
    response = await client.post(
        "/api/images",
        files={"file": ("test.txt", io.BytesIO(b"not an image"), "text/plain")},
    )
    assert response.status_code == 415


@pytest.mark.asyncio
async def test_list_images_empty(client: AsyncClient) -> None:
    response = await client.get("/api/images")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_get_image_not_found(client: AsyncClient) -> None:
    import uuid
    fake_id = str(uuid.uuid4())
    response = await client.get(f"/api/images/{fake_id}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_upload_and_get_image(client: AsyncClient, tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setattr("app.core.config.settings.storage_path", str(tmp_path))
    png = make_png_bytes(20, 30)
    upload = await client.post(
        "/api/images",
        files={"file": ("photo.png", io.BytesIO(png), "image/png")},
    )
    assert upload.status_code == 201
    image_id = upload.json()["id"]

    get = await client.get(f"/api/images/{image_id}")
    assert get.status_code == 200
    data = get.json()
    assert data["id"] == image_id
    assert data["original_name"] == "photo.png"
    assert data["width"] == 20
    assert data["height"] == 30
    assert data["tags"] == []


@pytest.mark.asyncio
async def test_add_tags_to_image(client: AsyncClient, tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setattr("app.core.config.settings.storage_path", str(tmp_path))
    png = make_png_bytes()
    upload = await client.post(
        "/api/images",
        files={"file": ("tagged.png", io.BytesIO(png), "image/png")},
    )
    image_id = upload.json()["id"]

    tag_response = await client.post(
        f"/api/images/{image_id}/tags",
        json={"add": ["cat", "fluffy"], "remove": []},
    )
    assert tag_response.status_code == 200
    data = tag_response.json()
    tag_names = [t["name"] for t in data["tags"]]
    assert "cat" in tag_names
    assert "fluffy" in tag_names


@pytest.mark.asyncio
async def test_remove_tags_from_image(client: AsyncClient, tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setattr("app.core.config.settings.storage_path", str(tmp_path))
    png = make_png_bytes()
    upload = await client.post(
        "/api/images",
        files={"file": ("remove_test.png", io.BytesIO(png), "image/png")},
    )
    image_id = upload.json()["id"]

    await client.post(
        f"/api/images/{image_id}/tags",
        json={"add": ["cat", "dog"], "remove": []},
    )
    remove_response = await client.post(
        f"/api/images/{image_id}/tags",
        json={"add": [], "remove": ["cat"]},
    )
    assert remove_response.status_code == 200
    tag_names = [t["name"] for t in remove_response.json()["tags"]]
    assert "cat" not in tag_names
    assert "dog" in tag_names
