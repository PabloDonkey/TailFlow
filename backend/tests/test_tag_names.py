"""Tests for canonical tag names (ADR-011)."""

from pathlib import Path

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.tag_names import canonical_tag_name
from app.models.tag import Tag
from app.services.tagging import get_or_create_tag


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("simple_background", "simple_background"),
        ("simple background", "simple_background"),
        ("Simple Background", "simple_background"),
        ("  Simple   Background  ", "simple_background"),
        ("SIMPLE\tBACKGROUND", "simple_background"),
        ("pussy-cat (meme)", "pussy-cat_(meme)"),
        ("digital_media_(artwork)", "digital_media_(artwork)"),
        ("4qua", "4qua"),
        ("", ""),
        ("   ", ""),
    ],
)
def test_canonical_tag_name(raw: str, expected: str) -> None:
    assert canonical_tag_name(raw) == expected


def test_canonical_tag_name_is_idempotent() -> None:
    for raw in ["Simple Background", "pussy-cat (meme)", "  A  B  "]:
        once = canonical_tag_name(raw)
        assert canonical_tag_name(once) == once


@pytest.mark.asyncio
async def test_get_or_create_tag_folds_spelling_variants(
    session: AsyncSession,
) -> None:
    first = await get_or_create_tag(session, "Simple Background")
    second = await get_or_create_tag(session, "simple_background")
    third = await get_or_create_tag(session, "  SIMPLE   background ")

    assert first.id == second.id == third.id
    assert first.name == "simple_background"

    tags = (await session.execute(select(Tag))).scalars().all()
    assert len(tags) == 1


@pytest.mark.asyncio
async def test_create_tag_endpoint_canonicalizes(client: AsyncClient) -> None:
    response = await client.post("/api/tags", json={"name": "Bedroom Eyes"})
    assert response.status_code == 201
    assert response.json()["name"] == "bedroom_eyes"


@pytest.mark.asyncio
async def test_create_tag_endpoint_rejects_variant_as_duplicate(
    client: AsyncClient,
) -> None:
    await client.post("/api/tags", json={"name": "bedroom_eyes"})
    response = await client.post("/api/tags", json={"name": "Bedroom Eyes"})
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_create_project_canonicalizes_trigger_and_class_tags(
    client: AsyncClient, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr("app.core.config.settings.projects_root_path", tmp_path)

    response = await client.post(
        "/api/projects",
        json={
            "folder_name": "canon-project",
            "trigger_tag": "My Trigger",
            "class_tag": "Anthro",
        },
    )

    assert response.status_code == 201
    project = response.json()["project"]
    assert project["trigger_tag"] == "my_trigger"
    assert project["class_tag"] == "anthro"


@pytest.mark.asyncio
async def test_create_project_rejects_tags_equal_after_canonicalization(
    client: AsyncClient, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """`Flippy` and `flippy` name the same tag, so they are not distinct."""
    monkeypatch.setattr("app.core.config.settings.projects_root_path", tmp_path)

    response = await client.post(
        "/api/projects",
        json={
            "folder_name": "variant-tags",
            "trigger_tag": "Flippy",
            "class_tag": "flippy",
        },
    )

    assert response.status_code == 400
    assert (
        response.json()["detail"]
        == "Project trigger_tag and class_tag must be different."
    )


@pytest.mark.asyncio
async def test_sidecar_variants_resolve_to_one_tag(
    client: AsyncClient, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """A space-form sidecar tag must land on the existing catalog tag."""
    from tests.conftest import make_png_bytes

    monkeypatch.setattr("app.core.config.settings.projects_root_path", tmp_path)

    created = await client.post(
        "/api/projects",
        json={"folder_name": "sidecar-canon", "class_tag": "anthro"},
    )
    project = created.json()["project"]

    dataset = tmp_path / "sidecar-canon" / "dataset"
    (dataset / "a.png").write_bytes(make_png_bytes())
    (dataset / "a.txt").write_text(
        "simple background, Looking At Viewer", encoding="utf-8"
    )

    sync = await client.post(f"/api/projects/{project['id']}/sync")
    assert sync.status_code == 200

    images = (await client.get(f"/api/projects/{project['id']}/images")).json()
    detail = (
        await client.get(f"/api/projects/{project['id']}/images/{images[0]['id']}")
    ).json()

    names = [tag["name"] for tag in detail["tags"]]
    assert "simple_background" in names
    assert "looking_at_viewer" in names
    assert "simple background" not in names
    assert "Looking At Viewer" not in names


@pytest.mark.asyncio
async def test_manual_add_matches_existing_tag_across_spelling(
    client: AsyncClient, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Adding `Simple Background` must reuse `simple_background`, not 422."""
    from tests.conftest import make_png_bytes

    monkeypatch.setattr("app.core.config.settings.projects_root_path", tmp_path)
    await client.post("/api/tags", json={"name": "simple_background"})

    created = await client.post(
        "/api/projects",
        json={"folder_name": "manual-canon", "class_tag": "anthro"},
    )
    project = created.json()["project"]
    dataset = tmp_path / "manual-canon" / "dataset"
    (dataset / "a.png").write_bytes(make_png_bytes())
    await client.post(f"/api/projects/{project['id']}/sync")
    images = (await client.get(f"/api/projects/{project['id']}/images")).json()

    response = await client.post(
        f"/api/projects/{project['id']}/images/{images[0]['id']}/tags",
        json={"add": ["Simple Background"], "create_missing": False},
    )

    assert response.status_code == 200
    assert "simple_background" in [tag["name"] for tag in response.json()["tags"]]


@pytest.mark.asyncio
async def test_protected_tag_removal_blocked_across_spelling(
    client: AsyncClient, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Removing `Anthro` must be blocked when the class tag is `anthro`."""
    from tests.conftest import make_png_bytes

    monkeypatch.setattr("app.core.config.settings.projects_root_path", tmp_path)

    created = await client.post(
        "/api/projects",
        json={"folder_name": "protected-canon", "class_tag": "anthro"},
    )
    project = created.json()["project"]
    dataset = tmp_path / "protected-canon" / "dataset"
    (dataset / "a.png").write_bytes(make_png_bytes())
    await client.post(f"/api/projects/{project['id']}/sync")
    images = (await client.get(f"/api/projects/{project['id']}/images")).json()

    response = await client.post(
        f"/api/projects/{project['id']}/images/{images[0]['id']}/tags",
        json={"remove": ["Anthro"]},
    )

    assert response.status_code == 422
    assert "Protected trigger and class tags cannot be removed" in (
        response.json()["detail"]
    )
