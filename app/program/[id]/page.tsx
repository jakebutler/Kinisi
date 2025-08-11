/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { getProgramById, getExerciseNamesByIds, extractExerciseIdsFromProgram } from "@/utils/programDataHelpers";
import ProgramActions from "@/components/program/ProgramActions";

// Program details page: renders from program_json since relational sessions may not be populated yet
export default async function ProgramDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-2">Program</h1>
        <p className="text-red-600">Missing program id.</p>
        <div className="mt-4"><Link href="/dashboard" className="text-blue-600 underline">Back to dashboard</Link></div>
      </div>
    );
  }

  let program: any = null;
  try {
    program = await getProgramById(id);
  } catch {
    // swallow and show not found-ish UI
  }

  if (!program) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-2">Program</h1>
        <p className="text-gray-700">Program not found.</p>
        <div className="mt-4"><Link href="/dashboard" className="text-blue-600 underline">Back to dashboard</Link></div>
      </div>
    );
  }

  const programJson = program.program_json || {};
  const weeks = Array.isArray(programJson.weeks) ? programJson.weeks : [];
  const totalSessions = weeks.reduce((sum: number, w: any) => sum + (Array.isArray(w.sessions) ? w.sessions.length : 0), 0);

  // Build exercise_id -> name map for rendering
  const allIds = extractExerciseIdsFromProgram(programJson);
  const nameMap = await getExerciseNamesByIds(allIds);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Your Fitness Program</h1>
        <Link href="/dashboard" className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Back</Link>
      </div>

      <div className="text-gray-700 mb-2">
        <span className="mr-2">Status: <span className="font-medium">{program.status}</span></span>
        {program.start_date ? <span className="ml-2">Start: <span className="font-medium">{program.start_date}</span></span> : null}
      </div>
      <div className="text-gray-700 mb-6">{weeks.length} weeks, {totalSessions} sessions</div>

      <ProgramActions programId={program.id} status={program.status} />

      <div className="space-y-6">
        {weeks.map((week: any, wIdx: number) => (
          <div key={wIdx} className="border rounded-lg p-4">
            <div className="font-semibold mb-3">Week {week.week ?? (wIdx + 1)}</div>
            <div className="space-y-3">
              {Array.isArray(week.sessions) && week.sessions.map((session: any, sIdx: number) => (
                <div key={sIdx} className="border rounded p-3 bg-gray-50">
                  <div className="font-medium mb-1">{session.goal || `Session ${session.session ?? (sIdx + 1)}`}</div>
                  <ul className="list-disc ml-5 text-sm text-gray-800">
                    {Array.isArray(session.exercises) && session.exercises.map((ex: any, eIdx: number) => (
                      <li key={eIdx}>
                        {nameMap[ex.exercise_id] || ex.exercise_id}: {ex.sets} x {ex.reps}{ex.notes ? ` — ${ex.notes}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
