from pathlib import Path
from urllib.parse import quote_plus

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.core.logging import VALID_LOG_LEVELS


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

    database_host: str = "localhost"
    database_port: int = 5432
    database_name: str = "tailflow"
    database_user: str = "user"
    database_password: str = "password"
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

    @property
    def database_url(self) -> str:
        encoded_user = quote_plus(self.database_user)
        encoded_password = quote_plus(self.database_password)
        return (
            f"postgresql+psycopg://{encoded_user}:{encoded_password}"
            f"@{self.database_host}:{self.database_port}/{self.database_name}"
        )


settings = Settings()
