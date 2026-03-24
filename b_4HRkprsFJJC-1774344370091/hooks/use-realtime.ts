"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export type RealtimeEvent = {
  event_type: string;
  step: string;
  field?: string | null;
  session_id: string;
  workspace_id: string;
  timestamp: string | null;
};

export type RealtimeMessage =
  | { type: "connected"; active_clients: number }
  | { type: "event"; data: RealtimeEvent }
  | { type: "pong" };

type Status = "connecting" | "connected" | "disconnected" | "error";

const WS_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws")
    : "";

const RECONNECT_DELAY_MS = 3000;
const MAX_EVENTS = 50;

export function useRealtime(onEvent?: (event: RealtimeEvent) => void) {
  const [status, setStatus] = useState<Status>("disconnected");
  const [activeClients, setActiveClients] = useState(0);
  const [recentEvents, setRecentEvents] = useState<RealtimeEvent[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  // Keep onEvent in a ref so connect() never needs it as a dependency
  const onEventRef = useRef(onEvent);
  useEffect(() => { onEventRef.current = onEvent; }, [onEvent]);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus("connecting");

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      setStatus("connected");
    };

    ws.onmessage = (e) => {
      if (!mountedRef.current) return;
      try {
        const msg: RealtimeMessage = JSON.parse(e.data);
        if (msg.type === "connected") {
          setActiveClients(msg.active_clients);
        } else if (msg.type === "event") {
          setRecentEvents((prev) => [msg.data, ...prev].slice(0, MAX_EVENTS));
          onEventRef.current?.(msg.data);
        }
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onerror = () => {
      if (!mountedRef.current) return;
      setStatus("error");
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setStatus("disconnected");
      wsRef.current = null;
      reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS);
    };
  }, []); // stable — no external deps

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const ping = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: "ping" }));
  }, []);

  return { status, activeClients, recentEvents, ping };
}
