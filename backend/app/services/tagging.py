"""Tagging service.

Handles business logic for adding and removing tags from images.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.image import Image
from app.models.tag import Tag


async def get_or_create_tag(session: AsyncSession, name: str) -> Tag:
    """Return an existing Tag by name, or create a new one."""
    normalized_name = name.strip()
    result = await session.execute(select(Tag).where(Tag.name == normalized_name))
    tag = result.scalar_one_or_none()
    if tag is None:
        tag = Tag(name=normalized_name)
        session.add(tag)
        await session.flush()
    return tag


async def add_tags_to_image(
    session: AsyncSession, image: Image, tag_names: list[str]
) -> None:
    """Add tags to an image, creating tags that don't exist yet."""
    existing_names = {t.name for t in image.tags}
    for name in tag_names:
        if name not in existing_names:
            tag = await get_or_create_tag(session, name)
            image.tags.append(tag)


async def remove_tags_from_image(
    session: AsyncSession, image: Image, tag_names: list[str]
) -> None:
    """Remove tags from an image by name."""
    _ = session
    remove_set = set(tag_names)
    image.tags = [t for t in image.tags if t.name not in remove_set]
