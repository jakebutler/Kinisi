// app/api/program/[id]/feedback/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getProgramById, saveProgramFeedback } from "@/utils/programDataHelpers";
import { createSupabaseServerClient } from "@/utils/supabaseServer";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = (await params) || ({} as { id?: string });
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Missing or invalid program ID" }, { status: 400 });
    }
    // Validate UUID format (404 for invalid)
    const uuidRe = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
    if (!uuidRe.test(id)) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }
    const { feedback, session_id } = (body || {}) as { feedback?: string; session_id?: string };
    if (!feedback || typeof feedback !== "string") {
      return NextResponse.json({ error: "Missing or invalid feedback" }, { status: 400 });
    }

    // Authenticated server client
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Look up program to derive owner (user_id) and current revision under RLS
    const program = await getProgramById(id, supabase);
    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }
    if (program.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
      }, supabase);
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

