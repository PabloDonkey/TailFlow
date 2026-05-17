"""Resilience tests for shared tag CSV import."""

from pathlib import Path

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import TaggingMode
from app.services.tag_import import import_tag_catalog


def write_catalog(
    tmp_path: Path,
    name: str,
    rows: list[str],
) -> Path:
    csv_path = tmp_path / name
    content = "\n".join([
        "id,name,category,post_count",
        *rows,
    ])
    csv_path.write_text(f"{content}\n", encoding="utf-8")
    return csv_path


@pytest.mark.asyncio
async def test_import_tag_catalog_skips_rows_with_missing_required_fields(
    session: AsyncSession,
    tmp_path: Path,
) -> None:
    csv_path = write_catalog(
        tmp_path,
        "e621.csv",
        [
            "7115,anthro,0,10",
            ",head_horn,0,2642",
            "42,wolf,5,20",
            "13,,4,100",
        ],
    )

    summary = await import_tag_catalog(session, TaggingMode.E621, csv_path)

    assert summary.processed == 2
    assert summary.created == 2
    assert summary.merged == 0
    assert summary.skipped == 0
    assert summary.invalid == 2
