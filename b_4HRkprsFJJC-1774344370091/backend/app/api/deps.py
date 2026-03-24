"""FastAPI dependency injectors: auth + DB session."""
from __future__ import annotations

from typing import Annotated
from fastapi import Header, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.config import get_settings
from ..core.database import get_session

Settings = get_settings


async def verify_api_key(
    x_api_key: Annotated[str | None, Header()] = None,
) -> str:
    """Validate the X-Api-Key header against the configured API key."""
    settings = get_settings()
    if not x_api_key or x_api_key != settings.api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid API key.",
            headers={"WWW-Authenticate": "ApiKey"},
        )
    return x_api_key


# Convenient type aliases
APIKeyDep = Annotated[str, Depends(verify_api_key)]
DBSession  = Annotated[AsyncSession, Depends(get_session)]
