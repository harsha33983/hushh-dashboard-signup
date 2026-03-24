"""
GET /funnel  — funnel conversion metrics
GET /dropoff — per-step drop-off analysis
"""
from __future__ import annotations

from fastapi import APIRouter, Header

from ..deps import APIKeyDep, DBSession
from ...schemas.response import FunnelResponse, DropOffResponse
from ...services.analytics_service import get_funnel_metrics, get_dropoff_metrics, get_friction_metrics

router = APIRouter(tags=["Funnel Analytics"])


@router.get(
    "/funnel",
    response_model=FunnelResponse,
    summary="Funnel conversion metrics",
    description="Returns visitor counts and conversion rates per funnel step.",
)
async def funnel(
    api_key: APIKeyDep, 
    db: DBSession,
    x_workspace_id: str = Header(..., alias="X-Workspace-Id"),
) -> FunnelResponse:
    return await get_funnel_metrics(db, workspace_id=x_workspace_id)


@router.get(
    "/dropoff",
    response_model=DropOffResponse,
    summary="Drop-off analysis per funnel step",
    description=(
        "Calculates how many users dropped off between each consecutive "
        "funnel step and the percentage drop-off rate."
    ),
)
async def dropoff(
    api_key: APIKeyDep, 
    db: DBSession,
    x_workspace_id: str = Header(..., alias="X-Workspace-Id"),
) -> DropOffResponse:
    return await get_dropoff_metrics(db, workspace_id=x_workspace_id)


@router.get(
    "/friction",
    response_model=list[dict],
    summary="Field-level friction heatmap",
    description="Aggregates validation errors and abandonment per specific form field.",
)
async def friction(
    api_key: APIKeyDep,
    db: DBSession,
    x_workspace_id: str = Header(..., alias="X-Workspace-Id"),
) -> list[dict]:
    return await get_friction_metrics(db, workspace_id=x_workspace_id)
