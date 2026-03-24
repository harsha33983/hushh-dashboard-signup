"""
WebSocket endpoint — /ws

Clients connect here to receive real-time event broadcasts.
Completely isolated from REST routes; shares only the ConnectionManager singleton.

Protocol:
  • On connect: server sends {"type": "connected", "active_clients": N}
  • On new event ingested: server broadcasts {"type": "event", "data": {...}}
  • Client can send {"type": "ping"} → server replies {"type": "pong"}
  • On disconnect: connection is silently removed from the registry
"""
from __future__ import annotations

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from loguru import logger

from ...core.ws_manager import manager

router = APIRouter(tags=["WebSocket"])


@router.websocket("/ws")
async def websocket_endpoint(ws: WebSocket) -> None:
    await manager.connect(ws)

    # Greet the new client
    await ws.send_json(
        {
            "type": "connected",
            "active_clients": manager.active_count,
        }
    )

    try:
        while True:
            # Keep the connection alive; handle client-sent messages
            msg = await ws.receive_json()
            if isinstance(msg, dict) and msg.get("type") == "ping":
                await ws.send_json({"type": "pong"})
    except WebSocketDisconnect:
        pass
    except Exception as exc:
        logger.warning("WS | unexpected error: {}", exc)
    finally:
        await manager.disconnect(ws)
