"""SQLModel database models for the events and funnel tables."""
import uuid
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, Column
from sqlalchemy import JSON


class Event(SQLModel, table=True):
    """Raw event ingested from the frontend signup flow."""
    __tablename__ = "events"

    id: Optional[uuid.UUID] = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
    )
    workspace_id: str = Field(index=True, max_length=128)
    session_id: str = Field(index=True, max_length=256)
    event_type: str = Field(index=True, max_length=64)
    step: str = Field(index=True, max_length=64)
    field: Optional[str] = Field(default=None, max_length=128)
    event_metadata: Optional[dict] = Field(default=None, sa_column=Column("metadata", JSON))
    timestamp: datetime = Field(default_factory=datetime.utcnow, index=True)


class Alert(SQLModel, table=True):
    """System health or conversion anomaly alert."""
    __tablename__ = "alerts"
    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    title: str = Field(max_length=256)
    description: Optional[str] = Field(default=None)
    severity: str = Field(max_length=32)
    status: str = Field(max_length=32)
    type: str = Field(max_length=64)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Insight(SQLModel, table=True):
    """AI-generated fix/improvement recommendation."""
    __tablename__ = "insights"
    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    reason: str = Field(max_length=256)
    description: Optional[str] = Field(default=None)
    impact_score: float
    potential_lift: Optional[str] = Field(default=None, max_length=32)
    status: str = Field(max_length=32)
    effort: str = Field(max_length=32)
    category: str = Field(max_length=64)
    created_at: datetime = Field(default_factory=datetime.utcnow)
