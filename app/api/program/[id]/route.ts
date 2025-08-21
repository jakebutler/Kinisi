// app/api/program/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getProgramById } from "@/utils/programDataHelpers";
import { createSupabaseServerClient } from "@/utils/supabaseServer";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const awaited = await params;
    if (!awaited || !awaited.id) {
      console.error('[400] Missing id parameter');
      return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
    }
    const { id } = awaited;
    if (!id || typeof id !== "string" || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(id)) {
      // Not a valid UUID, treat as not found
      console.error('[404] Invalid UUID or missing id:', id);
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }
    let program;
    try {
      const supabase = await createSupabaseServerClient();
      program = await getProgramById(id, supabase);
      // Some Supabase clients throw, some return null, some return error with code/property
      if (!program || (program === null) || (typeof program === 'object' && ('error' in program) && program.error?.code === 'PGRST116')) {
        console.error('[404] Program not found for id:', id);
        return NextResponse.json({ error: "Program not found" }, { status: 404 });
      }
    } catch (e: unknown) {
      console.error('[500] Program fetch error:', e);
      // Check for various "not found" error shapes
      const message = e instanceof Error ? e.message : String(e);
      function hasCode(obj: unknown): obj is { code: string } {
        return typeof obj === 'object' && obj !== null && 'code' in obj && typeof (obj as Record<string, unknown>).code === 'string';
      }
      function hasStatus(obj: unknown): obj is { status: number } {
        return typeof obj === 'object' && obj !== null && 'status' in obj && typeof (obj as Record<string, unknown>).status === 'number';
      }
      const code = hasCode(e) ? e.code : undefined;
      const status = hasStatus(e) ? e.status : undefined;
      if (
        (message && message.toLowerCase().includes('not found')) ||
        (code && (code === 'PGRST116' || code === '404')) ||
        (status && status === 404)
      ) {
        return NextResponse.json({ error: "Program not found" }, { status: 404 });
      }
      return NextResponse.json({ error: "Failed to fetch program: " + message }, { status: 500 });
    }
    return NextResponse.json(program, { status: 200 });
  } catch (err: unknown) {
    console.error('[500] Unexpected error in GET /api/program/[id]:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Internal server error: " + message }, { status: 500 });
  }
}

