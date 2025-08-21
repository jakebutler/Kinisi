// app/api/program/[id]/schedule/feedback/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabaseServer";
import { getProgramById, updateProgramFields } from "@/utils/programDataHelpers";
import { scheduleProgram, shiftProgramSchedule, updateSessionStart, updateSessionDuration, type SchedulingPreferences } from "@/utils/scheduling";

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
    const { startDate, preferences, shiftDays, shiftMinutes, uid, newStartAt, deltaMinutes, newDurationMinutes } = body || {} as {
      startDate?: string;
      preferences?: SchedulingPreferences;
      shiftDays?: number;
      shiftMinutes?: number;
      uid?: string;
      newStartAt?: string;
      deltaMinutes?: number;
      newDurationMinutes?: number;
    };

    const programJson = program.program_json || {};

    let updatedJson = programJson;
    let appliedPreferences: SchedulingPreferences | undefined;

    if (uid && typeof newDurationMinutes === 'number') {
      const { updated, updatedCount } = updateSessionDuration(programJson, uid, newDurationMinutes);
      if (!updatedCount) {
        return NextResponse.json({ error: "No session updated" }, { status: 400 });
      }
      updatedJson = updated;
    } else if (uid && (typeof newStartAt === 'string' || typeof deltaMinutes === 'number')) {
      // Single-session update path (drag/drop or resize)
      let targetStart: string | undefined = newStartAt;
      if (!targetStart && typeof deltaMinutes === 'number') {
        // Find the session current start_at by uid and compute new time
        const weeks = Array.isArray(programJson?.weeks) ? programJson.weeks : [];
        let foundStart: string | undefined;
        for (const w of weeks) {
          for (const s of (w.sessions || [])) {
            if (s?.uid === uid && s?.start_at) {
              foundStart = s.start_at;
              break;
            }
          }
          if (foundStart) break;
        }
        if (!foundStart) {
          return NextResponse.json({ error: "Session not found or not scheduled" }, { status: 400 });
        }
        const d = new Date(foundStart);
        d.setMinutes(d.getMinutes() + (deltaMinutes || 0));
        const pad = (n: number) => n.toString().padStart(2, '0');
        targetStart = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      }
      const { updated, updatedCount } = updateSessionStart(programJson, uid, targetStart as string);
      if (!updatedCount) {
        return NextResponse.json({ error: "No session updated" }, { status: 400 });
      }
      updatedJson = updated;
    } else if (typeof shiftDays === 'number' || typeof shiftMinutes === 'number') {
      const { updated } = shiftProgramSchedule(programJson, shiftDays || 0, shiftMinutes || 0);
      updatedJson = updated;
    } else {
      const res = scheduleProgram(programJson, startDate || program.start_date, preferences);
      updatedJson = res.updated;
      appliedPreferences = res.appliedPreferences;
    }

    const saved = await updateProgramFields(id, {
      program_json: updatedJson,
      ...(appliedPreferences ? { scheduling_preferences: appliedPreferences } : {}),
      last_scheduled_at: new Date().toISOString(),
    }, supabase);

    return NextResponse.json(saved, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Failed to update schedule: " + message }, { status: 500 });
  }
}
