import shutil
import uuid
from datetime import UTC, datetime
from pathlib import Path

import aiofiles
from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.enums import TaggingMode
from app.models.dataset_image import DatasetImage, DatasetImageTag
from app.models.project import Project
from app.models.tag import Tag
from app.schemas.project import (
    ProjectCreate,
    ProjectDiscoverResponse,
    ProjectImageUploadResponse,
    ProjectSyncResponse,
    ProjectUpdate,
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


def _normalize_unique_tag_names(names: list[str]) -> list[str]:
    normalized_names: list[str] = []
    seen_names: set[str] = set()
    for raw_name in names:
        name = raw_name.strip()
        if not name or name in seen_names:
            continue
        normalized_names.append(name)
        seen_names.add(name)
    return normalized_names


async def get_or_create_shared_tag(session: AsyncSession, name: str) -> Tag:
    result = await session.execute(select(Tag).where(Tag.name == name))
    tag = result.scalar_one_or_none()
    if tag is None:
        tag = Tag(name=name, catalog_ids={})
        session.add(tag)
        await session.flush()
    return tag


async def _load_image_tag_links(
    session: AsyncSession, project_id: uuid.UUID, image_id: uuid.UUID
) -> list[DatasetImageTag]:
    result = await session.execute(
        select(DatasetImageTag)
        .options(selectinload(DatasetImageTag.tag))
        .where(
            DatasetImageTag.project_id == project_id,
            DatasetImageTag.image_id == image_id,
        )
        .order_by(DatasetImageTag.position.asc(), DatasetImageTag.created_at.asc())
    )
    return list(result.scalars().all())


async def ensure_project_image_tag_assignments(
    session: AsyncSession, project: Project, image: DatasetImage
) -> None:
    await session.flush()

    required_tag_names = _normalize_unique_tag_names(
        [project.trigger_tag, project.class_tag]
    )
    required_tags = [
        await get_or_create_shared_tag(session, tag_name)
        for tag_name in required_tag_names
    ]
    required_tag_ids = {tag.id for tag in required_tags}

    existing_links = await _load_image_tag_links(session, project.id, image.id)
    links_by_tag_id: dict[uuid.UUID, DatasetImageTag] = {}
    manual_links: list[DatasetImageTag] = []

    for link in existing_links:
        if link.tag_id in required_tag_ids:
            links_by_tag_id[link.tag_id] = link
            continue
        if link.is_protected:
            await session.delete(link)
            continue
        manual_links.append(link)

    await session.flush()

    temporary_position = 1000
    for link in [*links_by_tag_id.values(), *manual_links]:
        link.position = temporary_position
        temporary_position += 1

    if links_by_tag_id or manual_links:
        await session.flush()

    for position, tag in enumerate(required_tags):
        existing_link = links_by_tag_id.get(tag.id)
        if existing_link is None:
            session.add(
                DatasetImageTag(
                    project_id=project.id,
                    image_id=image.id,
                    tag_id=tag.id,
                    position=position,
                    is_protected=True,
                )
            )
            continue
        existing_link.position = position
        existing_link.is_protected = True

    for position, link in enumerate(manual_links, start=len(required_tags)):
        link.position = position
        link.is_protected = False


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

    created_project_dir = False
    try:
        dataset_dir.mkdir(parents=True, exist_ok=False)
        created_project_dir = True

        project = Project(
            name=(payload.name.strip() if payload.name else folder_name),
            folder_name=folder_name,
            root_path=str(root_path),
            dataset_path=str(dataset_dir),
            trigger_tag=(
                payload.trigger_tag.strip() if payload.trigger_tag else folder_name
            ),
            class_tag=class_tag,
            tagging_mode=payload.tagging_mode,
            missing_at=None,
        )
        session.add(project)
        await session.commit()
        await session.refresh(project)
        return project
    except Exception:
        await session.rollback()
        if created_project_dir and project_dir.exists():
            shutil.rmtree(project_dir, ignore_errors=True)
        raise


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
                detail=(
                    f"File exceeds maximum size of {settings.max_upload_size_mb} MB."
                ),
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

        await ensure_project_image_tag_assignments(session, project, record)
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
    new_trigger_tag = (
        payload.trigger_tag.strip()
        if payload.trigger_tag is not None
        else project.trigger_tag
    )
    new_class_tag = (
        payload.class_tag.strip()
        if payload.class_tag is not None
        else project.class_tag
    )

    if payload.trigger_tag is not None:
        if not new_trigger_tag:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="trigger_tag must not be empty.",
            )
        project.trigger_tag = new_trigger_tag

    if payload.class_tag is not None:
        if not new_class_tag:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="class_tag must not be empty.",
            )
        project.class_tag = new_class_tag

    if payload.tagging_mode is not None:
        project.tagging_mode = payload.tagging_mode

    images_result = await session.execute(
        select(DatasetImage).where(DatasetImage.project_id == project.id)
    )
    for image in images_result.scalars().all():
        await ensure_project_image_tag_assignments(session, project, image)

    await session.commit()
    await session.refresh(project)
    return project


async def update_project_image_tags(
    session: AsyncSession,
    project: Project,
    image: DatasetImage,
    add: list[str],
    remove: list[str],
) -> None:
    add_names = _normalize_unique_tag_names(add)
    remove_names = set(_normalize_unique_tag_names(remove))
    protected_names = set(
        _normalize_unique_tag_names([project.trigger_tag, project.class_tag])
    )
    blocked_names = sorted(remove_names & protected_names)
    if blocked_names:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Protected trigger and class tags cannot be removed from an image.",
        )

    await ensure_project_image_tag_assignments(session, project, image)
    existing_links = await _load_image_tag_links(session, project.id, image.id)
    existing_tag_ids = {link.tag_id for link in existing_links}
    next_position = len(existing_links)

    for name in add_names:
        tag = await get_or_create_shared_tag(session, name)
        if tag.id in existing_tag_ids:
            continue
        session.add(
            DatasetImageTag(
                project_id=project.id,
                image_id=image.id,
                tag_id=tag.id,
                position=next_position,
                is_protected=False,
            )
        )
        existing_tag_ids.add(tag.id)
        next_position += 1

    if remove_names:
        existing_links = await _load_image_tag_links(session, project.id, image.id)
        for link in existing_links:
            if link.tag.name in remove_names and not link.is_protected:
                await session.delete(link)

    await ensure_project_image_tag_assignments(session, project, image)
    await session.commit()


async def discover_projects(session: AsyncSession) -> ProjectDiscoverResponse:
    root_path = settings.projects_root_path_resolved

    discovered_dirs: dict[str, Path] = {}
    for child in root_path.iterdir():
        if not child.is_dir():
            continue

        dataset_path = child / "dataset"
        dataset_path.mkdir(parents=True, exist_ok=True)

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
                tagging_mode=TaggingMode.E621,
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
            tracked = DatasetImage(
                project_id=project.id,
                relative_path=relative_path,
                filename=filename,
                file_mtime_ns=mtime_ns,
                file_size_bytes=size_bytes,
                removed_at=None,
            )
            session.add(tracked)
            added_images += 1
        else:
            tracked.filename = filename
            tracked.file_mtime_ns = mtime_ns
            tracked.file_size_bytes = size_bytes
            if tracked.removed_at is not None:
                tracked.removed_at = None
                restored_images += 1

        await ensure_project_image_tag_assignments(session, project, tracked)

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
