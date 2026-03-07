"""Project dataset workflow schema.

Revision ID: 0002
Revises: 0001
Create Date: 2026-03-07 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "projects",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("folder_name", sa.String(length=255), nullable=False),
        sa.Column("root_path", sa.String(length=2048), nullable=False),
        sa.Column("dataset_path", sa.String(length=2048), nullable=False),
        sa.Column("trigger_tag", sa.String(length=255), nullable=False),
        sa.Column("class_tag", sa.String(length=255), nullable=False),
        sa.Column("last_synced_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("missing_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("folder_name"),
    )

    op.create_table(
        "dataset_images",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("project_id", sa.Uuid(), nullable=False),
        sa.Column("relative_path", sa.String(length=2048), nullable=False),
        sa.Column("filename", sa.String(length=255), nullable=False),
        sa.Column("content_hash", sa.String(length=128), nullable=True),
        sa.Column("file_mtime_ns", sa.BigInteger(), nullable=True),
        sa.Column("file_size_bytes", sa.BigInteger(), nullable=True),
        sa.Column("discovered_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("removed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("project_id", "relative_path"),
    )

    op.create_table(
        "project_tags",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("project_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("project_id", "name"),
    )

    op.create_table(
        "dataset_image_tag",
        sa.Column("image_id", sa.Uuid(), nullable=False),
        sa.Column("tag_id", sa.Uuid(), nullable=False),
        sa.Column("project_id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["image_id"], ["dataset_images.id"]),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"]),
        sa.ForeignKeyConstraint(["tag_id"], ["project_tags.id"]),
        sa.PrimaryKeyConstraint("image_id", "tag_id"),
    )


def downgrade() -> None:
    op.drop_table("dataset_image_tag")
    op.drop_table("project_tags")
    op.drop_table("dataset_images")
    op.drop_table("projects")
