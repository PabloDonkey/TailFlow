from pathlib import Path
from urllib.parse import quote_plus

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.core.logging import VALID_LOG_LEVELS

BACKEND_ROOT = Path(__file__).resolve().parents[2]
ENV_FILE_PATH = BACKEND_ROOT / ".env"
ENV_EXAMPLE_FILE_PATH = BACKEND_ROOT / ".env.example"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_ignore_empty=True,
    )

    database_host: str = "localhost"
    database_port: int = 5432
    database_name: str = "tailflow_db"
    database_user: str = "tailflow"
    database_password: str = "password"
    projects_root_path: Path | None = None
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

    @field_validator("projects_root_path", mode="before")
    @classmethod
    def normalize_projects_root_path(cls, value: object) -> object:
        if value is None:
            return None
        if isinstance(value, str):
            stripped = value.strip()
            return None if not stripped else Path(stripped).expanduser()
        return value

    @property
    def database_url(self) -> str:
        encoded_user = quote_plus(self.database_user)
        encoded_password = quote_plus(self.database_password)
        return (
            f"postgresql+psycopg://{encoded_user}:{encoded_password}"
            f"@{self.database_host}:{self.database_port}/{self.database_name}"
        )

    @property
    def projects_root_path_resolved(self) -> Path:
        if self.projects_root_path is None:
            raise ValueError(
                "PROJECTS_ROOT_PATH is not configured. "
                "Set it in backend/.env before using project discovery features."
            )

        resolved = self.projects_root_path.resolve()
        if not resolved.exists():
            raise ValueError(f"PROJECTS_ROOT_PATH does not exist: {resolved}")
        if not resolved.is_dir():
            raise ValueError(f"PROJECTS_ROOT_PATH is not a directory: {resolved}")
        return resolved


settings = Settings()


def get_backend_env_file_path() -> Path:
    return ENV_FILE_PATH


def get_backend_env_example_file_path() -> Path:
    return ENV_EXAMPLE_FILE_PATH


def default_projects_root_path() -> Path:
    return Path.home() / "tailflow"


def is_projects_root_configured() -> bool:
    return settings.projects_root_path is not None


def _quote_env_value(value: str) -> str:
    escaped = value.replace("\\", "\\\\").replace('"', '\\"')
    return f'"{escaped}"'


def upsert_env_key(file_path: Path, key: str, value: str) -> None:
    prefix = f"{key}="
    replacement = f"{key}={_quote_env_value(value)}"

    if file_path.exists():
        lines = file_path.read_text(encoding="utf-8").splitlines()
    else:
        lines = []

    for index, line in enumerate(lines):
        if line.startswith(prefix):
            lines[index] = replacement
            file_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
            return

    lines.append(replacement)
    file_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def configure_projects_root_path(path_value: str) -> Path:
    candidate = Path(path_value).expanduser().resolve()
    if candidate.exists() and not candidate.is_dir():
        raise ValueError(f"PROJECTS_ROOT_PATH is not a directory: {candidate}")

    candidate.mkdir(parents=True, exist_ok=True)
    upsert_env_key(get_backend_env_file_path(), "PROJECTS_ROOT_PATH", str(candidate))
    settings.projects_root_path = candidate
    return candidate
