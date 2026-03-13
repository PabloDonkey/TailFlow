import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import JSON, DateTime, String, Uuid
from sqlalchemy.ext.mutable import MutableDict
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.image import image_tag

if TYPE_CHECKING:
    from app.models.dataset_image import DatasetImageTag
    from app.models.image import Image


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    catalog_ids: Mapped[dict[str, str]] = mapped_column(
        MutableDict.as_mutable(JSON), nullable=False, default=dict
    )
    category: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC)
    )

    images: Mapped[list["Image"]] = relationship(
        "Image", secondary=image_tag, back_populates="tags", lazy="selectin"
    )
    image_tag_links: Mapped[list["DatasetImageTag"]] = relationship(
        "DatasetImageTag",
        back_populates="tag",
        lazy="selectin",
        overlaps="dataset_image,project,image_tag_links",
    )
