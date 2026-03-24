"""
Analytics service — funnel and drop-off aggregation.

All queries are single-round-trip aggregations (no N+1).
"""
from __future__ import annotations

from collections import defaultdict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from ..schemas.response import (
    FunnelStepMetric, FunnelResponse, 
    DropOffStep, DropOffResponse,
    SummaryResponse
)
from ..utils.helpers import safe_divide, round2, clamp

# Canonical funnel step order (matches the frontend seed data)
FUNNEL_STEPS: list[tuple[str, str]] = [
    ("step-1", "Email & Password"),
    ("step-2", "Personal Details"),
    ("step-3", "Phone Verification"),
    ("step-4", "Complete"),
]


async def get_funnel_metrics(
    session: AsyncSession,
    workspace_id: str,
) -> FunnelResponse:
    """
    Count DISTINCT sessions per step in one query, then derive
    conversion rates relative to the first step.
    """
    result = await session.execute(
        text(
            """
            SELECT
                step,
                COUNT(DISTINCT session_id) AS visitor_count
            FROM events
            WHERE workspace_id = :wid
              AND event_type = 'page_view'
              AND step = ANY(:steps)
            GROUP BY step
            """
        ),
        {
            "wid": workspace_id,
            "steps": [s for s, _ in FUNNEL_STEPS],
        },
    )
    counts: dict[str, int] = {row.step: row.visitor_count for row in result}

    # Total unique sessions across the funnel (entry = step-1)
    total_sessions = counts.get("step-1", 0)

    steps: list[FunnelStepMetric] = []
    for step_id, name in FUNNEL_STEPS:
        visitors = counts.get(step_id, 0)
        conversion = clamp(round2(safe_divide(visitors * 100, total_sessions)))
        steps.append(
            FunnelStepMetric(
                step=step_id,
                name=name,
                visitor_count=visitors,
                conversion_rate=conversion,
            )
        )

    return FunnelResponse(
        funnel_name="Signup Flow",
        total_sessions=total_sessions,
        steps=steps,
    )


async def get_dropoff_metrics(
    session: AsyncSession,
    workspace_id: str,
) -> DropOffResponse:
    """
    Calculate per-step drop-off by comparing consecutive step visitor counts.
    Single aggregation query, O(steps) Python post-processing.
    """
    funnel = await get_funnel_metrics(session, workspace_id)
    step_counts = {s.step: s.visitor_count for s in funnel.steps}

    drop_steps: list[DropOffStep] = []
    total_dropped = 0
    step_ids = [s for s, _ in FUNNEL_STEPS]

    for i in range(len(step_ids) - 1):
        current = step_counts.get(step_ids[i], 0)
        nxt     = step_counts.get(step_ids[i + 1], 0)
        dropped = max(0, current - nxt)
        rate    = round2(safe_divide(dropped * 100, current))
        total_dropped += dropped
        drop_steps.append(
            DropOffStep(step=step_ids[i], drop_count=dropped, drop_rate=rate)
        )

    return DropOffResponse(total_dropped=total_dropped, steps=drop_steps)


async def get_summary_metrics(
    session: AsyncSession,
    workspace_id: str,
) -> SummaryResponse:
    """
    Compute aggregate KPIs for the main dashboard.
    """
    # 1. Total unique sessions
    res_sessions = await session.execute(
        text("SELECT COUNT(DISTINCT session_id) FROM events WHERE workspace_id = :wid"),
        {"wid": workspace_id}
    )
    total_sessions = res_sessions.scalar() or 0

    # 2. Completion rate (sessions with final step / total sessions)
    res_completed = await session.execute(
        text("SELECT COUNT(DISTINCT session_id) FROM events WHERE workspace_id = :wid AND step = 'step-4'"),
        {"wid": workspace_id}
    )
    completed_sessions = res_completed.scalar() or 0
    completion_rate = round2(safe_divide(completed_sessions * 100, total_sessions))

    # 3. Active Alerts
    res_alerts = await session.execute(
        text("SELECT COUNT(*) FROM alerts WHERE status = 'active'")
    )
    active_alerts = res_alerts.scalar() or 0

    # 4. Avg Duration (minutes) for sessions that reached the end
    res_duration = await session.execute(
        text("""
            WITH session_times AS (
                SELECT session_id, MIN(timestamp) as start_t, MAX(timestamp) as end_t
                FROM events
                WHERE workspace_id = :wid
                GROUP BY session_id
                HAVING COUNT(DISTINCT step) >= 4
            )
            SELECT AVG(EXTRACT(EPOCH FROM (end_t - start_t)) / 60) FROM session_times
        """),
        {"wid": workspace_id}
    )
    avg_duration = round2(res_duration.scalar() or 0.0)

    return SummaryResponse(
        completion_rate=completion_rate,
        total_sessions=total_sessions,
        avg_duration_minutes=avg_duration,
        active_alerts=active_alerts,
    )


async def get_friction_metrics(
    session: AsyncSession,
    workspace_id: str,
) -> list[dict]:
    """
    Get field-level friction data (errors and abandonment per field).
    """
    result = await session.execute(
        text(
            """
            SELECT
                field,
                step,
                COUNT(*) FILTER (WHERE event_type = 'input_error') AS errors,
                COUNT(DISTINCT session_id) AS visitors
            FROM events
            WHERE workspace_id = :wid AND field IS NOT NULL
            GROUP BY field, step
            ORDER BY errors DESC
            """
        ),
        {"wid": workspace_id},
    )
    
    friction_data = []
    for row in result:
        # Simple abandonment heuristic: visitors who didn't move past this step
        # For MVP, we'll just return errors and visitors
        severity = "Normal"
        if row.errors > 500: severity = "Critical"
        elif row.errors > 200: severity = "High"
        
        friction_data.append({
            "field": row.field,
            "step": row.step,
            "errors": row.errors,
            "visitors": row.visitors,
            "status": severity
        })
        
    return friction_data
