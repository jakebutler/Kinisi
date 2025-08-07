// app/api/program/[id]/feedback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { saveProgramFeedback } from "@/utils/programDataHelpers";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const paramsValue = await params;
    const { id } = paramsValue;
    const { feedback, session_id } = await req.json();
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Missing or invalid program ID" }, { status: 400 });
    }
    if (!feedback || typeof feedback !== "string") {
      return NextResponse.json({ error: "Missing or invalid feedback" }, { status: 400 });
    }
    // TODO: Replace with actual user_id from auth
    const user_id = "demo-user";
    let saved;
    try {
      saved = await saveProgramFeedback({
        program_id: id,
        session_id,
        user_id,
        feedback
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      return NextResponse.json({ error: "Failed to save feedback: " + message }, { status: 500 });
    }
    return NextResponse.json(saved, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
