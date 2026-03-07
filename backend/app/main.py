import logging
import time
from collections.abc import Awaitable, Callable

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.core.config import settings
from app.core.logging import REQUEST_LOGGER_NAME, configure_logging

configure_logging(
    settings.log_level,
    disable_uvicorn_access_log=settings.request_logging_enabled,
    file_log_enabled=settings.file_log_enabled,
    file_log_path=settings.file_log_path,
)

request_logger = logging.getLogger(REQUEST_LOGGER_NAME)

app = FastAPI(
    title="TailFlow",
    description="Mobile-friendly image tagging application with classifier assistance.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")


@app.middleware("http")
async def log_requests(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    if not settings.request_logging_enabled:
        return await call_next(request)

    started_at = time.perf_counter()
    client_host = request.client.host if request.client is not None else "-"

    try:
        response = await call_next(request)
    except Exception:
        duration_ms = (time.perf_counter() - started_at) * 1000
        request_logger.exception(
            "request method=%s path=%s status=%s duration_ms=%.2f client=%s",
            request.method,
            request.url.path,
            500,
            duration_ms,
            client_host,
        )
        raise

    duration_ms = (time.perf_counter() - started_at) * 1000
    request_logger.info(
        "request method=%s path=%s status=%s duration_ms=%.2f client=%s",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
        client_host,
    )
    return response


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
