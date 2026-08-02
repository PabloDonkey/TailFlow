import hashlib
import logging
import shutil
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path

import aiofiles
from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.enums import TaggingMode
from app.core.tag_names import canonical_tag_name
from app.models.dataset_image import DatasetImage, DatasetImageTag
from app.models.project import Project
from app.models.tag import Tag
from app.schemas.project import (
    ProjectCreate,
    ProjectDatasetRenameApplyResponse,
    ProjectDatasetRenamePlanItem,
    ProjectDatasetRenamePreviewResponse,
    ProjectDiscoverResponse,
    ProjectImageUploadResponse,
    ProjectSyncResponse,
    ProjectUpdate,
)
from app.services.tagging import get_or_create_tag

ALLOWED_IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
logger = logging.getLogger(__name__)


@dataclass
class _DatasetRenamePlanRow:
    image: DatasetImage
    current_relative_path: str
    proposed_relative_path: str
    sidecar_content: str
    sidecar_needs_update: bool


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


async def _list_active_project_images(
    session: AsyncSession,
    project_id: uuid.UUID,
) -> list[DatasetImage]:
    result = await session.execute(
        select(DatasetImage)
        .where(
            DatasetImage.project_id == project_id,
            DatasetImage.removed_at.is_(None),
        )
        .order_by(DatasetImage.discovered_at.desc(), DatasetImage.id.asc())
    )
    return list(result.scalars().all())


def _resolve_project_featured_image_id(
    project: Project,
    active_images: list[DatasetImage],
) -> uuid.UUID | None:
    if not active_images:
        return None

    if project.featured_image_id is not None:
        for image in active_images:
            if image.id == project.featured_image_id:
                return project.featured_image_id

    return active_images[0].id


async def ensure_project_featured_image(
    session: AsyncSession,
    project: Project,
) -> uuid.UUID | None:
    await session.flush()
    active_images = await _list_active_project_images(session, project.id)
    project.featured_image_id = _resolve_project_featured_image_id(
        project,
        active_images,
    )
    return project.featured_image_id


def _normalize_unique_tag_names(names: list[str]) -> list[str]:
    """Canonicalize, drop empties, and de-duplicate while preserving order.

    Canonicalization is what makes `"simple background"` and `"Simple_Background"`
    the same tag (ADR-011). Because trigger/class names, add lists, and remove
    lists all pass through here, the protected-tag comparison in
    `update_project_image_tags` stays consistent.
    """
    normalized_names: list[str] = []
    seen_names: set[str] = set()
    for raw_name in names:
        name = canonical_tag_name(raw_name)
        if not name or name in seen_names:
            continue
        normalized_names.append(name)
        seen_names.add(name)
    return normalized_names


def _sidecar_path_for_image(dataset_path: Path, relative_path: str) -> Path:
    return (dataset_path / relative_path).with_suffix(".txt")


def _parse_sidecar_tag_names(sidecar_content: str) -> list[str]:
    return _normalize_unique_tag_names(sidecar_content.split(","))


def _validate_distinct_project_tags(trigger_tag: str, class_tag: str) -> None:
    if trigger_tag == class_tag:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project trigger_tag and class_tag must be different.",
        )


def _tag_is_available_in_mode(tag: Tag, tagging_mode: TaggingMode) -> bool:
    return not tag.catalog_ids or tagging_mode.value in tag.catalog_ids


async def _resolve_manual_project_tag(
    session: AsyncSession,
    project: Project,
    name: str,
    *,
    create_missing: bool,
) -> Tag:
    name = canonical_tag_name(name)
    result = await session.execute(select(Tag).where(Tag.name == name))
    tag = result.scalar_one_or_none()

    if tag is None:
        if not create_missing:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail=(
                    f"Tag '{name}' does not exist. Confirm creation before adding "
                    "it as a shared tag."
                ),
            )

        logger.info(
            "Creating shared user-defined tag '%s' for project %s in %s mode.",
            name,
            project.id,
            project.tagging_mode.value,
        )
        return await get_or_create_tag(session, name)

    if _tag_is_available_in_mode(tag, project.tagging_mode):
        return tag

    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        detail=(
            f"Tag '{name}' is not available in {project.tagging_mode.value} mode."
        ),
    )


async def _resolve_sync_project_tag(
    session: AsyncSession,
    project: Project,
    name: str,
) -> Tag | None:
    name = canonical_tag_name(name)
    result = await session.execute(select(Tag).where(Tag.name == name))
    tag = result.scalar_one_or_none()

    if tag is None:
        logger.info(
            (
                "Creating shared user-defined tag '%s' during sync for "
                "project %s in %s mode."
            ),
            name,
            project.id,
            project.tagging_mode.value,
        )
        return await get_or_create_tag(session, name)

    if _tag_is_available_in_mode(tag, project.tagging_mode):
        return tag

    logger.info(
        (
            "Skipping sidecar tag '%s' for project %s because it is not "
            "available in %s mode."
        ),
        name,
        project.id,
        project.tagging_mode.value,
    )
    return None


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
        await get_or_create_tag(session, tag_name)
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


