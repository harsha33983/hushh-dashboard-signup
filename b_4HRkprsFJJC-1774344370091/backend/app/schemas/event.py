"""Pydantic schemas for event ingestion."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, Field, field_validator


class EventCreate(BaseModel):
    """Payload accepted by POST /events."""

    session_id: str = Field(..., min_length=1, max_length=256, examples=["sess_abc123"])
    event_type: str = Field(
        ...,
        min_length=1,
        max_length=64,
        examples=["page_view", "field_error", "exit", "api_failure"],
    )
    step: str = Field(..., min_length=1, max_length=64, examples=["step-1"])
    field: Optional[str] = Field(default=None, max_length=128)
    metadata: Optional[dict[str, Any]] = Field(default=None)
    timestamp: Optional[datetime] = Field(default_factory=datetime.utcnow)

    @field_validator("event_type")
    @classmethod
    def valid_event_type(cls, v: str) -> str:
        allowed = {
            "page_view", "field_focus", "field_blur",
            "field_error", "input_error", "exit",
            "api_failure", "retry", "complete",
        }
        if v not in allowed:
            raise ValueError(f"event_type must be one of {sorted(allowed)}")
        return v


class EventRead(BaseModel):
    """Response shape for a created event."""

    id: uuid.UUID
    session_id: str
    event_type: str
    step: str
    timestamp: datetime

    model_config = {"from_attributes": True}
