"""Classifier service.

Provides a stub for running the Tail-Tagger classifier model.
When classifier_enabled is False (default), returns an empty list.
"""

import logging
from dataclasses import dataclass
from pathlib import Path

from app.core.config import settings
from app.core.enums import TaggingMode

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class ClassifierSuggestion:
    name: str
    confidence: float


SUPPORTED_MODEL_IDS = {
    "jtp-3-hydra",
    "wd-swinv2",
    "convnext-v3",
    "siglip-hybrid",
}

MOCK_POOLS: dict[TaggingMode, tuple[str, ...]] = {
    TaggingMode.E621: (
        "masterpiece",
        "highres",
        "detailed background",
        "solo",
        "looking at viewer",
        "dynamic pose",
        "tail",
        "fur",
        "smile",
        "outdoors",
        "daylight",
        "sharp focus",
    ),
    TaggingMode.BOORU: (
        "masterpiece",
        "best quality",
        "1girl",
        "long hair",
        "brown hair",
        "school uniform",
        "standing",
        "cityscape",
        "sunset",
        "dramatic lighting",
        "depth of field",
        "cinematic composition",
    ),
}


async def classify_image(image_path: Path) -> list[str]:
    """Run the classifier on the given image and return suggested tag names."""
    suggestions = await classify_project_image(
        image_path=image_path,
        tagging_mode=TaggingMode.E621,
        model_id="jtp-3-hydra",
        threshold=0.35,
        max_tags=32,
    )
    return [suggestion.name for suggestion in suggestions]


async def classify_project_image(
    image_path: Path,
    tagging_mode: TaggingMode,
    model_id: str,
    threshold: float,
    max_tags: int,
) -> list[ClassifierSuggestion]:
    """Run the classifier and return scored suggestions for one project image."""
    if not settings.classifier_enabled:
        logger.debug("Classifier disabled; returning empty suggestions.")
        return []

    normalized_model_id = model_id.strip().lower()
    if normalized_model_id not in SUPPORTED_MODEL_IDS:
        logger.warning("Unsupported classifier model requested: %s", model_id)
        return []

    normalized_threshold = max(0.0, min(1.0, threshold))
    normalized_max_tags = max(1, min(128, max_tags))

    try:
        return await _run_classifier_with_scores(
            image_path=image_path,
            tagging_mode=tagging_mode,
            model_id=normalized_model_id,
            threshold=normalized_threshold,
            max_tags=normalized_max_tags,
        )
    except Exception:
        logger.exception("Classifier failed for %s", image_path)
        return []


def _hash_seed(value: str) -> int:
    hash_value = 0
    for char in value:
        hash_value = (hash_value * 31 + ord(char)) & 0xFFFFFFFF
    return hash_value


def _pseudo_random(seed: int) -> float:
    next_seed = (seed * 1664525 + 1013904223) & 0xFFFFFFFF
    return next_seed / 4294967296


async def _run_classifier_with_scores(
    image_path: Path,
    tagging_mode: TaggingMode,
    model_id: str,
    threshold: float,
    max_tags: int,
) -> list[ClassifierSuggestion]:
    """Run the actual model and return confidence-scored suggestions.

    TODO: Replace this deterministic fallback with JTP-3 Hydra inference.
    """
    pool = MOCK_POOLS[tagging_mode]
    seed = _hash_seed(f"{image_path}:{tagging_mode.value}:{model_id}")

    suggestions = [
        ClassifierSuggestion(
            name=tag_name,
            confidence=round(0.2 + _pseudo_random(seed + index * 977) * 0.78, 2),
        )
        for index, tag_name in enumerate(pool)
    ]

    filtered = [item for item in suggestions if item.confidence >= threshold]
    filtered.sort(key=lambda item: item.confidence, reverse=True)
    return filtered[:max_tags]
