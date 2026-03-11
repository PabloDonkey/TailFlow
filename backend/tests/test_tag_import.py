"""Tests for shared tag CSV import."""

from pathlib import Path

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import TaggingMode
from app.models.tag import Tag
from app.services.tag_import import import_tag_catalog


def write_catalog(
    tmp_path: Path,
    name: str,
    rows: list[tuple[str, str, str, str]],
) -> Path:
    csv_path = tmp_path / name
    content = "\n".join(
        [
            "id,name,category,post_count",
            *(",".join(row) for row in rows),
        ]
    )
    csv_path.write_text(f"{content}\n", encoding="utf-8")
    return csv_path


@pytest.mark.asyncio
async def test_import_tag_catalog_creates_tags_with_normalized_categories(
    session: AsyncSession, tmp_path: Path
) -> None:
    csv_path = write_catalog(
        tmp_path,
        "e621.csv",
        [
            ("7115", "anthro", "0", "10"),
            ("42", "wolf", "5", "20"),
        ],
    )

    summary = await import_tag_catalog(session, TaggingMode.E621, csv_path)

    assert summary.processed == 2
    assert summary.created == 2
    assert summary.merged == 0
    assert summary.skipped == 0

    result = await session.execute(select(Tag).order_by(Tag.name))
    tags = result.scalars().all()

    assert [tag.name for tag in tags] == ["anthro", "wolf"]
    assert tags[0].catalog_ids == {"e621": "7115"}
    assert tags[0].category == "general"
    assert tags[1].catalog_ids == {"e621": "42"}
    assert tags[1].category == "species"


@pytest.mark.asyncio
async def test_import_tag_catalog_merges_matching_tags_by_name(
    session: AsyncSession, tmp_path: Path
) -> None:
    e621_path = write_catalog(
        tmp_path,
        "e621.csv",
        [("111", "solo", "0", "10")],
    )
    booru_path = write_catalog(
        tmp_path,
        "booru.csv",
        [("222", "solo", "0", "15")],
    )

    await import_tag_catalog(session, TaggingMode.E621, e621_path)
    summary = await import_tag_catalog(session, TaggingMode.BOORU, booru_path)

    assert summary.processed == 1
    assert summary.created == 0
    assert summary.merged == 1
    assert summary.skipped == 0

    result = await session.execute(select(Tag).where(Tag.name == "solo"))
    tag = result.scalar_one()

    assert tag.catalog_ids == {"e621": "111", "booru": "222"}
    assert tag.category == "general"


@pytest.mark.asyncio
async def test_import_tag_catalog_is_idempotent_for_repeated_runs(
    session: AsyncSession, tmp_path: Path
) -> None:
    csv_path = write_catalog(
        tmp_path,
        "booru.csv",
        [
            ("26", "female", "0", "12"),
            ("78", "male", "0", "10"),
        ],
    )

    first_summary = await import_tag_catalog(session, TaggingMode.BOORU, csv_path)
    second_summary = await import_tag_catalog(session, TaggingMode.BOORU, csv_path)

    assert first_summary.created == 2
    assert second_summary.created == 0
    assert second_summary.merged == 0
    assert second_summary.skipped == 2

    result = await session.execute(select(Tag).order_by(Tag.name))
    tags = result.scalars().all()

    assert [tag.name for tag in tags] == ["female", "male"]
    assert all(tag.catalog_ids.get("booru") is not None for tag in tags)


@pytest.mark.asyncio
async def test_import_tag_catalog_prefers_specific_category_over_unknown(
    session: AsyncSession, tmp_path: Path
) -> None:
    session.add(Tag(name="world_tag", catalog_ids={}, category="unknown"))
    await session.commit()

    csv_path = write_catalog(
        tmp_path,
        "e621.csv",
        [("9", "world_tag", "8", "4")],
    )

    summary = await import_tag_catalog(session, TaggingMode.E621, csv_path)

    assert summary.created == 0
    assert summary.merged == 1
    assert summary.skipped == 0

    result = await session.execute(select(Tag).where(Tag.name == "world_tag"))
    tag = result.scalar_one()

    assert tag.catalog_ids == {"e621": "9"}
    assert tag.category == "lore"
