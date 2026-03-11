import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import db_session
from app.core.config import (
    configure_projects_root_path,
    default_projects_root_path,
    get_backend_env_example_file_path,
    get_backend_env_file_path,
    is_projects_root_configured,
    settings,
)
from app.models.dataset_image import DatasetImage, DatasetImageTag
from app.models.project import Project
from app.schemas.project import (
    ProjectCreate,
    ProjectCreateResponse,
    ProjectDiscoverResponse,
    ProjectImageRead,
    ProjectImageSummary,
    ProjectImageTagUpdate,
    ProjectImageUploadResponse,
    ProjectOnboardingConfigure,
    ProjectOnboardingConfigureResponse,
    ProjectOnboardingStatus,
    ProjectRead,
    ProjectSyncResponse,
    ProjectTagRead,
    ProjectUpdate,
)
from app.services.projects import (
    create_project,
    discover_projects,
    sync_project,
    update_project_image_tags,
    update_project_metadata,
    upload_images_to_project,
)

router = APIRouter(prefix="/projects", tags=["projects"])


async def _read_project_image_tags(
    session: AsyncSession, project: Project, image: DatasetImage
) -> list[ProjectTagRead]:
    tag_link_result = await session.execute(
        select(DatasetImageTag)
        .options(selectinload(DatasetImageTag.tag))
        .where(
            DatasetImageTag.project_id == project.id,
            DatasetImageTag.image_id == image.id,
        )
        .order_by(DatasetImageTag.position.asc(), DatasetImageTag.created_at.asc())
    )
    links = tag_link_result.scalars().all()
    return [
        ProjectTagRead(
            id=link.tag.id,
            name=link.tag.name,
            catalog_ids=dict(link.tag.catalog_ids),
            category=link.tag.category,
            position=link.position,
            is_protected=link.is_protected,
        )
        for link in links
    ]


@router.get("/onboarding/status", response_model=ProjectOnboardingStatus)
async def onboarding_status_route() -> ProjectOnboardingStatus:
    configured = is_projects_root_configured()
    current_path = (
        str(settings.projects_root_path)
        if settings.projects_root_path
        else None
    )
    return ProjectOnboardingStatus(
        configured=configured,
        projects_root_path=current_path,
        default_projects_root_path=str(default_projects_root_path()),
    )


@router.post(
    "/onboarding/configure",
    response_model=ProjectOnboardingConfigureResponse,
)
async def onboarding_configure_route(
    body: ProjectOnboardingConfigure,
) -> ProjectOnboardingConfigureResponse:
    if body.projects_root_path.strip() == "":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="projects_root_path is required.",
        )

    env_path = get_backend_env_file_path()
    if not env_path.exists():
        example_path = get_backend_env_example_file_path()
        if example_path.exists():
            env_path.write_text(
                example_path.read_text(encoding="utf-8"),
                encoding="utf-8",
            )
        else:
            env_path.write_text("", encoding="utf-8")

    try:
        configured_path = configure_projects_root_path(body.projects_root_path)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    return ProjectOnboardingConfigureResponse(projects_root_path=str(configured_path))


@router.post(
    "",
    response_model=ProjectCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_project_route(
    body: ProjectCreate,
    session: AsyncSession = Depends(db_session),
) -> ProjectCreateResponse:
    """Create a new project folder and its fixed dataset subfolder."""
    project = await create_project(session, body)
    return ProjectCreateResponse(project=ProjectRead.model_validate(project))


@router.post("/discover", response_model=ProjectDiscoverResponse)
async def discover_projects_route(
    session: AsyncSession = Depends(db_session),
) -> ProjectDiscoverResponse:
    """Discover projects from configured root and update missing-state metadata."""
    return await discover_projects(session)


@router.get("", response_model=list[ProjectRead])
async def list_projects(
    session: AsyncSession = Depends(db_session),
) -> list[ProjectRead]:
    """List all tracked projects."""
    result = await session.execute(select(Project).order_by(Project.name))
    projects = result.scalars().all()
    return [ProjectRead.model_validate(project) for project in projects]


@router.patch("/{project_id}", response_model=ProjectRead)
async def update_project_route(
    project_id: uuid.UUID,
    body: ProjectUpdate,
    session: AsyncSession = Depends(db_session),
) -> ProjectRead:
    project = await session.get(Project, project_id)
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found.",
        )

    updated_project = await update_project_metadata(session, project, body)
    return ProjectRead.model_validate(updated_project)


