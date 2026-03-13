import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    ForeignKeyConstraint,
    Integer,
    String,
    UniqueConstraint,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.project import Project
    from app.models.tag import Tag


class DatasetImage(Base):
    __tablename__ = "dataset_images"
    __table_args__ = (
        UniqueConstraint("project_id", "relative_path", name="uq_dataset_image_path"),
        UniqueConstraint("id", "project_id", name="uq_dataset_image_id_project"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("projects.id"), nullable=False
    )
    relative_path: Mapped[str] = mapped_column(String(2048), nullable=False)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    content_hash: Mapped[str | None] = mapped_column(String(128), nullable=True)
    file_mtime_ns: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    file_size_bytes: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    discovered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC)
    )
    removed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    project: Mapped["Project"] = relationship(
        "Project", back_populates="dataset_images", lazy="selectin"
    )
    image_tag_links: Mapped[list["DatasetImageTag"]] = relationship(
        "DatasetImageTag",
        back_populates="dataset_image",
        cascade="all, delete-orphan",
        lazy="selectin",
        overlaps="project,tag,image_tag_links",
    )

class DatasetImageTag(Base):
    __tablename__ = "dataset_image_tag"
    __table_args__ = (
        ForeignKeyConstraint(
            ["image_id", "project_id"],
            ["dataset_images.id", "dataset_images.project_id"],
            name="fk_dataset_image_tag_image_project",
        ),
        UniqueConstraint("image_id", "position", name="uq_dataset_image_tag_position"),
    )

    image_id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True)
    tag_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("tags.id"), primary_key=True
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("projects.id"), nullable=False
    )
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_protected: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC)
    )

    dataset_image: Mapped["DatasetImage"] = relationship(
        "DatasetImage",
        back_populates="image_tag_links",
        lazy="selectin",
        overlaps="project,tag,image_tag_links",
    )
    tag: Mapped["Tag"] = relationship(
        "Tag",
        back_populates="image_tag_links",
        lazy="selectin",
        overlaps="dataset_image,project,image_tag_links",
    )
    project: Mapped["Project"] = relationship(
        "Project",
        back_populates="image_tag_links",
        lazy="selectin",
        overlaps="dataset_image,tag,image_tag_links",
    )
