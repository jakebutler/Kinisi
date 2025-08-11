// app/api/program/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { buildProgramPrompt } from "@/utils/programPromptTemplate";
import { Exercise, ExerciseProgramPayload } from "@/utils/types/programTypes";
import { getAvailableExercises, saveExerciseProgram } from "@/utils/programDataHelpers";
import { callLLMWithPrompt } from "@/utils/llm";
import { createSupabaseServerClient } from "@/utils/supabaseServer";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { assessmentId, exerciseFilter } = await req.json();

    if (!assessmentId || typeof assessmentId !== 'string') {
      return NextResponse.json(
        { error: "assessmentId is required and must be a string" },
        { status: 400 }
      );
    }

    if (exerciseFilter === undefined || typeof exerciseFilter !== 'object' || exerciseFilter === null) {
      return NextResponse.json(
        { error: "exerciseFilter is required and must be an object" },
        { status: 400 }
      );
    }

    const { data: assessmentData, error: assessmentError } = await supabase
      .from('assessments')
      .select('assessment')
      .eq('id', assessmentId)
      .single();

    if (assessmentError) {
      return NextResponse.json({ error: "Failed to fetch assessment" }, { status: 500 });
    }

    const assessment = assessmentData.assessment;

    const exercises: Exercise[] = await getAvailableExercises(exerciseFilter, supabase);
    if (!Array.isArray(exercises) || exercises.length === 0) {
      return NextResponse.json(
        { error: "No available exercises found for the given filter" },
        { status: 404 }
      );
    }

    const prompt = buildProgramPrompt(assessment, exercises);

    const llmResponse: ExerciseProgramPayload = await callLLMWithPrompt(prompt);

    const { validateProgramOutput } = await import("@/utils/validateProgramOutput");
    const validation = validateProgramOutput(llmResponse);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || "Invalid LLM output" },
        { status: 422 }
      );
    }

    const saved = await saveExerciseProgram({
      user_id: user.id,
      program_json: llmResponse,
      status: "draft"
    }, supabase);

    return NextResponse.json(saved, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Internal server error: " + message },
      { status: 500 }
    );
  }
}
