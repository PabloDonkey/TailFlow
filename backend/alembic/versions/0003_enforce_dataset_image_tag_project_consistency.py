"""Enforce dataset_image_tag project consistency.

Revision ID: 0003
Revises: 0002
Create Date: 2026-03-08 00:00:00.000000

"""

from collections.abc import Sequence

from alembic import op

revision: str = "0003"
down_revision: str | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_unique_constraint(
        "uq_dataset_image_id_project",
        "dataset_images",
        ["id", "project_id"],
    )
    op.create_unique_constraint(
        "uq_project_tag_id_project",
        "project_tags",
        ["id", "project_id"],
    )
    op.create_foreign_key(
        "fk_dataset_image_tag_image_project",
        "dataset_image_tag",
        "dataset_images",
        ["image_id", "project_id"],
        ["id", "project_id"],
    )
    op.create_foreign_key(
        "fk_dataset_image_tag_tag_project",
        "dataset_image_tag",
        "project_tags",
        ["tag_id", "project_id"],
        ["id", "project_id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_dataset_image_tag_tag_project",
        "dataset_image_tag",
        type_="foreignkey",
    )
    op.drop_constraint(
        "fk_dataset_image_tag_image_project",
        "dataset_image_tag",
        type_="foreignkey",
    )
    op.drop_constraint(
        "uq_project_tag_id_project",
        "project_tags",
        type_="unique",
    )
    op.drop_constraint(
        "uq_dataset_image_id_project",
        "dataset_images",
        type_="unique",
    )
