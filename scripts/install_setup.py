from __future__ import annotations

import secrets
import shutil
from dataclasses import dataclass
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = REPO_ROOT / "backend"
ENV_FILE = BACKEND_DIR / ".env"
ENV_EXAMPLE_FILE = BACKEND_DIR / ".env.example"


@dataclass
class SetupResult:
    created_env_file: bool
    generated_database_password: bool


def _parse_env_lines(content: str) -> list[str]:
    return content.splitlines()


def _serialize_env_lines(lines: list[str]) -> str:
    return "\n".join(lines) + "\n"


def _strip_wrapping_quotes(value: str) -> str:
    stripped = value.strip()
    if len(stripped) >= 2 and stripped[0] == stripped[-1] and stripped[0] in {'"', "'"}:
        return stripped[1:-1]
    return stripped


def _get_env_value(lines: list[str], key: str) -> str | None:
    prefix = f"{key}="
    for line in lines:
        if line.startswith(prefix):
            return _strip_wrapping_quotes(line[len(prefix) :])
    return None


def _quote_env_value(value: str) -> str:
    escaped = value.replace("\\", "\\\\").replace('"', '\\"')
    return f'"{escaped}"'


def _upsert_env_value(lines: list[str], key: str, value: str) -> list[str]:
    prefix = f"{key}="
    quoted_value = _quote_env_value(value)
    replacement = f"{key}={quoted_value}"
    for index, line in enumerate(lines):
        if line.startswith(prefix):
            lines[index] = replacement
            return lines
    lines.append(replacement)
    return lines


def bootstrap_backend_env() -> SetupResult:
    created_env_file = False
    generated_database_password = False

    if not ENV_FILE.exists():
        shutil.copy2(ENV_EXAMPLE_FILE, ENV_FILE)
        created_env_file = True

    lines = _parse_env_lines(ENV_FILE.read_text(encoding="utf-8"))

    database_password = _get_env_value(lines, "DATABASE_PASSWORD")
    if database_password is None or database_password.strip() == "":
        random_password = secrets.token_urlsafe(24)
        lines = _upsert_env_value(lines, "DATABASE_PASSWORD", random_password)
        generated_database_password = True

    if _get_env_value(lines, "PROJECTS_ROOT_PATH") is None:
        lines = _upsert_env_value(lines, "PROJECTS_ROOT_PATH", "")

    ENV_FILE.write_text(_serialize_env_lines(lines), encoding="utf-8")

    return SetupResult(
        created_env_file=created_env_file,
        generated_database_password=generated_database_password,
    )


def main() -> int:
    result = bootstrap_backend_env()

    if result.created_env_file:
        print("Created backend/.env from backend/.env.example")
    if result.generated_database_password:
        print("Generated random DATABASE_PASSWORD in backend/.env")

    print("PROJECTS_ROOT_PATH can be configured later via onboarding.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())