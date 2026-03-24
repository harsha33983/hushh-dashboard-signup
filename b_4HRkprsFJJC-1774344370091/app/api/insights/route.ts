import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
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
