"""Canonicalize tag names and merge duplicates.

Folds tags that differ only by case or by space-vs-underscore into a single row
(ADR-011), repoints every assignment at the survivor, and canonicalizes project
trigger/class tags to match.

Revision ID: 0007
Revises: 0006
Create Date: 2026-08-02
"""

from collections.abc import Sequence

from alembic import op

revision: str = "0007"
down_revision: str | None = "0006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


# Mirrors app.core.tag_names.canonical_tag_name: strip, lowercase, and collapse
# every run of whitespace into a single underscore. Kept as SQL so the merge runs
# in one pass in the database rather than pulling ~100k rows through Python.
CANONICAL = (
    r"regexp_replace("
    r"  regexp_replace(lower({col}), '^\s+|\s+$', '', 'g'),"
    r"  '\s+', '_', 'g')"
)


def upgrade() -> None:
    canonical_name = CANONICAL.format(col="name")

    # Survivor per canonical group: prefer a catalog-backed tag (it carries the
    # external IDs and category), then the oldest, then lowest id for determinism.
    op.execute(
        f"""
        CREATE TEMP TABLE tag_map AS
        SELECT id AS tag_id,
               first_value(id) OVER (
                   PARTITION BY {canonical_name}
                   ORDER BY (catalog_ids::text <> '{{}}') DESC, created_at, id
               ) AS survivor_id
        FROM tags
        """
    )
    op.execute("CREATE INDEX ON tag_map (tag_id)")

    # Carry catalog metadata from losers onto the survivor where it has none.
    op.execute(
        """
        UPDATE tags s
        SET catalog_ids = l.catalog_ids
        FROM tag_map m
        JOIN tags l ON l.id = m.tag_id
        WHERE s.id = m.survivor_id
          AND m.tag_id <> m.survivor_id
          AND s.catalog_ids::text = '{}'
          AND l.catalog_ids::text <> '{}'
        """
    )
    op.execute(
        """
        UPDATE tags s
        SET category = l.category
        FROM tag_map m
        JOIN tags l ON l.id = m.tag_id
        WHERE s.id = m.survivor_id
          AND m.tag_id <> m.survivor_id
          AND s.category IS NULL
          AND l.category IS NOT NULL
        """
    )

    # Collapse assignments: keep one link per (image, canonical tag), preferring a
    # protected link and then the lowest position. Doing this before repointing
    # avoids violating the (image_id, tag_id) primary key.
    op.execute(
        """
        DELETE FROM dataset_image_tag d
        USING (
            SELECT d2.image_id,
                   d2.tag_id,
                   row_number() OVER (
                       PARTITION BY d2.image_id, m.survivor_id
                       ORDER BY d2.is_protected DESC, d2.position, d2.tag_id
                   ) AS rn
            FROM dataset_image_tag d2
            JOIN tag_map m ON m.tag_id = d2.tag_id
        ) dup
        WHERE d.image_id = dup.image_id
          AND d.tag_id = dup.tag_id
          AND dup.rn > 1
        """
    )
    op.execute(
        """
        UPDATE dataset_image_tag d
        SET tag_id = m.survivor_id
        FROM tag_map m
        WHERE d.tag_id = m.tag_id AND d.tag_id <> m.survivor_id
        """
    )

    # Same collapse for the legacy image_tag junction, which still references tags.
    op.execute(
        """
        DELETE FROM image_tag i
        USING (
            SELECT i2.image_id,
                   i2.tag_id,
                   row_number() OVER (
                       PARTITION BY i2.image_id, m.survivor_id ORDER BY i2.tag_id
                   ) AS rn
            FROM image_tag i2
            JOIN tag_map m ON m.tag_id = i2.tag_id
        ) dup
        WHERE i.image_id = dup.image_id
          AND i.tag_id = dup.tag_id
          AND dup.rn > 1
        """
    )
    op.execute(
        """
        UPDATE image_tag i
        SET tag_id = m.survivor_id
        FROM tag_map m
        WHERE i.tag_id = m.tag_id AND i.tag_id <> m.survivor_id
        """
    )

    # Losers must go before survivors are renamed, or a rename can collide with a
    # loser that already holds the canonical name.
    op.execute(
        """
        DELETE FROM tags t
        USING tag_map m
        WHERE t.id = m.tag_id AND m.tag_id <> m.survivor_id
        """
    )
    op.execute(
        f"UPDATE tags SET name = {canonical_name} WHERE name <> {canonical_name}"
    )

    op.execute(
        "UPDATE projects SET trigger_tag = "
        + CANONICAL.format(col="trigger_tag")
        + " WHERE trigger_tag <> "
        + CANONICAL.format(col="trigger_tag")
    )
    op.execute(
        "UPDATE projects SET class_tag = "
        + CANONICAL.format(col="class_tag")
        + " WHERE class_tag <> "
        + CANONICAL.format(col="class_tag")
    )

    op.execute("DROP TABLE tag_map")


def downgrade() -> None:
    """Intentionally a no-op.

    The upgrade merges duplicate tags and drops the losers, so the pre-merge
    names and assignments no longer exist to restore. Downgrading the schema is
    safe (nothing structural changed); recovering the original tag spellings
    requires re-syncing from the `.txt` sidecars on disk, which remain the
    source of truth.
    """
