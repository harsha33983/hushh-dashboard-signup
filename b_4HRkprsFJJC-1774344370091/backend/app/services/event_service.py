"""Event ingestion service — thin layer between routes and the DB."""
from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from loguru import logger

from ..models.event import Event
from ..schemas.event import EventCreate


async def ingest_event(
    session: AsyncSession,
    payload: EventCreate,
    workspace_id: str,
) -> Event:
    """
    Persist a single event row.

    Keeps the route handler lean; all DB interaction lives here.
    """
    event = Event(
        workspace_id=workspace_id,
        session_id=payload.session_id,
        event_type=payload.event_type,
        step=payload.step,
        field=payload.field,
        event_metadata=payload.metadata or {},
        timestamp=payload.timestamp,
    )
    session.add(event)
    await session.commit()
    await session.refresh(event)
    logger.debug(
        "Ingested event id={} type={} step={} session={}",
        event.id,
        event.event_type,
        event.step,
        event.session_id,
    )
    return event


async def get_recent_events(
    session: AsyncSession,
    workspace_id: str,
    limit: int = 100,
) -> list[Event]:
    """Return the most recent events for a workspace."""
    result = await session.execute(
        text(
            """
            SELECT * FROM events
            WHERE workspace_id = :wid
            ORDER BY timestamp DESC
            LIMIT :lim
            """
        ),
        {"wid": workspace_id, "lim": limit},
    )
    rows = result.mappings().all()
    return [
        Event(
            id=row["id"],
            workspace_id=row["workspace_id"],
            session_id=row["session_id"],
            event_type=row["event_type"],
            step=row["step"],
            field=row["field"],
            event_metadata=row["metadata"],
            timestamp=row["timestamp"],
        )
        for row in rows
    ]
