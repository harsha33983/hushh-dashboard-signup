"""Funnel definition and step models."""
import uuid
from typing import Optional
from sqlmodel import SQLModel, Field, Column
from sqlalchemy import JSON


class Funnel(SQLModel, table=True):
    """A named multi-step funnel definition scoped to a workspace."""
    __tablename__ = "funnels"

    id: Optional[uuid.UUID] = Field(
        default_factory=uuid.uuid4, primary_key=True
    )
    name: str = Field(max_length=256)
    steps: list = Field(default=[], sa_column=Column(JSON))
