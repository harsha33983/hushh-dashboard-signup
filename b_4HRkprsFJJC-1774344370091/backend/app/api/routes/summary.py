from fastapi import APIRouter, Header
from ..deps import APIKeyDep, DBSession
from ...schemas.response import SummaryResponse
from ...services.analytics_service import get_summary_metrics

router = APIRouter(tags=["Analytics Summary"])

@router.get("/summary", response_model=SummaryResponse)
async def get_summary(
    db: DBSession,
    _auth: APIKeyDep,
    x_workspace_id: str = Header(..., alias="X-Workspace-Id"),
):
    """
    Get high-level KPIs for the main dashboard summary tiles.
    """
    return await get_summary_metrics(db, x_workspace_id)