@router.post("/{project_id}/sync", response_model=ProjectSyncResponse)
async def sync_project_route(
    project_id: uuid.UUID,
    session: AsyncSession = Depends(db_session),
) -> ProjectSyncResponse:
    """Sync one project's dataset image records with filesystem state."""
    project = await session.get(Project, project_id)
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found.",
        )

    return await sync_project(session, project)


@router.post("/{project_id}/images", response_model=ProjectImageUploadResponse)
async def upload_project_images_route(
    project_id: uuid.UUID,
    files: list[UploadFile] = File(...),
    session: AsyncSession = Depends(db_session),
) -> ProjectImageUploadResponse:
    """Upload images into a selected project's dataset folder."""
    project = await session.get(Project, project_id)
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found.",
        )

    return await upload_images_to_project(session, project, files)


@router.get("/{project_id}/images", response_model=list[ProjectImageSummary])
async def list_project_images_route(
    project_id: uuid.UUID,
    session: AsyncSession = Depends(db_session),
) -> list[ProjectImageSummary]:
    project = await session.get(Project, project_id)
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found.",
        )

    result = await session.execute(
        select(DatasetImage)
        .where(DatasetImage.project_id == project.id, DatasetImage.removed_at.is_(None))
        .order_by(DatasetImage.discovered_at.desc())
    )
    images = result.scalars().all()
    return [ProjectImageSummary.model_validate(image) for image in images]


@router.get("/{project_id}/images/{image_id}", response_model=ProjectImageRead)
async def get_project_image_route(
    project_id: uuid.UUID,
    image_id: uuid.UUID,
    session: AsyncSession = Depends(db_session),
) -> ProjectImageRead:
    project = await session.get(Project, project_id)
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found.",
        )

    image = await session.get(DatasetImage, image_id)
    if image is None or image.project_id != project.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project image not found.",
        )

    tags = await _read_project_image_tags(session, project, image)

    return ProjectImageRead(
        id=image.id,
        project_id=image.project_id,
        relative_path=image.relative_path,
        filename=image.filename,
        discovered_at=image.discovered_at,
        removed_at=image.removed_at,
        tags=tags,
    )


@router.get("/{project_id}/images/{image_id}/file")
async def get_project_image_file_route(
    project_id: uuid.UUID,
    image_id: uuid.UUID,
    session: AsyncSession = Depends(db_session),
) -> FileResponse:
    project = await session.get(Project, project_id)
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found.",
        )

    image = await session.get(DatasetImage, image_id)
    if image is None or image.project_id != project.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project image not found.",
        )

    path = Path(project.dataset_path) / image.relative_path
    if not path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project image file not found on disk.",
        )
    return FileResponse(path)


@router.post("/{project_id}/images/{image_id}/tags", response_model=ProjectImageRead)
async def update_project_image_tags_route(
    project_id: uuid.UUID,
    image_id: uuid.UUID,
    body: ProjectImageTagUpdate,
    session: AsyncSession = Depends(db_session),
) -> ProjectImageRead:
    project = await session.get(Project, project_id)
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found.",
        )

    image = await session.get(DatasetImage, image_id)
    if image is None or image.project_id != project.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project image not found.",
        )

    await update_project_image_tags(session, project, image, body.add, body.remove)

    tags = await _read_project_image_tags(session, project, image)

    return ProjectImageRead(
        id=image.id,
        project_id=image.project_id,
        relative_path=image.relative_path,
        filename=image.filename,
        discovered_at=image.discovered_at,
        removed_at=image.removed_at,
        tags=tags,
    )
