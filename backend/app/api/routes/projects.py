import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import db_session
from app.models.project import Project
from app.schemas.project import (
    ProjectCreate,
    ProjectCreateResponse,
    ProjectDiscoverResponse,
    ProjectImageUploadResponse,
    ProjectRead,
    ProjectSyncResponse,
)
from app.services.projects import (
    create_project,
    discover_projects,
    sync_project,
    upload_images_to_project,
)

router = APIRouter(prefix="/projects", tags=["projects"])


@router.post("", response_model=ProjectCreateResponse, status_code=status.HTTP_201_CREATED)
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
