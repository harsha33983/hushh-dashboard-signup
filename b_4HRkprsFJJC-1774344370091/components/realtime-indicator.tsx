"use client";

import { useRealtime, type RealtimeEvent } from "@/hooks/use-realtime";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

/**
 * RealtimeIndicator
 *
 * Drop-in component that:
 *  1. Shows a live connection status dot in the header
 *  2. Invalidates TanStack Query caches when new events arrive
 *     (so existing queries re-fetch automatically — no polling changes needed)
 */
export function RealtimeIndicator() {
  const queryClient = useQueryClient();

  const { status, activeClients } = useRealtime(
    (_event: RealtimeEvent) => {
      // Invalidate relevant queries so the dashboard refreshes live
      queryClient.invalidateQueries({ queryKey: ["funnel"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
      queryClient.invalidateQueries({ queryKey: ["friction"] });
    }
  );

  const isLive = status === "connected";

  return (
    <div
      className="flex items-center gap-1.5 text-xs text-muted-foreground"
      title={`WebSocket: ${status}${isLive ? ` · ${activeClients} client(s)` : ""}`}
    >
      <span
        className={cn(
          "size-2 rounded-full",
          isLive
            ? "bg-emerald-500 animate-pulse"
            : status === "connecting"
            ? "bg-amber-400 animate-pulse"
            : "bg-muted-foreground/40"
        )}
      />
      <span className="hidden sm:inline">
        {isLive ? "Live" : status === "connecting" ? "Connecting…" : "Offline"}
      </span>
    </div>
  );
}
