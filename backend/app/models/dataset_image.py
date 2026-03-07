import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, DateTime, ForeignKey, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.project import Project


class DatasetImage(Base):
    __tablename__ = "dataset_images"

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
    )


class ProjectTag(Base):
    __tablename__ = "project_tags"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("projects.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC)
    )

    project: Mapped["Project"] = relationship(
        "Project", back_populates="tags", lazy="selectin"
    )
    image_tag_links: Mapped[list["DatasetImageTag"]] = relationship(
        "DatasetImageTag",
        back_populates="tag",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class DatasetImageTag(Base):
    __tablename__ = "dataset_image_tag"

    image_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("dataset_images.id"), primary_key=True
    )
    tag_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("project_tags.id"), primary_key=True
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("projects.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC)
    )

    dataset_image: Mapped["DatasetImage"] = relationship(
        "DatasetImage", back_populates="image_tag_links", lazy="selectin"
    )
    tag: Mapped["ProjectTag"] = relationship(
        "ProjectTag", back_populates="image_tag_links", lazy="selectin"
    )
    project: Mapped["Project"] = relationship(
        "Project", back_populates="image_tag_links", lazy="selectin"
    )
