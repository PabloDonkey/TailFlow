from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.core.logging import VALID_LOG_LEVELS


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

    database_url: str = "postgresql+psycopg://user:password@localhost:5432/tailflow"
    storage_path: str = "./storage/images"
    max_upload_size_mb: int = 50
    classifier_enabled: bool = False
    log_level: str = "INFO"
    request_logging_enabled: bool = True
    file_log_enabled: bool = False
    file_log_path: Path = Path("./storage/logs/tailflow.log")

    @field_validator("log_level", mode="before")
    @classmethod
    def normalize_log_level(cls, value: object) -> str:
        if not isinstance(value, str):
            raise ValueError("log_level must be a string.")

        normalized = value.upper()
        if normalized not in VALID_LOG_LEVELS:
            supported_levels = ", ".join(sorted(VALID_LOG_LEVELS))
            raise ValueError(f"log_level must be one of: {supported_levels}")

        return normalized


settings = Settings()
