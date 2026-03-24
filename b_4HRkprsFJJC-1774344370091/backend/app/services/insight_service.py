"""
Insight generation service.

Analyses raw events for three signal types:
  1. High error fields (field_error count > threshold)
  2. Slow steps (avg inter-event time > threshold)
  3. Retry patterns (repeated events per session on same step)

Returns a ranked list of InsightItem sorted by impact_score descending.
"""
from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from loguru import logger

from ..schemas.response import InsightItem
from ..core.config import get_settings
from ..utils.helpers import round2

settings = get_settings()


async def get_insights(
    session: AsyncSession,
    workspace_id: str,
) -> list[InsightItem]:
    """Run all insight queries concurrently and merge results."""
    import asyncio

    error_task  = _high_error_fields(session, workspace_id)
    retry_task  = _retry_patterns(session, workspace_id)
    slow_task   = _slow_steps(session, workspace_id)

    errors, retries, slow = await asyncio.gather(error_task, retry_task, slow_task)

    insights = errors + retries + slow
    # Sort by impact_score descending, then stable step order
    insights.sort(key=lambda i: -i.impact_score)
    return insights


# ── Private analysis helpers ───────────────────────────────────────────────────

async def _high_error_fields(
    session: AsyncSession,
    workspace_id: str,
) -> list[InsightItem]:
    """Fields with error count above threshold → friction insight."""
    threshold = settings.high_error_threshold
    result = await session.execute(
        text(
            """
            SELECT
                step,
                field,
                COUNT(*) AS error_count,
                COUNT(DISTINCT session_id) AS affected_sessions
            FROM events
            WHERE workspace_id = :wid
              AND event_type IN ('field_error', 'input_error')
              AND field IS NOT NULL
            GROUP BY step, field
            HAVING COUNT(*) > :threshold
            ORDER BY error_count DESC
            """
        ),
        {"wid": workspace_id, "threshold": threshold},
    )
    rows = result.mappings().all()

    items: list[InsightItem] = []
    for row in rows:
        # Impact = log-scaled error volume, capped at 10
        raw = min(10.0, (row["error_count"] / threshold) * 3.5)
        items.append(
            InsightItem(
                reason=f"High field errors on '{row['field']}'",
                description=(
                    f"Found {row['error_count']} validation errors on step '{row['step']}'. "
                    f"Affects {row['affected_sessions']} unique users."
                ),
                impact_score=round2(raw),
                potential_lift=f"+{int(raw * 0.8)}%",
                status="critical" if raw > 7 else "high",
                effort="low",
                category="UX Friction"
            )
        )
    return items


async def _retry_patterns(
    session: AsyncSession,
    workspace_id: str,
) -> list[InsightItem]:
    """Sessions that repeat the same event_type on same step > 2× → retry signal."""
    result = await session.execute(
        text(
            """
            SELECT
                step,
                event_type,
                COUNT(*) AS retry_sessions
            FROM (
                SELECT
                    step,
                    event_type,
                    session_id,
                    COUNT(*) AS evt_count
                FROM events
                WHERE workspace_id = :wid
                  AND event_type NOT IN ('page_view', 'complete')
                GROUP BY step, event_type, session_id
                HAVING COUNT(*) > 2
            ) sub
            GROUP BY step, event_type
            ORDER BY retry_sessions DESC
            LIMIT 5
            """
        ),
        {"wid": workspace_id},
    )
    rows = result.mappings().all()

    items: list[InsightItem] = []
    for row in rows:
        score = round2(min(10.0, (row["retry_sessions"] / 10) * 5))
        items.append(
            InsightItem(
                reason=f"User frustration on '{row['step']}'",
                description=(
                    f"Users are retrying '{row['event_type']}' multiple times. "
                    f"{row['retry_sessions']} sessions affected."
                ),
                impact_score=score,
                potential_lift=f"+{int(score * 1.2)}%",
                status="high" if score > 5 else "medium",
                effort="medium",
                category="Product"
            )
        )
    return items


async def _slow_steps(
    session: AsyncSession,
    workspace_id: str,
) -> list[InsightItem]:
    """Steps where the time from first to last event exceeds the threshold."""
    threshold_s = settings.slow_step_threshold_seconds
    result = await session.execute(
        text(
            """
            SELECT
                step,
                AVG(EXTRACT(EPOCH FROM (max_ts - min_ts))) AS avg_seconds,
                COUNT(DISTINCT session_id) AS session_count
            FROM (
                SELECT
                    step,
                    session_id,
                    MIN(timestamp) AS min_ts,
                    MAX(timestamp) AS max_ts
                FROM events
                WHERE workspace_id = :wid
                GROUP BY step, session_id
            ) sub
            GROUP BY step
            HAVING AVG(EXTRACT(EPOCH FROM (max_ts - min_ts))) > :threshold
            ORDER BY avg_seconds DESC
            """
        ),
        {"wid": workspace_id, "threshold": threshold_s},
    )
    rows = result.mappings().all()

    items: list[InsightItem] = []
    for row in rows:
        avg_s = float(row["avg_seconds"])
        score = round2(min(10.0, (avg_s / threshold_s) * 4))
        items.append(
            InsightItem(
                reason=f"Slow completion on '{row['step']}'",
                description=(
                    f"Average completion time is {int(avg_s)}s, exceeding benchmark. "
                    f"Affects {row['session_count']} sessions."
                ),
                impact_score=score,
                potential_lift=f"+{int(score * 1.5)}%",
                status="medium" if score < 7 else "high",
                effort="high",
                category="Technical"
            )
        )
    return items
