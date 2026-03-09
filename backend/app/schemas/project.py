import uuid
from datetime import datetime

from pydantic import BaseModel


class ProjectTagRead(BaseModel):
    id: uuid.UUID
    name: str

    model_config = {"from_attributes": True}


class ProjectRead(BaseModel):
    id: uuid.UUID
    name: str
    folder_name: str
    root_path: str
    dataset_path: str
    trigger_tag: str
    class_tag: str
    last_synced_at: datetime | None = None
    missing_at: datetime | None = None

    model_config = {"from_attributes": True}


class ProjectCreate(BaseModel):
    folder_name: str
    class_tag: str
    name: str | None = None
    trigger_tag: str | None = None


class ProjectCreateResponse(BaseModel):
    project: ProjectRead


class ProjectUpdate(BaseModel):
    trigger_tag: str | None = None
    class_tag: str | None = None


class ProjectImageSummary(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    relative_path: str
    filename: str
    discovered_at: datetime

    model_config = {"from_attributes": True}


class ProjectImageRead(ProjectImageSummary):
    removed_at: datetime | None = None
    tags: list[ProjectTagRead] = []


class ProjectImageTagUpdate(BaseModel):
    add: list[str] = []
    remove: list[str] = []


class ProjectDiscoverResponse(BaseModel):
    discovered_projects: int
    imported_projects: int
    marked_missing_projects: int


class ProjectImageUploadResponse(BaseModel):
    project_id: uuid.UUID
    uploaded_files: list[str]
    created_records: int
    restored_records: int


class ProjectSyncResponse(BaseModel):
    project_id: uuid.UUID
    added_images: int
    removed_images: int
    restored_images: int
    missing: bool
    synced_at: datetime
