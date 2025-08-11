// app/api/exercises/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabaseServer";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { id } = await params; // await the params

    const { data: exercise, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to fetch exercise" }, { status: 500 });
    }

    if (!exercise) {
      return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
    }

    return NextResponse.json(exercise, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