async def import_project_image_sidecar_tags(
    session: AsyncSession,
    project: Project,
    image: DatasetImage,
    dataset_path: Path,
) -> None:
    sidecar_path = _sidecar_path_for_image(dataset_path, image.relative_path)
    if not sidecar_path.is_file():
        return

    sidecar_names = _parse_sidecar_tag_names(sidecar_path.read_text(encoding="utf-8"))
    if not sidecar_names:
        return

    await ensure_project_image_tag_assignments(session, project, image)
    existing_links = await _load_image_tag_links(session, project.id, image.id)
    existing_tag_ids = {link.tag_id for link in existing_links}
    next_position = len(existing_links)

    for name in sidecar_names:
        tag = await _resolve_sync_project_tag(session, project, name)
        if tag is None or tag.id in existing_tag_ids:
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

async def create_project(
    session: AsyncSession,
    payload: ProjectCreate,
) -> Project:
    root_path = settings.projects_root_path_resolved
    folder_name = payload.folder_name.strip()
    trigger_tag = (
        canonical_tag_name(payload.trigger_tag)
        if payload.trigger_tag
        else canonical_tag_name(folder_name)
    )
    if not trigger_tag:
        trigger_tag = canonical_tag_name(folder_name)
    class_tag = canonical_tag_name(payload.class_tag)

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
    _validate_distinct_project_tags(trigger_tag, class_tag)

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
            trigger_tag=trigger_tag,
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


async def delete_project(
    session: AsyncSession,
    project: Project,
) -> None:
    project_dir = Path(project.dataset_path).parent
    if project_dir.exists():
        try:
            shutil.rmtree(project_dir)
        except OSError as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete project folder: {exc}",
            ) from exc

    project.featured_image_id = None
    await session.delete(project)
    await session.commit()


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
        content_hash = hashlib.sha256(contents).hexdigest()
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
                content_hash=content_hash,
                file_mtime_ns=stat.st_mtime_ns,
                file_size_bytes=stat.st_size,
                removed_at=None,
            )
            session.add(record)
            created_records += 1
        else:
            record.filename = destination.name
            record.content_hash = content_hash
            record.file_mtime_ns = stat.st_mtime_ns
            record.file_size_bytes = stat.st_size
            if record.removed_at is not None:
                record.removed_at = None
                restored_records += 1

        await ensure_project_image_tag_assignments(session, project, record)
        uploaded_files.append(relative_path)

    await ensure_project_featured_image(session, project)

    await session.commit()

    return ProjectImageUploadResponse(
        project_id=project.id,
        uploaded_files=uploaded_files,
        created_records=created_records,
        restored_records=restored_records,
    )


async def replace_project_image_file(
    session: AsyncSession,
    project: Project,
    image: DatasetImage,
    file: UploadFile,
) -> None:
    dataset_path = Path(project.dataset_path)
    if not dataset_path.is_dir():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Project dataset folder is missing.",
        )

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type: {file.content_type}",
        )

    source_name = file.filename or image.filename
    source_suffix = Path(source_name).suffix.lower()
    if source_suffix not in ALLOWED_IMAGE_SUFFIXES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file extension: {source_suffix or '(none)'}",
        )

    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    contents = await file.read()
    if len(contents) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=(
                f"File exceeds maximum size of {settings.max_upload_size_mb} MB."
            ),
        )

    destination = dataset_path / image.relative_path
    destination.parent.mkdir(parents=True, exist_ok=True)

    async with aiofiles.open(destination, "wb") as output:
        await output.write(contents)

    stat = destination.stat()
    image.content_hash = hashlib.sha256(contents).hexdigest()
    image.file_mtime_ns = stat.st_mtime_ns
    image.file_size_bytes = stat.st_size
    image.removed_at = None

    await session.commit()


async def delete_project_image(
    session: AsyncSession,
    project: Project,
    image: DatasetImage,
) -> None:
    if image.removed_at is None:
        file_path = Path(project.dataset_path) / image.relative_path
        if file_path.exists():
            file_path.unlink()

        image.removed_at = datetime.now(UTC)

    await ensure_project_featured_image(session, project)
    await session.commit()


