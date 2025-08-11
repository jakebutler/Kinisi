// app/api/program/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { buildProgramPrompt } from "@/utils/programPromptTemplate";
import { Exercise, ExerciseProgramPayload } from "@/utils/types/programTypes";
import { getAvailableExercises } from "@/utils/programDataHelpers";
import { callLLMWithPrompt } from "@/utils/llm";
import { createSupabaseServerClient } from "@/utils/supabaseServer";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Debug environment
    console.log('🔧 Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      hasLLMConfig: !!process.env.OPENAI_API_KEY,
      timestamp: new Date().toISOString()
    });
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('[400] JSON parse error:', parseError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { assessment, exerciseFilter, userId } = body;

    // Validate assessment
    if (!assessment || typeof assessment !== 'string') {
      console.error('[400] Missing or invalid assessment:', { assessment, type: typeof assessment });
      return NextResponse.json(
        { error: "Assessment is required and must be a string" },
        { status: 400 }
      );
    }

    // Validate exerciseFilter
    if (exerciseFilter === undefined || typeof exerciseFilter !== 'object' || exerciseFilter === null) {
      console.error('[400] Missing or invalid exerciseFilter:', { exerciseFilter, type: typeof exerciseFilter });
      return NextResponse.json(
        { error: "ExerciseFilter is required and must be an object" },
        { status: 400 }
      );
    }

    // Validate userId (temporary until auth context is wired here)
    if (!userId || typeof userId !== 'string') {
      console.error('[400] Missing or invalid userId:', { userId, type: typeof userId });
      return NextResponse.json(
        { error: "userId is required and must be a string" },
        { status: 400 }
      );
    }

    // Build authenticated Supabase client from cookies for RLS-protected reads
    const supabase = await createSupabaseServerClient();

    // Fetch available exercises
    let exercises: Exercise[] = [];
    try {
      exercises = await getAvailableExercises(exerciseFilter, supabase);
      if (!Array.isArray(exercises) || exercises.length === 0) {
        console.error('[404] No exercises found for filter:', exerciseFilter);
        return NextResponse.json(
          { error: "No available exercises found for the given filter" },
          { status: 404 }
        );
      }
      console.log('✅ Found exercises:', exercises.length);
    } catch (e: unknown) {
      console.error('[500] Failed to fetch exercises:', e);
      const message = e instanceof Error ? e.message : String(e);
      return NextResponse.json(
        { error: "Failed to fetch exercises: " + message },
        { status: 500 }
      );
    }

    // Build LLM prompt
    let prompt;
    try {
      prompt = buildProgramPrompt(assessment, exercises);
      console.log('✅ Built LLM prompt');
    } catch (ex) {
      console.error('[422] Prompt build error:', ex);
      return NextResponse.json(
        { error: "Failed to build LLM prompt" },
        { status: 422 }
      );
    }

    // Call LLM service
    let llmResponse: ExerciseProgramPayload;
    try {
      console.log('🤖 Calling LLM service...');
      llmResponse = await callLLMWithPrompt(prompt);
      console.log('✅ LLM service responded:', { hasWeeks: !!llmResponse?.weeks });
    } catch (e: unknown) {
      console.error('[502] LLM service error:', e);
      const message = e instanceof Error ? e.message : String(e);
      return NextResponse.json(
        { error: "LLM call failed: " + message },
        { status: 502 }
      );
    }

    // Validate LLM output
    const { validateProgramOutput } = await import("@/utils/validateProgramOutput");
    const validation = validateProgramOutput(llmResponse);
    if (!validation.valid) {
      console.error('[422] Invalid LLM output:', validation.error);
      return NextResponse.json(
        { error: validation.error || "Invalid LLM output" },
        { status: 422 }
      );
    }

    // Save generated program to Supabase
    // TODO: Replace with user_id from auth context rather than request body
    const user_id = userId as string;
    const { saveExerciseProgram } = await import("@/utils/programDataHelpers");
    try {
      const saved = await saveExerciseProgram({
        user_id,
        program_json: llmResponse,
        status: "draft"
      }, supabase);
      console.log('✅ Program saved successfully:', { id: saved.id });
      return NextResponse.json(saved, { status: 201 });
    } catch (e: unknown) {
      console.error('[500] Failed to save program:', e);
      const message = e instanceof Error ? e.message : String(e);
      return NextResponse.json(
        { error: "Failed to save program: " + message },
        { status: 500 }
      );
    }
  } catch (err: unknown) {
    console.error('[500] Unexpected error in POST /api/program/create:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Internal server error: " + message },
      { status: 500 }
    );
  }
}