from app.services.classifier import classify_image
from app.services.projects import discover_projects, sync_project
from app.services.tagging import add_tags_to_image, remove_tags_from_image

__all__ = [
    "classify_image",
    "discover_projects",
    "sync_project",
    "add_tags_to_image",
    "remove_tags_from_image",
]