async def set_project_featured_image(
    session: AsyncSession,
    project: Project,
    image: DatasetImage,
) -> Project:
    if image.project_id != project.id or image.removed_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project image not found.",
        )

    project.featured_image_id = image.id
    await session.commit()
    await session.refresh(project)
    return project


async def update_project_metadata(
    session: AsyncSession,
    project: Project,
    payload: ProjectUpdate,
) -> Project:
    new_trigger_tag = (
        canonical_tag_name(payload.trigger_tag)
        if payload.trigger_tag is not None
        else project.trigger_tag
    )
    new_class_tag = (
        canonical_tag_name(payload.class_tag)
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

    _validate_distinct_project_tags(new_trigger_tag, new_class_tag)

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
    *,
    create_missing: bool = False,
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
            detail=(
                "Protected trigger and class tags cannot be removed from an image: "
                + ", ".join(blocked_names)
            ),
        )

    await ensure_project_image_tag_assignments(session, project, image)
    existing_links = await _load_image_tag_links(session, project.id, image.id)
    existing_tag_ids = {link.tag_id for link in existing_links}
    next_position = len(existing_links)

    for name in add_names:
        tag = await _resolve_manual_project_tag(
            session,
            project,
            name,
            create_missing=create_missing,
        )
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
                trigger_tag=canonical_tag_name(folder_name),
                class_tag=canonical_tag_name(folder_name),
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
        project.featured_image_id = None
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
        await import_project_image_sidecar_tags(session, project, tracked, dataset_path)

    removed_images = 0
    for relative_path, tracked in tracked_images.items():
        if relative_path in files_on_disk:
            continue
        if tracked.removed_at is None:
            tracked.removed_at = now
            removed_images += 1

    await ensure_project_featured_image(session, project)
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


def _normalize_sidecar_content(value: str) -> str:
    return value.strip()


def _build_sidecar_content(tag_names: list[str]) -> str:
    return ", ".join(tag_names)


def _temporary_rename_path(dataset_path: Path, suffix: str) -> Path:
    return dataset_path / f".tailflow-renaming-{uuid.uuid4().hex}{suffix}"


def _temporary_db_relative_path(proposed_relative_path: str) -> str:
    suffix = Path(proposed_relative_path).suffix.lower()
    return f".tailflow-renaming-db-{uuid.uuid4().hex}{suffix}"


def _preserved_numeric_index(relative_path: str) -> int | None:
    path = Path(relative_path)
    if path.parent != Path("."):
        return None

    stem = path.stem
    if not stem.isdigit():
        return None
    if stem.startswith("0") and stem != "0":
        return None

    index = int(stem)
    if index < 1:
        return None
    return index


async def _build_dataset_rename_plan(
    session: AsyncSession,
    project: Project,
) -> list[_DatasetRenamePlanRow]:
    dataset_path = Path(project.dataset_path)
    result = await session.execute(
        select(DatasetImage)
        .where(
            DatasetImage.project_id == project.id,
            DatasetImage.removed_at.is_(None),
        )
        .order_by(DatasetImage.discovered_at.asc(), DatasetImage.id.asc())
    )
    images = list(result.scalars().all())

    reserved_indexes: set[int] = set()
    assigned_indexes: dict[uuid.UUID, int] = {}
    unassigned_images: list[DatasetImage] = []

    for image in images:
        preserved_index = _preserved_numeric_index(image.relative_path)
        if preserved_index is not None and preserved_index not in reserved_indexes:
            reserved_indexes.add(preserved_index)
            assigned_indexes[image.id] = preserved_index
            continue
        unassigned_images.append(image)

    next_index = 1
    for image in unassigned_images:
        while next_index in reserved_indexes:
            next_index += 1
        assigned_indexes[image.id] = next_index
        reserved_indexes.add(next_index)
        next_index += 1

    plan_rows: list[_DatasetRenamePlanRow] = []
    for image in images:
        index = assigned_indexes[image.id]
        extension = Path(image.filename).suffix.lower()
        proposed_relative_path = f"{index}{extension}"

        links = await _load_image_tag_links(session, project.id, image.id)
        tag_names = [link.tag.name for link in links]
        sidecar_content = _build_sidecar_content(tag_names)

        sidecar_path = _sidecar_path_for_image(dataset_path, proposed_relative_path)
        existing_sidecar = ""
        if sidecar_path.is_file():
            existing_sidecar = sidecar_path.read_text(encoding="utf-8")

        sidecar_needs_update = (
            _normalize_sidecar_content(existing_sidecar)
            != _normalize_sidecar_content(sidecar_content)
        )

        plan_rows.append(
            _DatasetRenamePlanRow(
                image=image,
                current_relative_path=image.relative_path,
                proposed_relative_path=proposed_relative_path,
                sidecar_content=sidecar_content,
                sidecar_needs_update=sidecar_needs_update,
            )
        )

    return plan_rows


