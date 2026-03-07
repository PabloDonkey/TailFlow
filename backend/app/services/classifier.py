"""Classifier service.

Provides a stub for running the Tail-Tagger classifier model.
When classifier_enabled is False (default), returns an empty list.
"""

import logging
from pathlib import Path

from app.core.config import settings

logger = logging.getLogger(__name__)


async def classify_image(image_path: Path) -> list[str]:
    """Run the classifier on the given image and return suggested tag names."""
    if not settings.classifier_enabled:
        logger.debug("Classifier disabled; returning empty suggestions.")
        return []

    try:
        return await _run_classifier(image_path)
    except Exception:
        logger.exception("Classifier failed for %s", image_path)
        return []


async def _run_classifier(image_path: Path) -> list[str]:
    """Run the actual Tail-Tagger model.

    Replace this implementation with the real model call when available.
    """
    # Placeholder — integrate the Tail-Tagger model here.
    _ = image_path
    return []
