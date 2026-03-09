import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.dataset_image import DatasetImage, DatasetImageTag, ProjectTag


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    folder_name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    root_path: Mapped[str] = mapped_column(String(2048), nullable=False)
    dataset_path: Mapped[str] = mapped_column(String(2048), nullable=False)
    trigger_tag: Mapped[str] = mapped_column(String(255), nullable=False)
    class_tag: Mapped[str] = mapped_column(String(255), nullable=False)
    last_synced_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    missing_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    dataset_images: Mapped[list["DatasetImage"]] = relationship(
        "DatasetImage",
        back_populates="project",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    tags: Mapped[list["ProjectTag"]] = relationship(
        "ProjectTag",
        back_populates="project",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    image_tag_links: Mapped[list["DatasetImageTag"]] = relationship(
        "DatasetImageTag",
        back_populates="project",
        cascade="all, delete-orphan",
        lazy="selectin",
        overlaps="dataset_image,tag,image_tag_links",
    )
