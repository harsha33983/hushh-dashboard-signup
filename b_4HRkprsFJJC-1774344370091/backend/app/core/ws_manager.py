"""
WebSocket connection manager.

Maintains a registry of active WebSocket connections and provides
a broadcast method to push JSON messages to all connected clients.

Completely isolated from REST routes — imported only by the WS router.
"""
from __future__ import annotations

import asyncio
from typing import Any

from fastapi import WebSocket
from loguru import logger


class ConnectionManager:
    """Thread-safe (asyncio) registry of active WebSocket connections."""

    def __init__(self) -> None:
        self._connections: list[WebSocket] = []
        self._lock = asyncio.Lock()

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        async with self._lock:
            self._connections.append(ws)
        logger.info("WS | client connected  (total={})", len(self._connections))

    async def disconnect(self, ws: WebSocket) -> None:
        async with self._lock:
            try:
                self._connections.remove(ws)
            except ValueError:
                pass
        logger.info("WS | client disconnected (total={})", len(self._connections))

    async def broadcast(self, data: dict[str, Any]) -> None:
        """Send JSON payload to every connected client; silently drop dead sockets."""
        if not self._connections:
            return

        async with self._lock:
            targets = list(self._connections)

        dead: list[WebSocket] = []
        for ws in targets:
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(ws)

        # Clean up dead connections
        if dead:
            async with self._lock:
                for ws in dead:
                    try:
                        self._connections.remove(ws)
                    except ValueError:
                        pass
            logger.debug("WS | removed {} dead connection(s)", len(dead))

    @property
    def active_count(self) -> int:
        return len(self._connections)


# Singleton — imported by both the WS router and the events route
manager = ConnectionManager()
