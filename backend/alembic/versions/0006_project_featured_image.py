"""Add project featured image reference.

Revision ID: 0006
Revises: 0005
Create Date: 2026-07-04 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0006"
down_revision: str | None = "0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None



def upgrade() -> None:
    op.add_column(
        "projects",
        sa.Column("featured_image_id", sa.Uuid(), nullable=True),
    )
    op.create_foreign_key(
        "fk_projects_featured_image_id",
        "projects",
        "dataset_images",
        ["featured_image_id"],
        ["id"],
    )



def downgrade() -> None:
    op.drop_constraint(
        "fk_projects_featured_image_id",
        "projects",
        type_="foreignkey",
    )
    op.drop_column("projects", "featured_image_id")
