"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { buildGoogleCalendarUrl, buildICSForProgram, buildICSSession } from "@/utils/ics";
import dynamic from "next/dynamic";

// Attempt dynamic import so the app still compiles without FullCalendar deps installed.
const FullCalendarDynamic: any = dynamic(() => import("@fullcalendar/react").catch(() => ({} as any)), { ssr: false });

export default function ProgramCalendar({ program, programId }: { program: any; programId: string }) {
  const [plugins, setPlugins] = useState<any[] | null>(null);
  const [fcReady, setFcReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadPlugins() {
      try {
        const [day, time, inter] = await Promise.all([
          import("@fullcalendar/daygrid").catch(() => null),
          import("@fullcalendar/timegrid").catch(() => null),
          import("@fullcalendar/interaction").catch(() => null),
        ]);
        if (!mounted) return;
        if (day && time && inter) {
          setPlugins([day.default, time.default, inter.default]);
          setFcReady(true);
        } else {
          setPlugins(null);
          setFcReady(false);
        }
      } catch {
        if (!mounted) return;
        setPlugins(null);
        setFcReady(false);
      }
    }
    loadPlugins();
    return () => { mounted = false; };
  }, []);

  const sessions = useMemo(() => {
    const out: Array<{ uid: string; goal: string; start_at: string; duration_minutes: number } | null> = [];
    const weeks = Array.isArray(program?.weeks) ? program.weeks : [];
    for (const w of weeks) {
      const ses = Array.isArray(w.sessions) ? w.sessions : [];
      for (const s of ses) {
        if (!s?.start_at) continue;
        out.push({
          uid: s.uid || `${s.start_at}`,
          goal: s.goal || "Training Session",
          start_at: s.start_at,
          duration_minutes: typeof s.duration_minutes === "number" ? s.duration_minutes : 60,
        });
      }
    }
    return out.filter(Boolean) as Array<{ uid: string; goal: string; start_at: string; duration_minutes: number }>;
  }, [program]);

  const bulkIcs = useMemo(() => buildICSForProgram(program, { titlePrefix: "Kinisi" }), [program]);

  function downloadICS(filename: string, content: string) {
    const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function fmtLocal(dt: Date) {
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
  }

  const events = useMemo(() => sessions.map(s => {
    const start = new Date(s.start_at);
    const end = new Date(start.getTime() + (s.duration_minutes || 60) * 60000);
    return {
      id: s.uid,
      title: s.goal,
      start,
      end,
    };
  }), [sessions]);

  const onEventDrop = async (info: any) => {
    const uid = info?.event?.id;
    const newStart: Date | null = info?.event?.start || null;
    if (!uid || !newStart) return;
    try {
      const res = await fetch(`/api/program/${programId}/schedule/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, newStartAt: fmtLocal(newStart) })
      });
      if (!res.ok) throw new Error('Failed to update');
    } catch {
      if (info?.revert) info.revert();
    }
  };

  const onEventResize = async (info: any) => {
    const uid = info?.event?.id;
    const start: Date | null = info?.event?.start || null;
    const end: Date | null = info?.event?.end || null;
    if (!uid || !start || !end) return;
    const newDurationMinutes = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));
    try {
      const res = await fetch(`/api/program/${programId}/schedule/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, newDurationMinutes })
      });
      if (!res.ok) throw new Error('Failed to update');
    } catch {
      if (info?.revert) info.revert();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-gray-700">{sessions.length} scheduled sessions</div>
        <button onClick={() => downloadICS(`program-${programId}.ics`, bulkIcs)} className="px-3 py-2 bg-gray-800 text-white rounded hover:bg-black">Download .ics (all)</button>
      </div>
      {/* FullCalendar view when available */}
      {fcReady && plugins && FullCalendarDynamic && sessions.length > 0 ? (
        <div className="border rounded overflow-hidden">
          <FullCalendarDynamic
            plugins={plugins}
            initialView="timeGridWeek"
            height="auto"
            headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
            editable
            droppable={false}
            eventDurationEditable
            events={events}
            eventDrop={onEventDrop}
            eventResize={onEventResize}
          />
        </div>
      ) : sessions.length === 0 ? (
        <div className="p-4 rounded bg-yellow-50 text-yellow-800 border border-yellow-200">
          No sessions have been scheduled yet. Use &quot;Generate Schedule&quot; from the program page.
        </div>
      ) : (
        // Fallback list view when FullCalendar not installed/loaded yet
        <div className="space-y-3">
          {sessions.map((s) => {
            const googleUrl = buildGoogleCalendarUrl({ title: s.goal, start_at: s.start_at, duration_minutes: s.duration_minutes });
            const singleIcs = buildICSSession({ uid: s.uid, start_at: s.start_at, duration_minutes: s.duration_minutes, session: 0, goal: s.goal, exercises: [] } as any, { titlePrefix: "Kinisi" });
            return (
              <div key={s.uid} className="border rounded p-3 bg-white flex items-center justify-between">
                <div>
                  <div className="font-medium">{s.goal}</div>
                  <div className="text-sm text-gray-600">Start: {s.start_at} • {s.duration_minutes} min</div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={googleUrl} target="_blank" className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700">Add to Google</Link>
                  {singleIcs ? (
                    <button onClick={() => downloadICS(`${s.uid}.ics`, singleIcs)} className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300">.ics</button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
