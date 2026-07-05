import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.core.enums import TaggingMode


class ProjectTagRead(BaseModel):
    id: uuid.UUID
    name: str
    catalog_ids: dict[str, str] = Field(default_factory=dict)
    category: str | None = None
    position: int
    is_protected: bool

    model_config = {"extra": "ignore"}


class ProjectImagePreviewRead(BaseModel):
    id: uuid.UUID
    relative_path: str
    filename: str
    content_hash: str | None = None
    discovered_at: datetime

    model_config = {"from_attributes": True}


class ProjectRead(BaseModel):
    id: uuid.UUID
    name: str
    folder_name: str
    root_path: str
    dataset_path: str
    trigger_tag: str
    class_tag: str
    tagging_mode: TaggingMode
    featured_image_id: uuid.UUID | None = None
    preview_image: ProjectImagePreviewRead | None = None
    last_synced_at: datetime | None = None
    missing_at: datetime | None = None

    model_config = {"from_attributes": True}


class ProjectCreate(BaseModel):
    folder_name: str
    class_tag: str
    name: str | None = None
    trigger_tag: str | None = None
    tagging_mode: TaggingMode = TaggingMode.E621


class ProjectCreateResponse(BaseModel):
    project: ProjectRead


class ProjectUpdate(BaseModel):
    trigger_tag: str | None = None
    class_tag: str | None = None
    tagging_mode: TaggingMode | None = None


class ProjectImageSummary(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    relative_path: str
    filename: str
    content_hash: str | None = None
    discovered_at: datetime
    tag_count: int = 0

    model_config = {"from_attributes": True}


class ProjectImageRead(ProjectImageSummary):
    removed_at: datetime | None = None
    tags: list[ProjectTagRead] = Field(default_factory=list)


class ProjectImageTagUpdate(BaseModel):
    add: list[str] = Field(default_factory=list)
    remove: list[str] = Field(default_factory=list)
    create_missing: bool = False


class ProjectImageClassifyRequest(BaseModel):
    model_id: str = "jtp-3-hydra"
    threshold: float = Field(default=0.35, ge=0.0, le=1.0)
    max_tags: int = Field(default=32, ge=1, le=128)


class ProjectImageClassifySuggestion(BaseModel):
    name: str
    confidence: float = Field(ge=0.0, le=1.0)


class ProjectImageClassifyResponse(BaseModel):
    suggestions: list[ProjectImageClassifySuggestion] = Field(default_factory=list)
    model_id: str
    model_available: bool
    download_progress_percent: int = Field(ge=0, le=100)
    download_proposal_url: str | None = None
    download_message: str | None = None


class ProjectDiscoverResponse(BaseModel):
    discovered_projects: int
    imported_projects: int
    marked_missing_projects: int


class ProjectImageUploadResponse(BaseModel):
    project_id: uuid.UUID
    uploaded_files: list[str]
    created_records: int
    restored_records: int


class ProjectImageReplaceResponse(BaseModel):
    project_id: uuid.UUID
    image_id: uuid.UUID
    relative_path: str
    filename: str
    content_hash: str | None = None


class ProjectDatasetRenamePlanItem(BaseModel):
    image_id: uuid.UUID
    current_relative_path: str
    proposed_relative_path: str
    sidecar_content: str


class ProjectDatasetRenamePreviewResponse(BaseModel):
    project_id: uuid.UUID
    total_images: int
    rename_count: int
    sidecar_update_count: int
    items: list[ProjectDatasetRenamePlanItem] = Field(default_factory=list)


class ProjectDatasetRenameApplyResponse(BaseModel):
    project_id: uuid.UUID
    total_images: int
    renamed_images: int
    sidecars_updated: int


class ProjectSyncResponse(BaseModel):
    project_id: uuid.UUID
    added_images: int
    removed_images: int
    restored_images: int
    missing: bool
    synced_at: datetime


class ProjectOnboardingStatus(BaseModel):
    configured: bool
    projects_root_path: str | None = None
    model_storage_path: str | None = None
    default_projects_root_path: str
    default_model_storage_path: str


class ProjectOnboardingConfigure(BaseModel):
    projects_root_path: str
    model_storage_path: str | None = None


class ProjectOnboardingConfigureResponse(BaseModel):
    projects_root_path: str
    model_storage_path: str
