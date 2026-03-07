from datetime import UTC, datetime
from pathlib import Path
import uuid

import aiofiles
from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.dataset_image import DatasetImage, DatasetImageTag, ProjectTag
from app.models.project import Project
from app.schemas.project import (
    ProjectCreate,
    ProjectDiscoverResponse,
    ProjectImageUploadResponse,
    ProjectUpdate,
    ProjectSyncResponse,
)

ALLOWED_IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}


def _resolve_available_path(path: Path) -> Path:
    if not path.exists():
        return path

    stem = path.stem
    suffix = path.suffix
    index = 1
    while True:
        candidate = path.with_name(f"{stem}-{index}{suffix}")
        if not candidate.exists():
            return candidate
        index += 1


def _iter_dataset_images(dataset_path: Path) -> dict[str, tuple[int, int]]:
    files: dict[str, tuple[int, int]] = {}
    for path in dataset_path.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix.lower() not in ALLOWED_IMAGE_SUFFIXES:
            continue

        relative = path.relative_to(dataset_path).as_posix()
        stat = path.stat()
        files[relative] = (stat.st_mtime_ns, stat.st_size)
    return files


async def create_project(
    session: AsyncSession,
    payload: ProjectCreate,
) -> Project:
    root_path = settings.projects_root_path_resolved
    folder_name = payload.folder_name.strip()
    class_tag = payload.class_tag.strip()

    if not folder_name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="folder_name must not be empty.",
        )
    if not class_tag:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="class_tag must not be empty.",
        )

    existing = await session.execute(
        select(Project).where(Project.folder_name == folder_name)
    )
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Project '{folder_name}' already exists.",
        )

    project_dir = root_path / folder_name
    dataset_dir = project_dir / "dataset"
    if project_dir.exists():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Project folder already exists on disk: {project_dir}",
        )

    dataset_dir.mkdir(parents=True, exist_ok=False)

    project = Project(
        name=(payload.name.strip() if payload.name else folder_name),
        folder_name=folder_name,
        root_path=str(root_path),
        dataset_path=str(dataset_dir),
        trigger_tag=(
            payload.trigger_tag.strip() if payload.trigger_tag else folder_name
        ),
        class_tag=class_tag,
        missing_at=None,
    )
    session.add(project)
    await session.commit()
    await session.refresh(project)
    return project


async def upload_images_to_project(
    session: AsyncSession,
    project: Project,
    files: list[UploadFile],
) -> ProjectImageUploadResponse:
    dataset_path = Path(project.dataset_path)
    if not dataset_path.is_dir():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Project dataset folder is missing.",
        )

    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    uploaded_files: list[str] = []
    created_records = 0
    restored_records = 0

    for file in files:
        if file.content_type not in ALLOWED_CONTENT_TYPES:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"Unsupported file type: {file.content_type}",
            )

        original_name = file.filename or "image.jpg"
        original_path = Path(original_name)
        suffix = original_path.suffix.lower()
        if suffix not in ALLOWED_IMAGE_SUFFIXES:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"Unsupported file extension: {suffix or '(none)'}",
            )

        destination = _resolve_available_path(dataset_path / original_path.name)
        contents = await file.read()
        if len(contents) > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds maximum size of {settings.max_upload_size_mb} MB.",
            )

        async with aiofiles.open(destination, "wb") as output:
            await output.write(contents)

        stat = destination.stat()
        relative_path = destination.relative_to(dataset_path).as_posix()
        record_result = await session.execute(
            select(DatasetImage).where(
                DatasetImage.project_id == project.id,
                DatasetImage.relative_path == relative_path,
            )
        )
        record = record_result.scalar_one_or_none()
        if record is None:
            record = DatasetImage(
                project_id=project.id,
                relative_path=relative_path,
                filename=destination.name,
                file_mtime_ns=stat.st_mtime_ns,
                file_size_bytes=stat.st_size,
                removed_at=None,
            )
            session.add(record)
            created_records += 1
        else:
            record.filename = destination.name
            record.file_mtime_ns = stat.st_mtime_ns
            record.file_size_bytes = stat.st_size
            if record.removed_at is not None:
                record.removed_at = None
                restored_records += 1

        uploaded_files.append(relative_path)

    await session.commit()

    return ProjectImageUploadResponse(
        project_id=project.id,
        uploaded_files=uploaded_files,
        created_records=created_records,
        restored_records=restored_records,
    )


async def update_project_metadata(
    session: AsyncSession,
    project: Project,
    payload: ProjectUpdate,
) -> Project:
    if payload.trigger_tag is not None:
        trigger_tag = payload.trigger_tag.strip()
        if not trigger_tag:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="trigger_tag must not be empty.",
            )
        project.trigger_tag = trigger_tag

    if payload.class_tag is not None:
        class_tag = payload.class_tag.strip()
        if not class_tag:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="class_tag must not be empty.",
            )
        project.class_tag = class_tag

    await session.commit()
    await session.refresh(project)
    return project


async def get_or_create_project_tag(
    session: AsyncSession,
    project_id: uuid.UUID,
    name: str,
) -> ProjectTag:
    result = await session.execute(
        select(ProjectTag).where(
            ProjectTag.project_id == project_id,
            ProjectTag.name == name,
        )
    )
    tag = result.scalar_one_or_none()
    if tag is None:
        tag = ProjectTag(project_id=project_id, name=name)
        session.add(tag)
        await session.flush()
    return tag


