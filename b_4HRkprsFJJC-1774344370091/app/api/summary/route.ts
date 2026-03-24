import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function GET() {
  const db = getPool();

  const workspaceId = "default"; // For MVP

  const [
    { rows: sessionRows },
    { rows: step1Rows },
    { rows: step4Rows },
    { rows: alertRows },
    { rows: durationRows },
    { rows: activeRows },
    { rows: deviceRows },
  ] = await Promise.all([
    db.query(`SELECT COUNT(DISTINCT session_id) AS total FROM public.events WHERE workspace_id = $1`, [workspaceId]),
    db.query(`SELECT COUNT(DISTINCT session_id) AS cnt FROM public.events WHERE step = 'step-1' AND event_type = 'page_view' AND workspace_id = $1`, [workspaceId]),
    db.query(`SELECT COUNT(DISTINCT session_id) AS cnt FROM public.events WHERE step = 'step-4' AND event_type = 'page_view' AND workspace_id = $1`, [workspaceId]),
    db.query(`SELECT COUNT(*) AS cnt FROM public.alerts WHERE status = 'active' AND workspace_id = $1`, [workspaceId]),
    db.query(`
      WITH session_times AS (
        SELECT session_id, MIN(timestamp) as start_t, MAX(timestamp) as end_t
        FROM public.events
        WHERE workspace_id = $1
        GROUP BY session_id
        HAVING COUNT(DISTINCT step) >= 4
      )
      SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (end_t - start_t)) / 60), 0) AS avg_duration FROM session_times
    `, [workspaceId]),
    db.query(`SELECT COUNT(DISTINCT session_id) AS cnt FROM public.events WHERE timestamp > now() - interval '5 minutes' AND workspace_id = $1`, [workspaceId]),
    db.query(`
      SELECT 
        (COUNT(DISTINCT session_id) FILTER (WHERE (metadata->>'device')::text ILIKE '%mobile%'))::float / NULLIF(COUNT(DISTINCT session_id), 0) * 100 AS mobile_pct
      FROM public.events 
      WHERE workspace_id = $1
    `, [workspaceId]),
  ]);

  const totalSessions  = parseInt(sessionRows[0]?.total ?? "0", 10);
  const started        = parseInt(step1Rows[0]?.cnt    ?? "0", 10);
  const completed      = parseInt(step4Rows[0]?.cnt    ?? "0", 10);
  const activeAlerts   = parseInt(alertRows[0]?.cnt    ?? "0", 10);
  const activeNow      = parseInt(activeRows[0]?.cnt   ?? "0", 10);
  const mobilePct      = Math.round(parseFloat(deviceRows[0]?.mobile_pct ?? "60"));
  const avgDuration    = parseFloat(durationRows[0]?.avg_duration ?? "0");
  const completionRate = started > 0 ? Math.round((completed / started) * 100) : 0;

  return NextResponse.json({
    completion_rate: completionRate,
    total_sessions:  totalSessions,
    avg_duration_minutes: avgDuration,
    active_alerts:   activeAlerts,
    active_now:      activeNow,
    mobile_pct:      mobilePct,
    desktop_pct:     100 - mobilePct,
  });
}
