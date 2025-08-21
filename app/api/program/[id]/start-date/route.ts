import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { createSupabaseServerClient } from "@/utils/supabaseServer";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = (await params) || ({} as { id?: string });
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Missing or invalid program ID" }, { status: 400 });
    }
    // UUID validation -> 404 on invalid
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
    const { startDate } = (body || {}) as { startDate?: string };
    if (typeof startDate !== "string" || !startDate.trim() || Number.isNaN(Date.parse(startDate))) {
      return NextResponse.json({ error: "Missing or invalid startDate (expected ISO 8601 string)" }, { status: 400 });
    }
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { data, error } = await supabase
      .from("exercise_programs")
      .update({ start_date: startDate })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id, start_date")
      .maybeSingle();
    if (error) {
      console.error('[500] start-date update error:', error);
      return NextResponse.json({ error: "Failed to update start date" }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }
    return NextResponse.json({ id: data.id, start_date: data.start_date }, { status: 200 });
  } catch (err: unknown) {
    console.error('[500] start-date unexpected error:', err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

