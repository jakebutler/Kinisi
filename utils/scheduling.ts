// utils/scheduling.ts
import type { ExerciseProgramPayload, ProgramSession } from "./types/programTypes";

export type SchedulingPreferences = {
  timezone?: string; // IANA timezone string, e.g., "America/Los_Angeles"
  daysOfWeek?: number[]; // 0-6, Sunday=0
  default_time?: string; // "HH:mm" 24h
  default_duration_minutes?: number; // fallback if session.duration_minutes absent
};

function pad(n: number) { return n.toString().padStart(2, "0"); }

function formatLocalISO(date: Date, time: string): string {
  // Returns an ISO-like string without timezone (treated as local wall time)
  const [hh, mm] = time.split(":");
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), parseInt(hh || "8", 10), parseInt(mm || "0", 10), 0, 0);
  // YYYY-MM-DDTHH:mm
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function generateSessionUID(weekIndex: number, sessionIndex: number) {
  return `w${weekIndex + 1}s${sessionIndex + 1}`;
}

export function scheduleProgram(
  program: ExerciseProgramPayload,
  startDate?: string,
  prefs?: SchedulingPreferences
): { updated: ExerciseProgramPayload; appliedPreferences: SchedulingPreferences; scheduledCount: number } {
  const preferences: SchedulingPreferences = {
    default_time: "08:00",
    default_duration_minutes: 60,
    ...(prefs || {})
  };
  const base = startDate ? new Date(startDate) : new Date();
  // Normalize to start of day
  base.setHours(0, 0, 0, 0);

  let cursor = new Date(base);
  const days = Array.isArray(preferences.daysOfWeek) && preferences.daysOfWeek.length > 0 ? preferences.daysOfWeek : undefined;

  let scheduledCount = 0;
  const updated: ExerciseProgramPayload = {
    weeks: (program.weeks || []).map((w, wi) => ({
      ...w,
      sessions: (w.sessions || []).map((s, si) => {
        let nextDate = new Date(cursor);
        if (days) {
          // advance to next allowed day
          while (!days.includes(nextDate.getDay())) {
            nextDate.setDate(nextDate.getDate() + 1);
          }
        }
        const start_at = formatLocalISO(nextDate, preferences.default_time || "08:00");
        const uid = s.uid || generateSessionUID(wi, si);
        const duration = typeof s.duration_minutes === "number" ? s.duration_minutes : (preferences.default_duration_minutes || 60);
        // advance cursor by 1 day for next session
        cursor = new Date(nextDate);
        cursor.setDate(cursor.getDate() + 1);
        scheduledCount += 1;
        const session: ProgramSession = {
          ...s,
          uid,
          start_at,
          duration_minutes: duration,
        };
        return session;
      })
    }))
  };

  return { updated, appliedPreferences: preferences, scheduledCount };
}

export function shiftProgramSchedule(
  program: ExerciseProgramPayload,
  shiftDays: number = 0,
  shiftMinutes: number = 0
): { updated: ExerciseProgramPayload; shiftedCount: number } {
  const updated: ExerciseProgramPayload = {
    weeks: (program.weeks || []).map((w) => ({
      ...w,
      sessions: (w.sessions || []).map((s) => {
        if (!s.start_at) return s;
        const d = new Date(s.start_at);
        if (!isNaN(shiftDays)) d.setDate(d.getDate() + shiftDays);
        if (!isNaN(shiftMinutes)) d.setMinutes(d.getMinutes() + shiftMinutes);
        const yyyy = d.getFullYear();
        const mm = pad(d.getMonth() + 1);
        const dd = pad(d.getDate());
        const hh = pad(d.getHours());
        const mi = pad(d.getMinutes());
        const newStart = `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
        return { ...s, start_at: newStart };
      })
    }))
  };
  const shiftedCount = (program.weeks || []).reduce((acc, w) => acc + (w.sessions || []).filter(s => !!s.start_at).length, 0);
  return { updated, shiftedCount };
}

export function updateSessionStart(
  program: ExerciseProgramPayload,
  uid: string,
  newStartAt: string
): { updated: ExerciseProgramPayload; updatedCount: number } {
  let updatedCount = 0;
  const updated: ExerciseProgramPayload = {
    weeks: (program.weeks || []).map((w) => ({
      ...w,
      sessions: (w.sessions || []).map((s) => {
        if (s.uid === uid) {
          updatedCount += 1;
          return { ...s, start_at: newStartAt };
        }
        return s;
      })
    }))
  };
  return { updated, updatedCount };
}

export function updateSessionDuration(
  program: ExerciseProgramPayload,
  uid: string,
  newDurationMinutes: number
): { updated: ExerciseProgramPayload; updatedCount: number } {
  let updatedCount = 0;
  const duration = Number.isFinite(newDurationMinutes) && newDurationMinutes > 0 ? Math.round(newDurationMinutes) : undefined;
  if (!duration) return { updated: program, updatedCount };
  const updated: ExerciseProgramPayload = {
    weeks: (program.weeks || []).map((w) => ({
      ...w,
      sessions: (w.sessions || []).map((s) => {
        if (s.uid === uid) {
          updatedCount += 1;
          return { ...s, duration_minutes: duration };
        }
        return s;
      })
    }))
  };
  return { updated, updatedCount };
}
