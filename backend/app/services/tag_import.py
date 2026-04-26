from __future__ import annotations

import csv
from dataclasses import dataclass
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import TaggingMode
from app.models.tag import Tag

REPO_ROOT = Path(__file__).resolve().parents[3]
ASSETS_DIR = REPO_ROOT / "assets"

CATEGORY_BY_RAW_VALUE = {
    "0": "general",
    "1": "artist",
    "2": "contributor",
    "3": "copyright",
    "4": "character",
    "5": "species",
    "6": "invalid",
    "7": "meta",
    "8": "lore",
    "9": "unknown",
    "general": "general",
    "artist": "artist",
    "contributor": "contributor",
    "contributor (silver)": "contributor",
    "copyright": "copyright",
    "character": "character",
    "species": "species",
    "invalid": "invalid",
    "meta": "meta",
    "lore": "lore",
    "new/unknown category": "unknown",
    "unknown": "unknown",
}

CATALOG_ASSET_PATHS = {
    TaggingMode.E621: ASSETS_DIR / "e621-tags-list.csv",
    TaggingMode.BOORU: ASSETS_DIR / "booru-tags-list.csv",
}

REQUIRED_COLUMNS = frozenset({"id", "name", "category"})


@dataclass(frozen=True)
class TagImportRow:
    external_id: str
    name: str
    category: str | None


@dataclass(frozen=True)
class TagImportSummary:
    source: TaggingMode
    processed: int
    created: int
    merged: int
    skipped: int
    invalid: int = 0


def get_catalog_asset_path(source: TaggingMode) -> Path:
    return CATALOG_ASSET_PATHS[source]


def normalize_import_category(raw_value: str | None) -> str | None:
    if raw_value is None:
        return None

    normalized = raw_value.strip().lower()
    if not normalized:
        return None

    return CATEGORY_BY_RAW_VALUE.get(normalized, normalized)


def _normalize_required_field(raw_value: str | None, field_name: str) -> str:
    if raw_value is None:
        raise ValueError(f"CSV field '{field_name}' is required.")

    normalized = raw_value.strip()
    if not normalized:
        raise ValueError(f"CSV field '{field_name}' must not be empty.")
    return normalized


def load_tag_import_rows(csv_path: Path) -> tuple[list[TagImportRow], int]:
    if not csv_path.exists():
        raise FileNotFoundError(f"Tag catalog does not exist: {csv_path}")

    with csv_path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        fieldnames = set(reader.fieldnames or [])
        missing_columns = REQUIRED_COLUMNS - fieldnames
        if missing_columns:
            missing = ", ".join(sorted(missing_columns))
            raise ValueError(
                f"Tag catalog {csv_path} is missing required columns: {missing}"
            )

        rows: list[TagImportRow] = []
        invalid_rows = 0
        for row in reader:
            try:
                rows.append(
                    TagImportRow(
                        external_id=_normalize_required_field(row.get("id"), "id"),
                        name=_normalize_required_field(row.get("name"), "name"),
                        category=normalize_import_category(row.get("category")),
                    )
                )
            except ValueError:
                invalid_rows += 1
                continue
    return rows, invalid_rows


def merge_import_category(
    existing_category: str | None, imported_category: str | None
) -> str | None:
    normalized_existing = normalize_import_category(existing_category)
    normalized_imported = normalize_import_category(imported_category)

    if normalized_imported is None:
        return normalized_existing
    if normalized_existing is None:
        return normalized_imported
    if normalized_existing == normalized_imported:
        return normalized_existing
    if normalized_existing == "unknown":
        return normalized_imported
    return normalized_existing


async def import_tag_catalog(
    session: AsyncSession,
    source: TaggingMode,
    csv_path: Path | None = None,
) -> TagImportSummary:
    target_path = csv_path or get_catalog_asset_path(source)
    rows, invalid_rows = load_tag_import_rows(target_path)

    tags_by_name: dict[str, Tag]
    unique_names = {row.name for row in rows}
    if unique_names:
        existing_result = await session.execute(
            select(Tag).where(Tag.name.in_(unique_names))
        )
        tags_by_name = {tag.name: tag for tag in existing_result.scalars().all()}
    else:
        tags_by_name = {}

    created = 0
    merged = 0
    skipped = 0

    for row in rows:
        tag = tags_by_name.get(row.name)
        if tag is None:
            tag = Tag(
                name=row.name,
                catalog_ids={source.value: row.external_id},
                category=row.category,
            )
            session.add(tag)
            tags_by_name[row.name] = tag
            created += 1
            continue

        changed = False

        existing_external_id = tag.catalog_ids.get(source.value)
        if existing_external_id != row.external_id:
            updated_catalog_ids = dict(tag.catalog_ids)
            updated_catalog_ids[source.value] = row.external_id
            tag.catalog_ids = updated_catalog_ids
            changed = True

        merged_category = merge_import_category(tag.category, row.category)
        if merged_category != tag.category:
            tag.category = merged_category
            changed = True

        if changed:
            merged += 1
        else:
            skipped += 1

    await session.commit()

    return TagImportSummary(
        source=source,
        processed=len(rows),
        created=created,
        merged=merged,
        skipped=skipped,
        invalid=invalid_rows,
    )
