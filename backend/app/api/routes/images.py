"""Image API routes."""

import uuid
from pathlib import Path

import aiofiles
from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from PIL import Image as PILImage
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import db_session
from app.core.config import settings
from app.models.image import Image
from app.schemas.image import (
    ImageRead,
    ImageSummary,
    ImageTagUpdate,
    ImageUploadResponse,
)
from app.services.classifier import classify_image
from app.services.tagging import add_tags_to_image, remove_tags_from_image

router = APIRouter(prefix="/images", tags=["images"])

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}


@router.post(
    "", response_model=ImageUploadResponse, status_code=status.HTTP_201_CREATED
)
async def upload_image(
    file: UploadFile,
    session: AsyncSession = Depends(db_session),
) -> ImageUploadResponse:
    """Upload an image, save to disk, and run the classifier."""
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type: {file.content_type}",
        )

    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    storage_dir = Path(settings.storage_path)
    storage_dir.mkdir(parents=True, exist_ok=True)

    image_id = uuid.uuid4()
    suffix = Path(file.filename or "image.jpg").suffix.lower() or ".jpg"
    filename = f"{image_id}{suffix}"
    dest = storage_dir / filename

    contents = await file.read()
    if len(contents) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum size of {settings.max_upload_size_mb} MB.",
        )

    async with aiofiles.open(dest, "wb") as f:
        await f.write(contents)

    try:
        with PILImage.open(dest) as img:
            width, height = img.size
    except Exception:
        dest.unlink(missing_ok=True)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Could not read image dimensions.",
        ) from None

    image = Image(
        id=image_id,
        filename=filename,
        original_name=file.filename or filename,
        width=width,
        height=height,
    )
    session.add(image)
    await session.commit()
    await session.refresh(image)

    suggested_tags = await classify_image(dest)

    return ImageUploadResponse(id=image.id, suggested_tags=suggested_tags)


@router.get("", response_model=list[ImageSummary])
async def list_images(
    session: AsyncSession = Depends(db_session),
) -> list[ImageSummary]:
    """Return all images as summaries."""
    result = await session.execute(select(Image).order_by(Image.uploaded_at.desc()))
    images = result.scalars().all()
    return [
        ImageSummary(
            id=img.id,
            filename=img.filename,
            original_name=img.original_name,
            uploaded_at=img.uploaded_at,
            width=img.width,
            height=img.height,
            tag_count=len(img.tags),
        )
        for img in images
    ]


@router.get("/{image_id}", response_model=ImageRead)
async def get_image(
    image_id: uuid.UUID,
    session: AsyncSession = Depends(db_session),
) -> ImageRead:
    """Return full image metadata including tags."""
    image = await session.get(Image, image_id)
    if image is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Image not found."
        )
    return ImageRead.model_validate(image)


@router.get("/{image_id}/file")
async def get_image_file(
    image_id: uuid.UUID,
    session: AsyncSession = Depends(db_session),
) -> FileResponse:
    """Return the raw image file."""
    image = await session.get(Image, image_id)
    if image is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Image not found."
        )
    path = Path(settings.storage_path) / image.filename
    if not path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image file not found on disk.",
        )
    return FileResponse(path)


@router.post("/{image_id}/tags", response_model=ImageRead)
async def update_image_tags(
    image_id: uuid.UUID,
    body: ImageTagUpdate,
    session: AsyncSession = Depends(db_session),
) -> ImageRead:
    """Add or remove tags from an image."""
    image = await session.get(Image, image_id)
    if image is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Image not found."
        )

    if body.add:
        await add_tags_to_image(session, image, body.add)
    if body.remove:
        await remove_tags_from_image(session, image, body.remove)

    await session.commit()
    await session.refresh(image)
    return ImageRead.model_validate(image)
