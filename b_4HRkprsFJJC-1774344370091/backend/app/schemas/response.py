"""Standard API response envelopes."""
from __future__ import annotations

from typing import Any, Generic, Optional, TypeVar
from pydantic import BaseModel

T = TypeVar("T")


class OkResponse(BaseModel):
    """Generic success acknowledgement returned by write endpoints."""
    status: str = "ok"


class DataResponse(BaseModel, Generic[T]):
    """Generic wrapper for any successful data payload."""
    status: str = "ok"
    data: T


class ErrorResponse(BaseModel):
    """Structured error payload returned on 4xx / 5xx."""
    status: str = "error"
    code: str
    message: str
    detail: Optional[Any] = None


# ── Domain-specific response shapes ───────────────────────────────────────────

class FunnelStepMetric(BaseModel):
    step: str
    name: str
    visitor_count: int
    conversion_rate: float          # 0–100 %


class FunnelResponse(BaseModel):
    funnel_name: str
    total_sessions: int
    steps: list[FunnelStepMetric]


class DropOffStep(BaseModel):
    step: str
    drop_count: int
    drop_rate: float                # 0–100 %


class DropOffResponse(BaseModel):
    total_dropped: int
    steps: list[DropOffStep]


class InsightItem(BaseModel):
    id: Optional[str] = None
    reason: str
    description: Optional[str] = None
    impact_score: float             # 0–10
    potential_lift: Optional[str] = None
    status: str                     # critical, high, medium, low
    effort: str                     # low, medium, high
    category: str                   # Technical, UX Friction, Product


class SummaryResponse(BaseModel):
    completion_rate: float          # 0–100 %
    total_sessions: int
    avg_duration_minutes: float
    active_alerts: int
