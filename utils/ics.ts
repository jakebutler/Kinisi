// utils/ics.ts
import type { ExerciseProgramPayload, ProgramSession } from "./types/programTypes";

function formatDateForICS(isoLocal: string, durationMinutes: number = 60): { dtStart: string; dtEnd: string } {
  // isoLocal expected as YYYY-MM-DDTHH:mm (no timezone). Treat as local and export as floating time.
  const [datePart, timePart] = isoLocal.split("T");
  const [yyyy, mm, dd] = datePart.split("-");
  const [hh, mi] = (timePart || "00:00").split(":");
  const start = new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(mi), 0);
  const end = new Date(start.getTime() + durationMinutes * 60000);
  const pad = (n: number) => n.toString().padStart(2, "0");
  const fmt = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  return { dtStart: fmt(start), dtEnd: fmt(end) };
}

export function buildGoogleCalendarUrl({ title, details, location, start_at, duration_minutes = 60 }: {
  title: string;
  details?: string;
  location?: string;
  start_at: string; // YYYY-MM-DDTHH:mm
  duration_minutes?: number;
}) {
  const { dtStart, dtEnd } = formatDateForICS(start_at, duration_minutes);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    details: details || "",
    location: location || "",
    dates: `${dtStart}/${dtEnd}`,
  });
  return `https://www.google.com/calendar/render?${params.toString()}`;
}

export function buildICSSession(session: ProgramSession, opts?: { titlePrefix?: string; location?: string; description?: string }) {
  if (!session.start_at) return null;
  const { dtStart, dtEnd } = formatDateForICS(session.start_at, session.duration_minutes || 60);
  const uid = session.uid || `session-${dtStart}`;
  const title = `${opts?.titlePrefix ? `${opts.titlePrefix} - ` : ""}${session.goal || "Training Session"}`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Kinisi//Program//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `SUMMARY:${title}`,
    opts?.location ? `LOCATION:${opts.location}` : undefined,
    opts?.description ? `DESCRIPTION:${opts.description}` : undefined,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return lines.join("\r\n");
}

export function buildICSForProgram(program: ExerciseProgramPayload, opts?: { titlePrefix?: string; location?: string; description?: string }) {
  const events: string[] = [];
  for (const w of program.weeks || []) {
    for (const s of w.sessions || []) {
      if (!s.start_at) continue;
      const { dtStart, dtEnd } = formatDateForICS(s.start_at, s.duration_minutes || 60);
      const uid = s.uid || `session-${dtStart}`;
      const title = `${opts?.titlePrefix ? `${opts.titlePrefix} - ` : ""}${s.goal || "Training Session"}`;
      events.push([
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `SUMMARY:${title}`,
        opts?.location ? `LOCATION:${opts.location}` : undefined,
        opts?.description ? `DESCRIPTION:${opts.description}` : undefined,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        "END:VEVENT",
      ].filter(Boolean).join("\r\n"));
    }
  }
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Kinisi//Program//EN",
    "CALSCALE:GREGORIAN",
    ...events,
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}
