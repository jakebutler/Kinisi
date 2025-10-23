// app/api/program/[id]/schedule/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabaseServer";
import { getProgramById, updateProgramFields } from "@/utils/programDataHelpers";
import { scheduleProgram, type SchedulingPreferences } from "@/utils/scheduling";
import { ProgramJson } from "@/types/fitness/Program";
import { ExerciseProgramPayload } from "@/utils/types/programTypes";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = (await params) ?? ({} as { id?: string });
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Missing or invalid program ID" }, { status: 400 });
    }
    const uuidRe = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
    if (!uuidRe.test(id)) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const program = await getProgramById(id, supabase);
    if (!program) return NextResponse.json({ error: "Program not found" }, { status: 404 });
    if (program.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const startDate: string | undefined = typeof body.startDate === 'string' ? body.startDate : program.start_date || undefined;
    const preferences: SchedulingPreferences | undefined = body.preferences && typeof body.preferences === 'object' ? body.preferences : undefined;

    const programJson = program.program_json || {};
    const { updated, appliedPreferences } = scheduleProgram(programJson, startDate, preferences);

    // Convert ExerciseProgramPayload to ProgramJson format if needed
    let finalUpdated: ProgramJson;
    if ('weeks' in updated && Array.isArray(updated.weeks) && updated.weeks.length > 0 && 'week' in updated.weeks[0]) {
      // This is ExerciseProgramPayload format, convert to ProgramJson
      const updatedPayload = updated as unknown as ExerciseProgramPayload;
      finalUpdated = {
        weeks: updatedPayload.weeks.map((week: any) => ({
          weekNumber: week.week,
          goal: week.sessions[0]?.goal || `Week ${week.week}`,
          sessions: week.sessions.map((session: any) => ({
            id: session.uid,
            name: session.session.toString(),
            goal: session.goal,
            exercises: session.exercises.map((exercise: any) => ({
              id: exercise.exercise_id,
              name: exercise.exercise_id,
              sets: exercise.sets,
              reps: exercise.reps?.toString(),
              targetMuscles: [],
              instructions: exercise.notes || ''
            }))
          }))
        }))
      };
    } else {
      // Already in ProgramJson format
      finalUpdated = updated as unknown as ProgramJson;
    }

    const saved = await updateProgramFields(id, {
      program_json: finalUpdated,
      scheduling_preferences: appliedPreferences,
      last_scheduled_at: new Date().toISOString(),
    }, supabase);

    return NextResponse.json(saved, { status: 200 });
  } catch (err: unknown) {
    console.error('Unexpected error in POST /api/program/[id]/schedule:', err);
    return NextResponse.json({ error: "Failed to schedule program" }, { status: 500 });
  }
}
