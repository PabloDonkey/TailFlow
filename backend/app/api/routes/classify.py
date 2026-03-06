"""Classify API route."""

import tempfile
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile, status
from pydantic import BaseModel

from app.services.classifier import classify_image

router = APIRouter(prefix="/classify", tags=["classify"])

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}


class ClassifyResponse(BaseModel):
    suggested_tags: list[str]


@router.post("", response_model=ClassifyResponse)
async def classify(
    file: UploadFile,
) -> ClassifyResponse:
    """Run the classifier on an uploaded image and return suggested tags."""
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type: {file.content_type}",
        )

    contents = await file.read()
    suffix = Path(file.filename or "image.jpg").suffix.lower() or ".jpg"

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(contents)
        tmp_path = Path(tmp.name)

    try:
        suggested_tags = await classify_image(tmp_path)
    finally:
        tmp_path.unlink(missing_ok=True)

    return ClassifyResponse(suggested_tags=suggested_tags)
