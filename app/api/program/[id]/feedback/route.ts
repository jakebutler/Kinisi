// app/api/program/[id]/feedback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getProgramById, saveProgramFeedback } from "@/utils/programDataHelpers";

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
    // Look up program to derive owner (user_id) and current revision
    const program = await getProgramById(id);
    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }
    const user_id = program.user_id as string;
    const revision = typeof program.revision === 'number' ? program.revision : 1;
    let saved;
    try {
      saved = await saveProgramFeedback({
        program_id: id,
        session_id,
        user_id,
        feedback,
        revision
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      return NextResponse.json({ error: "Failed to save feedback: " + message }, { status: 500 });
    }
    const resp = saved
      ? {
          id: saved.id,
          program_id: saved.program_id,
          session_id: saved.session_id ?? null,
          user_id: saved.user_id,
          feedback: saved.feedback,
          revision: saved.revision,
          created_at: saved.created_at,
        }
      : { ok: true };
    return NextResponse.json(resp, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
