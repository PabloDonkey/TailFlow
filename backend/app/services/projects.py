from datetime import UTC, datetime
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.dataset_image import DatasetImage
from app.models.project import Project
from app.schemas.project import ProjectDiscoverResponse, ProjectSyncResponse

ALLOWED_IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".gif", ".webp"}


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
