import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { backendFetch } from "@/lib/backend-client";

export async function GET() {
  // Try FastAPI first — uses rule-based AI scoring
  try {
    const data = await backendFetch<any[]>("/api/v1/insights");
    // Normalize FastAPI shape to frontend model
    const mapped = data.map((i: any) => ({
      id: i.id ?? null,
      reason: i.reason,
      description: i.description,
      impactScore: i.impact_score,
      potentialLift: i.potential_lift,
      status: i.status,
      effort: i.effort,
      category: i.category,
    }));
    return NextResponse.json(mapped);
  } catch {
    // Fall back to Supabase insights table
  }

  const supabase = createAdminClient();

  const { data: insights, error } = await supabase
    .from("insights")
    .select("*")
    .eq("workspace_id", "default")
    .order("impact_score", { ascending: false });

  if (error) {
    console.error("Supabase insights error:", error);
    return NextResponse.json({ error: "Failed to fetch insights" }, { status: 500 });
  }

  // Map database fields to the frontend model
  const mappedInsights = (insights || []).map((i: any) => ({
    id: i.id,
    reason: i.reason,
    description: i.description,
    impactScore: i.impact_score,
    potentialLift: i.potential_lift,
    status: i.status,
    effort: i.effort,
    category: i.category,
  }));

  return NextResponse.json(mappedInsights);
}
