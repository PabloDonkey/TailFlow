import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import db_session
from app.models.project import Project
from app.schemas.project import (
    ProjectDiscoverResponse,
    ProjectRead,
    ProjectSyncResponse,
)
from app.services.projects import discover_projects, sync_project

router = APIRouter(prefix="/projects", tags=["projects"])


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
