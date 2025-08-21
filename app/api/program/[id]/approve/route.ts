// app/api/program/[id]/approve/route.ts
import { NextRequest, NextResponse } from "next/server";
import { approveProgram, getProgramById } from "@/utils/programDataHelpers";
import { createSupabaseServerClient } from "@/utils/supabaseServer";

// Avoid static prerender during build; this route depends on runtime auth/env.
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = (await params) ?? ({} as { id?: string });
  try {
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Missing or invalid program ID" }, { status: 400 });
    }
    // Validate UUID format early
    const uuidRe = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
    if (!uuidRe.test(id)) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    // Authenticated server client
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ownership check
    const program = await getProgramById(id, supabase);
    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }
    if (program.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Approve under the user's session (RLS)
    let approved;
    try {
      approved = await approveProgram(id, supabase);
    } catch (e: unknown) {
      console.error('Failed to approve program:', e);
      return NextResponse.json({ error: "Failed to approve program" }, { status: 500 });
    }
    if (!approved) {
      return NextResponse.json({ error: "Program not found or not permitted" }, { status: 404 });
    }
    return NextResponse.json(approved, { status: 200 });
  } catch (err: unknown) {
    console.error('Unexpected error in POST /api/program/[id]/approve:', err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

