"""Tests for backend settings configuration."""

from pathlib import Path

import pytest
from pydantic import ValidationError

from app.core.config import Settings


def test_settings_normalize_log_level() -> None:
    settings = Settings(log_level="debug")
    assert settings.log_level == "DEBUG"


def test_settings_reject_invalid_log_level() -> None:
    with pytest.raises(ValidationError):
        Settings(log_level="verbose")


def test_settings_build_database_url_from_split_values() -> None:
    settings = Settings(
        database_host="localhost",
        database_port=5432,
        database_name="tailflow_db",
        database_user="tailflow",
        database_password="p@ss word",
    )

    assert (
        settings.database_url
        == "postgresql+psycopg://tailflow:p%40ss+word@localhost:5432/tailflow_db"
    )


def test_settings_blank_projects_root_path_is_none() -> None:
    settings = Settings(projects_root_path="")
    assert settings.projects_root_path is None


def test_projects_root_path_resolved_returns_existing_directory(tmp_path: Path) -> None:
    settings = Settings(projects_root_path=tmp_path)
    assert settings.projects_root_path_resolved == tmp_path.resolve()


@pytest.mark.parametrize(
    "path_value",
    [Path("/tmp/does-not-exist-12345"), Path(__file__)],
)
def test_projects_root_path_resolved_rejects_invalid_path(path_value: Path) -> None:
    settings = Settings(projects_root_path=path_value)

    with pytest.raises(ValueError):
        _ = settings.projects_root_path_resolved


def test_projects_root_path_resolved_requires_configuration() -> None:
    settings = Settings(projects_root_path=None)

    with pytest.raises(ValueError):
        _ = settings.projects_root_path_resolved
