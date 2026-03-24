import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const eventSchema = z.object({
  type: z.enum([
    "page_view",
    "field_focus",
    "field_blur",
    "input_error",
    "back_navigation",
    "exit",
    "idle_timeout",
    "api_failure",
  ]),
  stepId: z.string(),
  fieldId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  sessionId: z.string(),
  timestamp: z.string().datetime(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = eventSchema.parse(body);

    const supabase = createAdminClient();
    
    const { error: insertError } = await supabase.from("events").insert({
      type: validatedData.type,
      step_id: validatedData.stepId,
      field_id: validatedData.fieldId,
      session_id: validatedData.sessionId,
      metadata: validatedData.metadata,
      timestamp: validatedData.timestamp,
    });

    if (insertError) {
      console.error("Supabase insert error:", insertError);
      return NextResponse.json(
        { success: false, error: "Failed to log event to database" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Event logged to Supabase" });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: err.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
