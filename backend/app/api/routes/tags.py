"""Tag API routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import db_session
from app.models.tag import Tag
from app.schemas.tag import TagCreate, TagRead

router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("", response_model=list[TagRead])
async def list_tags(
    session: AsyncSession = Depends(db_session),
) -> list[TagRead]:
    """Return all tags."""
    result = await session.execute(select(Tag).order_by(Tag.name))
    tags = result.scalars().all()
    return [TagRead.model_validate(t) for t in tags]


@router.post("", response_model=TagRead, status_code=status.HTTP_201_CREATED)
async def create_tag(
    body: TagCreate,
    session: AsyncSession = Depends(db_session),
) -> TagRead:
    """Create a new tag."""
    existing = await session.execute(select(Tag).where(Tag.name == body.name))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Tag '{body.name}' already exists.",
        )
    tag = Tag(
        name=body.name,
        catalog_ids=dict(body.catalog_ids),
        category=body.category,
    )
    session.add(tag)
    await session.commit()
    await session.refresh(tag)
    return TagRead.model_validate(tag)
