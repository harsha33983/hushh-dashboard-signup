"""
Drop-off Intelligence Platform — FastAPI application entrypoint.

Features:
  • Async lifespan: DB init on startup, dispose on shutdown
  • Request-ID middleware for distributed tracing
  • Structured request/response logging with loguru
  • Slowapi rate limiting (per IP, configurable)
  • Global exception handlers (422 / 500)
  • CORS for frontend dev server
  • OpenAPI docs restricted in production
"""
from __future__ import annotations

import sys
import time
import uuid
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

from .api.routes import events, funnel, insights, summary
from .core.config import get_settings
from .core.database import close_db, init_db

# ── Logging setup ──────────────────────────────────────────────────────────────
settings = get_settings()

logger.remove()
logger.add(
    sys.stdout,
    format=(
        "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
        "{message}"
    ),
    level=settings.log_level,
    colorize=True,
)

# ── Rate limiting ──────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])

# ── App lifespan ───────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    logger.info("[START] Starting Drop-off Intelligence API ({})", settings.environment)
    await init_db()
    yield
    await close_db()
    logger.info("[STOP] Shutdown complete.")


# ── FastAPI instance ───────────────────────────────────────────────────────────
app = FastAPI(
    title="Drop-off Intelligence API",
    description=(
        "Production-grade FastAPI backend for the Drop-off Intelligence Platform.\n\n"
        "All endpoints require **X-Api-Key** header authentication."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.environment != "production" else None,
    redoc_url="/redoc" if settings.environment != "production" else None,
)

# ── Middleware: CORS ───────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://your-production-domain.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Middleware: Rate limiting ──────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# ── Middleware: Request-ID + structured logging ────────────────────────────────
@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    # First 8 chars of a uuid string
    request_id = str(uuid.uuid4()).split("-")[0]
    request.state.request_id = request_id
    start = time.perf_counter()

    logger.info(
        "--> {} {} [{}]",
        request.method,
        request.url.path,
        request_id,
    )

    response = await call_next(request)
    duration_ms = (time.perf_counter() - start) * 1000

    logger.info(
        "<-- {} {} {} {:.1f}ms [{}]",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
        request_id,
    )
    response.headers["X-Request-ID"] = request_id
    return response


# ── Global exception handlers ──────────────────────────────────────────────────
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled error on {} {}: {}", request.method, request.url.path, exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "status": "error",
            "code": "INTERNAL_SERVER_ERROR",
            "message": "An unexpected error occurred.",
        },
    )


# ── Routes ─────────────────────────────────────────────────────────────────────
app.include_router(events.router,  prefix="/api/v1")
app.include_router(funnel.router,  prefix="/api/v1")
app.include_router(insights.router, prefix="/api/v1")
app.include_router(summary.router,  prefix="/api/v1")


# ── Health check ───────────────────────────────────────────────────────────────
@app.get("/health", tags=["System"], summary="Health check")
async def health() -> dict:
    return {"status": "ok", "environment": settings.environment}
