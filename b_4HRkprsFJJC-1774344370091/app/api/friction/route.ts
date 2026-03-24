import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { backendFetch } from "@/lib/backend-client";

export async function GET() {
  // Try FastAPI first
  try {
    const data = await backendFetch("/api/v1/friction");
    return NextResponse.json(data);
  } catch {
    // Fall back to direct DB
  }

  try {
    const db = getPool();
    const workspaceId = "default";

    const { rows } = await db.query(
      `WITH step_visitors AS (
          SELECT step, COUNT(DISTINCT session_id) as total_step_visitors
          FROM public.events
          WHERE workspace_id = $1
          GROUP BY step
      )
      SELECT
          e.field,
          e.step,
          COUNT(*) FILTER (WHERE e.event_type IN ('input_error', 'api_failure')) AS errors,
          sv.total_step_visitors AS visitors
      FROM public.events e
      JOIN step_visitors sv ON e.step = sv.step
      WHERE e.workspace_id = $1 AND e.field IS NOT NULL
      GROUP BY e.field, e.step, sv.total_step_visitors
      ORDER BY errors DESC`,
      [workspaceId]
    );

    const frictionData = rows.map((row) => {
      let severity = "Normal";
      if (row.errors > 10) severity = "Critical"; // Thresholds for MVP data
      else if (row.errors > 5) severity = "High";

      return {
        field: row.field,
        step: row.step,
        errors: row.errors,
        visitors: row.visitors,
        status: severity,
      };
    });

    return NextResponse.json(frictionData);
  } catch (err: any) {
    console.error("[friction] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
