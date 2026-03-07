"""Tests for backend logging configuration and request logging."""

import logging
from pathlib import Path

import pytest
from httpx import AsyncClient
from pydantic import ValidationError

from app.core.config import Settings
from app.core.logging import REQUEST_LOGGER_NAME, configure_logging


def test_settings_normalize_log_level() -> None:
    settings = Settings(log_level="debug")
    assert settings.log_level == "DEBUG"


def test_settings_reject_invalid_log_level() -> None:
    with pytest.raises(ValidationError):
        Settings(log_level="verbose")


def test_configure_logging_writes_optional_file(tmp_path: Path) -> None:
    log_path = tmp_path / "logs" / "tailflow.log"

    configure_logging("INFO", file_log_enabled=True, file_log_path=log_path)
    logger = logging.getLogger("tailflow.test")
    logger.info("file logging works")

    assert log_path.exists()
    assert "file logging works" in log_path.read_text(encoding="utf-8")


@pytest.mark.asyncio
async def test_request_logging_emits_log(
    client: AsyncClient,
    caplog: pytest.LogCaptureFixture,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr("app.core.config.settings.request_logging_enabled", True)
    caplog.set_level(logging.INFO, logger=REQUEST_LOGGER_NAME)
    caplog.clear()

    response = await client.get("/health")

    assert response.status_code == 200
    assert any(
        record.name == REQUEST_LOGGER_NAME
        and "method=GET path=/health status=200" in record.getMessage()
        for record in caplog.records
    )


@pytest.mark.asyncio
async def test_request_logging_can_be_disabled(
    client: AsyncClient,
    caplog: pytest.LogCaptureFixture,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr("app.core.config.settings.request_logging_enabled", False)
    caplog.set_level(logging.INFO, logger=REQUEST_LOGGER_NAME)
    caplog.clear()

    response = await client.get("/health")

    assert response.status_code == 200
    assert not [
        record for record in caplog.records if record.name == REQUEST_LOGGER_NAME
    ]
