"""Add shared tag catalog IDs and project tagging mode.

Revision ID: 0004
Revises: 0003
Create Date: 2026-03-10 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0004"
down_revision: str | None = "0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

tagging_mode_enum = sa.Enum(
    "e621",
    "booru",
    name="tagging_mode",
    native_enum=False,
    length=16,
)


def upgrade() -> None:
    op.add_column(
        "projects",
        sa.Column(
            "tagging_mode",
            tagging_mode_enum,
            nullable=False,
            server_default=sa.text("'e621'"),
        ),
    )
    with op.batch_alter_table("projects") as batch_op:
        batch_op.alter_column(
            "tagging_mode",
            existing_type=tagging_mode_enum,
            nullable=False,
            server_default=None,
        )

    op.add_column(
        "tags",
        sa.Column(
            "catalog_ids",
            sa.JSON(),
            nullable=False,
            server_default=sa.text("'{}'"),
        ),
    )
    with op.batch_alter_table("tags") as batch_op:
        batch_op.alter_column(
            "catalog_ids",
            existing_type=sa.JSON(),
            nullable=False,
            server_default=None,
        )


def downgrade() -> None:
    with op.batch_alter_table("tags") as batch_op:
        batch_op.drop_column("catalog_ids")
    with op.batch_alter_table("projects") as batch_op:
        batch_op.drop_column("tagging_mode")
