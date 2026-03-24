"""
GET /insights — AI-classified drop-off insights ranked by impact_score.
"""
from __future__ import annotations

from fastapi import APIRouter, Header

from ..deps import APIKeyDep, DBSession
from ...schemas.response import InsightItem
from ...services.insight_service import get_insights

router = APIRouter(tags=["Insights"])


@router.get(
    "/insights",
    response_model=list[InsightItem],
    summary="Ranked drop-off insights",
    description=(
        "Analyses raw events for three signal types — high-error fields, "
        "slow steps, and retry patterns — and returns ranked actionable insights."
    ),
)
async def insights(
    api_key: APIKeyDep,
    db: DBSession,
    x_workspace_id: str = Header(..., alias="X-Workspace-Id"),
) -> list[InsightItem]:
    return await get_insights(db, workspace_id=x_workspace_id)
