"""
POST /events  — event ingestion with background task support.
"""
from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks, status, Header
from loguru import logger

from ..deps import APIKeyDep, DBSession
from ...schemas.event import EventCreate, EventRead
from ...schemas.response import OkResponse, DataResponse
from ...services import event_service
from ...core.ws_manager import manager as ws_manager

router = APIRouter(prefix="/events", tags=["Events"])


@router.post(
    "",
    status_code=status.HTTP_200_OK,
    response_model=OkResponse,
    summary="Ingest a single user event",
    description=(
        "Fast-path event ingestion endpoint. Accepts a single event, "
        "validates it, and writes it to Supabase. Designed for < 100 ms latency."
    ),
)
async def create_event(
    payload: EventCreate,
    api_key: APIKeyDep,
    db: DBSession,
    background_tasks: BackgroundTasks,
    x_workspace_id: str = Header(..., alias="X-Workspace-Id"),
) -> OkResponse:
    await event_service.ingest_event(db, payload, x_workspace_id)

    # Broadcast to all connected WebSocket clients (non-blocking)
    background_tasks.add_task(
        ws_manager.broadcast,
        {
            "type": "event",
            "data": {
                "event_type": payload.event_type,
                "step": payload.step,
                "field": payload.field,
                "session_id": payload.session_id,
                "workspace_id": x_workspace_id,
                "timestamp": payload.timestamp.isoformat() if payload.timestamp else None,
            },
        },
    )

    # Optional: background aggregation (non-blocking)
    background_tasks.add_task(
        _log_ingestion,
        payload.session_id,
        payload.event_type,
        payload.step,
    )

    return OkResponse()


def _log_ingestion(session_id: str, event_type: str, step: str) -> None:
    """Background task: logs ingestion metrics (extend with real aggregation)."""
    logger.info(
        "BG|ingested session={} type={} step={}",
        session_id,
        event_type,
        step,
    )
