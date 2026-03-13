"""Migrate dataset image tags to shared tag assignments.

Revision ID: 0005
Revises: 0004
Create Date: 2026-03-11 00:00:00.000000

"""

import uuid
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0005"
down_revision: str | None = "0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

project_tags_table = sa.table(
    "project_tags",
    sa.column("id", sa.Uuid()),
    sa.column("project_id", sa.Uuid()),
    sa.column("name", sa.String(length=255)),
    sa.column("created_at", sa.DateTime(timezone=True)),
)

tags_table = sa.table(
    "tags",
    sa.column("id", sa.Uuid()),
    sa.column("name", sa.String(length=255)),
    sa.column("catalog_ids", sa.JSON()),
    sa.column("category", sa.String(length=255)),
    sa.column("created_at", sa.DateTime(timezone=True)),
)

legacy_dataset_image_tag_table = sa.table(
    "dataset_image_tag",
    sa.column("image_id", sa.Uuid()),
    sa.column("tag_id", sa.Uuid()),
    sa.column("project_id", sa.Uuid()),
    sa.column("created_at", sa.DateTime(timezone=True)),
)

new_dataset_image_tag_table = sa.table(
    "dataset_image_tag_new",
    sa.column("image_id", sa.Uuid()),
    sa.column("tag_id", sa.Uuid()),
    sa.column("project_id", sa.Uuid()),
    sa.column("position", sa.Integer()),
    sa.column("is_protected", sa.Boolean()),
    sa.column("created_at", sa.DateTime(timezone=True)),
)


def upgrade() -> None:
    bind = op.get_bind()

    existing_tags = {
        row.name: row.id
        for row in bind.execute(
            sa.select(tags_table.c.id, tags_table.c.name)
        ).mappings()
    }

    project_tag_rows = list(
        bind.execute(
            sa.select(
                project_tags_table.c.id,
                project_tags_table.c.name,
                project_tags_table.c.created_at,
            ).order_by(
                project_tags_table.c.created_at.asc(),
                project_tags_table.c.id.asc(),
            )
        ).mappings()
    )

    shared_tag_ids_by_legacy_id: dict[uuid.UUID, uuid.UUID] = {}
    for row in project_tag_rows:
        shared_tag_id = existing_tags.get(row["name"])
        if shared_tag_id is None:
            shared_tag_id = uuid.uuid4()
            bind.execute(
                sa.insert(tags_table).values(
                    id=shared_tag_id,
                    name=row["name"],
                    catalog_ids={},
                    category=None,
                    created_at=row["created_at"],
                )
            )
            existing_tags[row["name"]] = shared_tag_id
        shared_tag_ids_by_legacy_id[row["id"]] = shared_tag_id

    op.create_table(
        "dataset_image_tag_new",
        sa.Column("image_id", sa.Uuid(), nullable=False),
        sa.Column("tag_id", sa.Uuid(), nullable=False),
        sa.Column("project_id", sa.Uuid(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column(
            "is_protected",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"]),
        sa.ForeignKeyConstraint(["tag_id"], ["tags.id"]),
        sa.ForeignKeyConstraint(
            ["image_id", "project_id"],
            ["dataset_images.id", "dataset_images.project_id"],
            name="fk_dataset_image_tag_image_project",
        ),
        sa.PrimaryKeyConstraint("image_id", "tag_id"),
        sa.UniqueConstraint(
            "image_id",
            "position",
            name="uq_dataset_image_tag_position",
        ),
    )

    legacy_links = list(
        bind.execute(
            sa.select(
                legacy_dataset_image_tag_table.c.image_id,
                legacy_dataset_image_tag_table.c.tag_id,
                legacy_dataset_image_tag_table.c.project_id,
                legacy_dataset_image_tag_table.c.created_at,
            ).order_by(
                legacy_dataset_image_tag_table.c.image_id.asc(),
                legacy_dataset_image_tag_table.c.created_at.asc(),
                legacy_dataset_image_tag_table.c.tag_id.asc(),
            )
        ).mappings()
    )

    next_position_by_image: dict[uuid.UUID, int] = {}
    for row in legacy_links:
        shared_tag_id = shared_tag_ids_by_legacy_id[row["tag_id"]]
        position = next_position_by_image.get(row["image_id"], 0)
        bind.execute(
            sa.insert(new_dataset_image_tag_table).values(
                image_id=row["image_id"],
                tag_id=shared_tag_id,
                project_id=row["project_id"],
                position=position,
                is_protected=False,
                created_at=row["created_at"],
            )
        )
        next_position_by_image[row["image_id"]] = position + 1

    op.drop_table("dataset_image_tag")
    op.drop_table("project_tags")
    op.rename_table("dataset_image_tag_new", "dataset_image_tag")


def downgrade() -> None:
    bind = op.get_bind()

    op.create_table(
        "project_tags",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("project_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("project_id", "name", name="uq_project_tag_name"),
        sa.UniqueConstraint("id", "project_id", name="uq_project_tag_id_project"),
    )

    downgraded_dataset_image_tag_table = sa.table(
        "dataset_image_tag_old",
        sa.column("image_id", sa.Uuid()),
        sa.column("tag_id", sa.Uuid()),
        sa.column("project_id", sa.Uuid()),
        sa.column("created_at", sa.DateTime(timezone=True)),
    )

    op.create_table(
        "dataset_image_tag_old",
        sa.Column("image_id", sa.Uuid(), nullable=False),
        sa.Column("tag_id", sa.Uuid(), nullable=False),
        sa.Column("project_id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"]),
        sa.ForeignKeyConstraint(
            ["image_id", "project_id"],
            ["dataset_images.id", "dataset_images.project_id"],
            name="fk_dataset_image_tag_image_project",
        ),
        sa.ForeignKeyConstraint(
            ["tag_id", "project_id"],
            ["project_tags.id", "project_tags.project_id"],
            name="fk_dataset_image_tag_tag_project",
        ),
        sa.PrimaryKeyConstraint("image_id", "tag_id"),
    )

    current_links = list(
        bind.execute(
            sa.select(
                sa.column("image_id"),
                sa.column("tag_id"),
                sa.column("project_id"),
                sa.column("created_at"),
            ).select_from(sa.table("dataset_image_tag"))
        ).mappings()
    )

    tag_rows = {
        row.id: row.name
        for row in bind.execute(
            sa.select(tags_table.c.id, tags_table.c.name)
        ).mappings()
    }

    project_tag_ids_by_key: dict[tuple[uuid.UUID, str], uuid.UUID] = {}
    for row in current_links:
        name = tag_rows[row["tag_id"]]
        key = (row["project_id"], name)
        project_tag_id = project_tag_ids_by_key.get(key)
        if project_tag_id is None:
            project_tag_id = uuid.uuid4()
            bind.execute(
                sa.insert(project_tags_table).values(
                    id=project_tag_id,
                    project_id=row["project_id"],
                    name=name,
                    created_at=row["created_at"],
                )
            )
            project_tag_ids_by_key[key] = project_tag_id

        bind.execute(
            sa.insert(downgraded_dataset_image_tag_table).values(
                image_id=row["image_id"],
                tag_id=project_tag_id,
                project_id=row["project_id"],
                created_at=row["created_at"],
            )
        )

    op.drop_table("dataset_image_tag")
    op.rename_table("dataset_image_tag_old", "dataset_image_tag")
