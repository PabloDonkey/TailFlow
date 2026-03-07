import uuid
from datetime import datetime

from pydantic import BaseModel


class TagCreate(BaseModel):
    name: str
    category: str | None = None


class TagRead(BaseModel):
    id: uuid.UUID
    name: str
    category: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