async def preview_project_dataset_rename(
    session: AsyncSession,
    project: Project,
) -> ProjectDatasetRenamePreviewResponse:
    dataset_path = Path(project.dataset_path)
    if not dataset_path.is_dir():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Project dataset folder is missing.",
        )

    # Reconcile tracked dataset images with filesystem before planning.
    # This avoids preview/apply mismatches when files were removed externally.
    await sync_project(session, project)

    plan_rows = await _build_dataset_rename_plan(session, project)
    rename_count = sum(
        1
        for row in plan_rows
        if row.current_relative_path != row.proposed_relative_path
    )
    sidecar_update_count = sum(
        1
        for row in plan_rows
        if (
            row.sidecar_needs_update
            or row.current_relative_path != row.proposed_relative_path
        )
    )

    return ProjectDatasetRenamePreviewResponse(
        project_id=project.id,
        total_images=len(plan_rows),
        rename_count=rename_count,
        sidecar_update_count=sidecar_update_count,
        items=[
            ProjectDatasetRenamePlanItem(
                image_id=row.image.id,
                current_relative_path=row.current_relative_path,
                proposed_relative_path=row.proposed_relative_path,
                sidecar_content=row.sidecar_content,
            )
            for row in plan_rows
        ],
    )


async def apply_project_dataset_rename(
    session: AsyncSession,
    project: Project,
) -> ProjectDatasetRenameApplyResponse:
    dataset_path = Path(project.dataset_path)
    if not dataset_path.is_dir():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Project dataset folder is missing.",
        )

    # Reconcile tracked dataset images with filesystem before planning.
    # This avoids apply failures when stale tracked rows reference missing files.
    await sync_project(session, project)

    plan_rows = await _build_dataset_rename_plan(session, project)
    temp_paths: dict[uuid.UUID, Path] = {}
    rows_needing_rename = [
        row
        for row in plan_rows
        if row.current_relative_path != row.proposed_relative_path
    ]

    for row in plan_rows:
        current_path = dataset_path / row.current_relative_path
        if not current_path.is_file():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Cannot rename dataset images because at least one tracked "
                    f"file is missing: {row.current_relative_path}"
                ),
            )

    renamed_images = 0
    sidecars_updated = 0

    for row in plan_rows:
        current_path = dataset_path / row.current_relative_path
        temporary_path = _temporary_rename_path(
            dataset_path, current_path.suffix.lower()
        )
        shutil.move(str(current_path), str(temporary_path))
        temp_paths[row.image.id] = temporary_path

    for row in plan_rows:
        temporary_path = temp_paths[row.image.id]
        target_path = dataset_path / row.proposed_relative_path
        target_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(temporary_path), str(target_path))

        old_sidecar_path = _sidecar_path_for_image(
            dataset_path, row.current_relative_path
        )
        if (
            old_sidecar_path.exists()
            and old_sidecar_path != target_path.with_suffix(".txt")
        ):
            old_sidecar_path.unlink()

        sidecar_path = target_path.with_suffix(".txt")
        normalized_current = ""
        if sidecar_path.is_file():
            normalized_current = _normalize_sidecar_content(
                sidecar_path.read_text(encoding="utf-8")
            )
        normalized_next = _normalize_sidecar_content(row.sidecar_content)
        if normalized_current != normalized_next:
            sidecar_path.write_text(row.sidecar_content, encoding="utf-8")
            sidecars_updated += 1

        stat = target_path.stat()
        row.image.file_mtime_ns = stat.st_mtime_ns
        row.image.file_size_bytes = stat.st_size
        row.image.removed_at = None

    # Avoid transient unique-key collisions when many relative_path values
    # are updated in one flush. Move renamed rows to temporary DB-only paths
    # first, flush, then apply final relative paths.
    for row in rows_needing_rename:
        temporary_relative_path = _temporary_db_relative_path(
            row.proposed_relative_path
        )
        row.image.relative_path = temporary_relative_path
        row.image.filename = Path(temporary_relative_path).name

    if rows_needing_rename:
        await session.flush()

    for row in plan_rows:
        target_path = dataset_path / row.proposed_relative_path
        row.image.relative_path = row.proposed_relative_path
        row.image.filename = target_path.name
        if row.current_relative_path != row.proposed_relative_path:
            renamed_images += 1

    project.last_synced_at = datetime.now(UTC)
    await session.commit()

    return ProjectDatasetRenameApplyResponse(
        project_id=project.id,
        total_images=len(plan_rows),
        renamed_images=renamed_images,
        sidecars_updated=sidecars_updated,
    )