async def update_project_image_tags(
    session: AsyncSession,
    project: Project,
    image: DatasetImage,
    add: list[str],
    remove: list[str],
) -> None:
    existing_links_result = await session.execute(
        select(DatasetImageTag).where(
            DatasetImageTag.project_id == project.id,
            DatasetImageTag.image_id == image.id,
        )
    )
    existing_links = existing_links_result.scalars().all()

    tag_ids_by_name: dict[str, str] = {}
    if existing_links:
        existing_tag_ids = [link.tag_id for link in existing_links]
        existing_tags_result = await session.execute(
            select(ProjectTag).where(ProjectTag.id.in_(existing_tag_ids))
        )
        for tag in existing_tags_result.scalars().all():
            tag_ids_by_name[tag.name] = str(tag.id)

    add_set = {name.strip() for name in add if name.strip()}
    remove_set = {name.strip() for name in remove if name.strip()}

    for name in add_set:
        tag = await get_or_create_project_tag(session, project.id, name)
        link_exists = any(
            link.tag_id == tag.id and link.image_id == image.id for link in existing_links
        )
        if not link_exists:
            session.add(
                DatasetImageTag(project_id=project.id, image_id=image.id, tag_id=tag.id)
            )

    if remove_set:
        remove_tags_result = await session.execute(
            select(ProjectTag).where(
                ProjectTag.project_id == project.id,
                ProjectTag.name.in_(remove_set),
            )
        )
        remove_tag_ids = {tag.id for tag in remove_tags_result.scalars().all()}
        for link in existing_links:
            if link.tag_id in remove_tag_ids:
                await session.delete(link)

    await session.commit()


async def discover_projects(session: AsyncSession) -> ProjectDiscoverResponse:
    root_path = settings.projects_root_path_resolved

    discovered_dirs: dict[str, Path] = {}
    for child in root_path.iterdir():
        if not child.is_dir():
            continue
        dataset_path = child / "dataset"
        if not dataset_path.is_dir():
            continue
        discovered_dirs[child.name] = dataset_path

    existing_projects_result = await session.execute(select(Project))
    existing_projects = {
        project.folder_name: project
        for project in existing_projects_result.scalars().all()
    }

    imported_projects = 0
    for folder_name, dataset_path in discovered_dirs.items():
        project = existing_projects.get(folder_name)
        if project is None:
            project = Project(
                name=folder_name,
                folder_name=folder_name,
                root_path=str(root_path),
                dataset_path=str(dataset_path),
                trigger_tag=folder_name,
                class_tag=folder_name,
                missing_at=None,
            )
            session.add(project)
            imported_projects += 1
            continue

        project.root_path = str(root_path)
        project.dataset_path = str(dataset_path)
        project.missing_at = None

    marked_missing_projects = 0
    now = datetime.now(UTC)
    for folder_name, project in existing_projects.items():
        if folder_name in discovered_dirs:
            continue
        if project.missing_at is None:
            project.missing_at = now
            marked_missing_projects += 1

    await session.commit()

    return ProjectDiscoverResponse(
        discovered_projects=len(discovered_dirs),
        imported_projects=imported_projects,
        marked_missing_projects=marked_missing_projects,
    )


async def sync_project(session: AsyncSession, project: Project) -> ProjectSyncResponse:
    now = datetime.now(UTC)
    dataset_path = Path(project.dataset_path)

    if not dataset_path.is_dir():
        if project.missing_at is None:
            project.missing_at = now
        project.last_synced_at = now
        await session.commit()
        return ProjectSyncResponse(
            project_id=project.id,
            added_images=0,
            removed_images=0,
            restored_images=0,
            missing=True,
            synced_at=now,
        )

    project.missing_at = None

    files_on_disk = _iter_dataset_images(dataset_path)
    result = await session.execute(
        select(DatasetImage).where(DatasetImage.project_id == project.id)
    )
    tracked_images = {image.relative_path: image for image in result.scalars().all()}

    added_images = 0
    restored_images = 0
    for relative_path, (mtime_ns, size_bytes) in files_on_disk.items():
        tracked = tracked_images.get(relative_path)
        filename = Path(relative_path).name

        if tracked is None:
            session.add(
                DatasetImage(
                    project_id=project.id,
                    relative_path=relative_path,
                    filename=filename,
                    file_mtime_ns=mtime_ns,
                    file_size_bytes=size_bytes,
                    removed_at=None,
                )
            )
            added_images += 1
            continue

        tracked.filename = filename
        tracked.file_mtime_ns = mtime_ns
        tracked.file_size_bytes = size_bytes
        if tracked.removed_at is not None:
            tracked.removed_at = None
            restored_images += 1

    removed_images = 0
    for relative_path, tracked in tracked_images.items():
        if relative_path in files_on_disk:
            continue
        if tracked.removed_at is None:
            tracked.removed_at = now
            removed_images += 1

    project.last_synced_at = now
    await session.commit()

    return ProjectSyncResponse(
        project_id=project.id,
        added_images=added_images,
        removed_images=removed_images,
        restored_images=restored_images,
        missing=False,
        synced_at=now,
    )
