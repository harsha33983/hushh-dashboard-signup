import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { backendFetch } from "@/lib/backend-client";

const stepDefs = [
  { stepId: "step-1", name: "Email & Password",    avgTime: "1m 02s" },
  { stepId: "step-2", name: "Personal Details",    avgTime: "1m 41s" },
  { stepId: "step-3", name: "Phone Verification",  avgTime: "2m 18s" },
  { stepId: "step-4", name: "Complete",             avgTime: "0m 15s" },
];

export async function GET() {
  // Try FastAPI first — richer analytics
  try {
    const data = await backendFetch<{ steps: any[]; total_sessions: number }>("/api/v1/funnel");
    // Normalize FastAPI shape to match what the frontend expects
    const steps = data.steps ?? [];
    const baseVisitors = steps[0]?.visitor_count || 1;
    const result = steps.map((step: any, index: number) => {
      const prev = steps[index - 1];
      const next = steps[index + 1];
      const dropOffRate = prev && prev.visitor_count > 0
        ? Math.max(0, Math.round(((prev.visitor_count - step.visitor_count) / prev.visitor_count) * 100))
        : 0;
      return {
        stepId: step.step,
        name: step.name,
        visitors: step.visitor_count,
        conversions: next?.visitor_count ?? step.visitor_count,
        dropOffRate,
        conversionFromTop: Math.round((step.visitor_count / baseVisitors) * 100),
        avgTime: stepDefs.find((s) => s.stepId === step.step)?.avgTime ?? "—",
      };
    });
    return NextResponse.json(result);
  } catch {
    // FastAPI unavailable — fall back to direct DB queries
  }

  try {
    const db = getPool();

    const workspaceId = "default";
    const funnelMetrics = await Promise.all(
      stepDefs.map(async (step) => {
        try {
          const { rows } = await db.query(
            `SELECT COUNT(DISTINCT session_id)::int AS count
             FROM public.events
             WHERE step = $1 AND event_type = 'page_view' AND workspace_id = $2`,
            [step.stepId, workspaceId]
          );
          const count = rows[0]?.count ?? 0;
          console.log(`[funnels] ${step.stepId}: ${count}`);
          return { ...step, visitors: count };
        } catch (err: any) {
          console.error(`[funnels] Error for ${step.stepId}:`, err.message);
          return { ...step, visitors: 0 };
        }
      })
    );

    const baseVisitors = funnelMetrics[0]?.visitors || 1;

    const result = funnelMetrics.map((step, index) => {
      const prevStep = funnelMetrics[index - 1];
      const nextStep = funnelMetrics[index + 1];

      const dropOffRate =
        prevStep && prevStep.visitors > 0
          ? Math.max(0, Math.round(((prevStep.visitors - step.visitors) / prevStep.visitors) * 100))
          : 0;

      return {
        stepId: step.stepId,
        name: step.name,
        visitors: step.visitors,
        conversions: nextStep?.visitors ?? step.visitors,
        dropOffRate,
        conversionFromTop: Math.round((step.visitors / baseVisitors) * 100),
        avgTime: step.avgTime,
      };
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[funnels] Fatal error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
