from __future__ import annotations

import argparse
import asyncio
import sys
from pathlib import Path

from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

REPO_ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = REPO_ROOT / "backend"

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

SOURCE_CHOICES = ("all", "e621", "booru")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Import bundled e621 and booru CSV tags into TailFlow."
    )
    parser.add_argument(
        "--source",
        choices=SOURCE_CHOICES,
        default="all",
        help="Import one source or all bundled sources.",
    )
    return parser.parse_args()


def resolve_sources(selected_source: str) -> list[str]:
    if selected_source == "all":
        return ["e621", "booru"]
    return [selected_source]


async def run() -> int:
    from app.core.config import settings
    from app.core.enums import TaggingMode
    from app.services.tag_import import get_catalog_asset_path, import_tag_catalog

    args = parse_args()
    sources = [TaggingMode(source) for source in resolve_sources(args.source)]

    engine = create_async_engine(settings.database_url, echo=False)
    session_factory = async_sessionmaker(
        bind=engine,
        expire_on_commit=False,
    )

    try:
        for source in sources:
            async with session_factory() as session:
                summary = await import_tag_catalog(session, source)
                print(
                    f"{source.value}: "
                    f"processed={summary.processed} "
                    f"created={summary.created} "
                    f"merged={summary.merged} "
                    f"skipped={summary.skipped} "
                    f"invalid={summary.invalid} "
                    f"path={get_catalog_asset_path(source)}"
                )
    finally:
        await engine.dispose()

    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(run()))
