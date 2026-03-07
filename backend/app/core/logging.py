"""Shared logging configuration for the TailFlow backend."""

from __future__ import annotations

import logging
import sys
from pathlib import Path

LOG_FORMAT = "%(asctime)s %(levelname)s [%(name)s] %(message)s"
LOG_DATE_FORMAT = "%Y-%m-%dT%H:%M:%S%z"
REQUEST_LOGGER_NAME = "tailflow.request"
VALID_LOG_LEVELS = frozenset({"CRITICAL", "ERROR", "WARNING", "INFO", "DEBUG"})


def resolve_log_level(value: str) -> int:
    """Convert a configured log level string to a logging module constant."""
    numeric_level = getattr(logging, value.upper(), None)
    if not isinstance(numeric_level, int):
        raise ValueError(f"Invalid log level: {value}")
    return numeric_level


def configure_logging(
    log_level: str,
    *,
    disable_uvicorn_access_log: bool = False,
    file_log_enabled: bool = False,
    file_log_path: Path | None = None,
) -> None:
    """Configure application logging to emit consistent stdout logs."""
    handlers: list[logging.Handler] = [logging.StreamHandler(sys.stdout)]

    if file_log_enabled:
        if file_log_path is None:
            raise ValueError("file_log_path is required when file logging is enabled")
        file_log_path.parent.mkdir(parents=True, exist_ok=True)
        handlers.append(logging.FileHandler(file_log_path, encoding="utf-8"))

    logging.basicConfig(
        level=resolve_log_level(log_level),
        format=LOG_FORMAT,
        datefmt=LOG_DATE_FORMAT,
        handlers=handlers,
        force=True,
    )

    logging.getLogger("uvicorn.access").disabled = disable_uvicorn_access_log
