// app/api/program/[id]/revise/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getProgramById, getAvailableExercises, updateProgramJson } from "@/utils/programDataHelpers";
import { buildProgramRevisionPrompt } from "@/utils/programPromptTemplate";
import { Exercise, ExerciseProgramPayload } from "@/utils/types/programTypes";
import { callLLMWithPrompt } from "@/utils/llm";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Missing or invalid program ID" }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json({ error: "Request body must be an object" }, { status: 400 });
    }

    const { feedback, exerciseFilter, assessment } = body as {
      feedback?: string;
      exerciseFilter?: { primary_muscles?: string[]; equipment?: string[] };
      assessment?: string;
    };

    if (!feedback || typeof feedback !== "string") {
      return NextResponse.json({ error: "Feedback is required and must be a string" }, { status: 400 });
    }

    // Load current program
    const program = await getProgramById(id);
    if (!program || !program.program_json) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    // Fetch available exercises (use filter if provided)
    let exercises: Exercise[] = [];
    try {
      exercises = await getAvailableExercises(exerciseFilter);
      if (!Array.isArray(exercises) || exercises.length === 0) {
        return NextResponse.json({ error: "No available exercises found for the given filter" }, { status: 404 });
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      return NextResponse.json({ error: "Failed to fetch exercises: " + message }, { status: 500 });
    }

    // Build revision prompt
    let prompt: string;
    try {
      prompt = buildProgramRevisionPrompt(program.program_json, feedback, exercises, assessment);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      return NextResponse.json({ error: "Failed to build revision prompt: " + message }, { status: 422 });
    }

    // Call LLM
    let revised: ExerciseProgramPayload;
    try {
      revised = await callLLMWithPrompt(prompt);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      return NextResponse.json({ error: "LLM call failed: " + message }, { status: 502 });
    }

    // Validate output
    const { validateProgramOutput } = await import("@/utils/validateProgramOutput");
    const validation = validateProgramOutput(revised);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error || "Invalid LLM output" }, { status: 422 });
    }

    // Save update (set status back to draft for approval flow)
    let updated;
    try {
      updated = await updateProgramJson(id, revised, "draft");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      return NextResponse.json({ error: "Failed to save revised program: " + message }, { status: 500 });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
