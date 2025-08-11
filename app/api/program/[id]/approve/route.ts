// app/api/program/[id]/approve/route.ts
import { NextRequest, NextResponse } from "next/server";
import { approveProgram } from "@/utils/programDataHelpers";
import { handleErrorResponse } from "@/utils/errorHandling";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const paramsValue = await params;
  const { id } = paramsValue;
  try {
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Missing or invalid program ID" }, { status: 400 });
    }
    let approved;
    try {
      approved = await approveProgram(id);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      return NextResponse.json({ error: "Failed to approve program: " + message }, { status: 500 });
    }
    return NextResponse.json(approved, { status: 200 });
  } catch (err: unknown) {
    return handleErrorResponse(err, 400);
  }
}
