import uuid
from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.core.enums import TaggingMode

ALLOWED_CATALOGS = frozenset(mode.value for mode in TaggingMode)


def _normalize_catalog_ids(value: dict[str, str]) -> dict[str, str]:
    normalized: dict[str, str] = {}
    for raw_key, raw_id in value.items():
        key = raw_key.strip()
        external_id = raw_id.strip()
        if key not in ALLOWED_CATALOGS:
            allowed = ", ".join(sorted(ALLOWED_CATALOGS))
            raise ValueError(
                f"catalog_ids keys must be one of: {allowed}."
            )
        if not external_id:
            raise ValueError("catalog_ids values must not be empty.")
        normalized[key] = external_id
    return normalized


class TagCreate(BaseModel):
    name: str = Field(min_length=1)
    category: str | None = None
    catalog_ids: dict[str, str] = Field(default_factory=dict)

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("name must not be empty.")
        return normalized

    @field_validator("category")
    @classmethod
    def normalize_category(cls, value: str | None) -> str | None:
        if value is None:
            return None

        normalized = value.strip()
        return normalized or None

    @field_validator("catalog_ids")
    @classmethod
    def normalize_catalog_ids(cls, value: dict[str, str]) -> dict[str, str]:
        return _normalize_catalog_ids(value)


class TagRead(BaseModel):
    id: uuid.UUID
    name: str
    catalog_ids: dict[str, str] = Field(default_factory=dict)
    category: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}

    @field_validator("catalog_ids", mode="before")
    @classmethod
    def validate_catalog_ids(cls, value: object) -> dict[str, str]:
        if value is None:
            return {}
        if not isinstance(value, dict):
            raise ValueError("catalog_ids must be a mapping.")
        normalized: dict[str, str] = {}
        for raw_key, raw_id in value.items():
            if raw_id is None:
                raise ValueError("catalog_ids values must not be null.")
            if not isinstance(raw_id, str):
                raise ValueError("catalog_ids values must be strings.")
            normalized[str(raw_key)] = raw_id
        return _normalize_catalog_ids(normalized)
