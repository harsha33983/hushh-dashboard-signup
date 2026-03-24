import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface EventRecord {
  id: string;
  type: string;
  step_id: string;
  field_id: string | null;
  session_id: string;
  metadata: Record<string, any> | null;
  timestamp: string;
}

export async function GET() {
  const supabase = createAdminClient();

  const { data: events, error } = await supabase
    .from("events")
    .select("*")
    .eq("workspace_id", "default")
    .order("timestamp", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Supabase sessions error:", error);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }

  const typedEvents = (events || []) as any[];

  const sessionIds = Array.from(new Set(typedEvents.map((e) => e.session_id)));

  const sessions = sessionIds.map((sid) => {
    const sessionEvents = typedEvents.filter((e) => e.session_id === sid);
    const lastEvent = sessionEvents[0];

    const hasError = sessionEvents.some(
      (e) => e.event_type === "input_error" || e.event_type === "api_failure"
    );
    const isStationary = sessionEvents.length < 3;

    return {
      id: sid,
      displayId: sid.substring(0, 8),
      lastStep: `Step ${lastEvent.step}`,
      dropType: hasError ? "Friction drop" : isStationary ? "Hard drop" : "Soft drop",
      signal: hasError ? "Multiple validation/API errors" : "Exit before completion",
      device: lastEvent.metadata?.device || "Desktop",
      time: lastEvent.timestamp,
      severity: hasError ? "critical" : "medium",
    };
  });

  return NextResponse.json(sessions);
}
