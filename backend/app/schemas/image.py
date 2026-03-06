import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas.tag import TagRead


class ImageBase(BaseModel):
    original_name: str


class ImageRead(ImageBase):
    id: uuid.UUID
    filename: str
    uploaded_at: datetime
    width: int
    height: int
    tags: list[TagRead] = []

    model_config = {"from_attributes": True}


class ImageSummary(BaseModel):
    id: uuid.UUID
    filename: str
    original_name: str
    uploaded_at: datetime
    width: int
    height: int
    tag_count: int = 0

    model_config = {"from_attributes": True}


class ImageUploadResponse(BaseModel):
    id: uuid.UUID
    suggested_tags: list[str] = []


class ImageTagUpdate(BaseModel):
    add: list[str] = []
    remove: list[str] = []
