import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabaseClient";
import { handleErrorResponse } from "@/utils/errorHandling";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const paramsValue = await params;
    const { id } = paramsValue;
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Missing or invalid program ID" }, { status: 400 });
    }
    const { startDate } = await req.json();
    if (!startDate || typeof startDate !== "string") {
      return NextResponse.json({ error: "Missing or invalid startDate" }, { status: 400 });
    }
    const { data, error } = await supabase
      .from("exercise_programs")
      .update({ start_date: startDate })
      .eq("id", id)
      .select();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data?.[0] || {}, { status: 200 });
  } catch (err: unknown) {
    return handleErrorResponse(err, 500);
  }
}
