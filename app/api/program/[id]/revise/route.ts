// app/api/program/[id]/revise/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getProgramById, getAvailableExercises, updateProgramJson } from "@/utils/programDataHelpers";
import { buildProgramRevisionPrompt } from "@/utils/programPromptTemplate";
import { ProgramJson } from "@/types/fitness/Program";
import { ExerciseProgramPayload, Exercise } from "@/utils/types/programTypes";
import { callLLMWithPrompt } from "@/utils/llm";
import { createSupabaseServerClient } from "@/utils/supabaseServer";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params || ({} as { id?: string });

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Missing or invalid program ID" }, { status: 400 });
    }

    // Validate UUID (404 on invalid)
    const uuidRe = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
    if (!uuidRe.test(id)) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    // Authenticated server client and ownership check
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    const program = await getProgramById(id, supabase);
    if (!program || !program.program_json) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }
    if (program.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch available exercises (use filter if provided)
    let exercises: Exercise[] = [];
    try {
      exercises = await getAvailableExercises(exerciseFilter, supabase);
      if (!Array.isArray(exercises) || exercises.length === 0) {
        return NextResponse.json({ error: "No available exercises found for the given filter" }, { status: 404 });
      }
    } catch (e: unknown) {
      console.error('Failed to fetch exercises:', e);
      return NextResponse.json({ error: "Failed to fetch exercises" }, { status: 500 });
    }

    // Build revision prompt
    let prompt: string;
    try {
      prompt = buildProgramRevisionPrompt(program.program_json, feedback, exercises, assessment);
    } catch (e: unknown) {
      console.error('Failed to build revision prompt:', e);
      return NextResponse.json({ error: "Failed to build revision prompt" }, { status: 422 });
    }

    // Call LLM
    let revised: ExerciseProgramPayload;
    try {
      revised = await callLLMWithPrompt(prompt);
    } catch (e: unknown) {
      console.error('LLM call failed:', e);
      return NextResponse.json({ error: "LLM call failed" }, { status: 502 });
    }

    // Validate output
    const { validateProgramOutput } = await import("@/utils/validateProgramOutput");
    const validation = validateProgramOutput(revised);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error || "Invalid LLM output" }, { status: 422 });
    }

    // Convert ExerciseProgramPayload to ProgramJson format
    const programJson: ProgramJson = {
      weeks: revised.weeks.map((week: any) => ({
        weekNumber: week.week,
        goal: week.sessions[0]?.goal || `Week ${week.week}`,
        sessions: week.sessions.map((session: any) => ({
          id: session.uid,
          name: session.session.toString(),
          goal: session.goal,
          exercises: session.exercises.map((exercise: any) => ({
            id: exercise.exercise_id,
            name: exercise.exercise_id, // Use exercise_id as name since it's all we have
            sets: exercise.sets,
            reps: exercise.reps?.toString(),
            targetMuscles: [], // Would need to fetch from exercise data
            instructions: exercise.notes || ''
          }))
        }))
      }))
    };

    // Save update (set status back to draft for approval flow)
    let updated;
    try {
      updated = await updateProgramJson(id, programJson, "draft", supabase);
    } catch (e: unknown) {
      console.error('Failed to save revised program:', e);
      return NextResponse.json({ error: "Failed to save revised program" }, { status: 500 });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (err: unknown) {
    console.error('Unexpected error in POST /api/program/[id]/revise:', err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

