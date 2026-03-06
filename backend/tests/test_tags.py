"""Tests for tag API endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_tags_empty(client: AsyncClient) -> None:
    response = await client.get("/api/tags")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_create_tag(client: AsyncClient) -> None:
    response = await client.post("/api/tags", json={"name": "cat", "category": "animal"})
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "cat"
    assert data["category"] == "animal"
    assert "id" in data
    assert "created_at" in data


@pytest.mark.asyncio
async def test_create_tag_duplicate(client: AsyncClient) -> None:
    await client.post("/api/tags", json={"name": "dog"})
    response = await client.post("/api/tags", json={"name": "dog"})
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_list_tags_after_create(client: AsyncClient) -> None:
    await client.post("/api/tags", json={"name": "zebra"})
    await client.post("/api/tags", json={"name": "apple"})
    response = await client.get("/api/tags")
    assert response.status_code == 200
    names = [t["name"] for t in response.json()]
    assert "apple" in names
    assert "zebra" in names


@pytest.mark.asyncio
async def test_create_tag_without_category(client: AsyncClient) -> None:
    response = await client.post("/api/tags", json={"name": "misc"})
    assert response.status_code == 201
    assert response.json()["category"] is None
