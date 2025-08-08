/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useEffect, useState } from "react";
import { getExerciseNamesByIds } from "@/utils/programDataHelpers";

interface ProgramSectionProps {
  assessmentApproved: boolean;
  program: any | null; // Replace with correct type
  programApproved: boolean;
  isGeneratingProgram: boolean;
  programError: string | null;
  onSeeProgram: () => void;
  onGiveFeedback: () => void;
  onApproveProgram: () => void;
  onGenerateProgram: () => void;
  onStartDateChange: (date: string) => void;
  startDate: string | null;
}

const ProgramSection: React.FC<ProgramSectionProps> = ({
  assessmentApproved,
  program,
  programApproved,
  isGeneratingProgram,
  programError,
  onSeeProgram,
  onGiveFeedback,
  onApproveProgram,
  onGenerateProgram,
  onStartDateChange,
  startDate,
}) => {
  // Map exercise_id -> name for human-readable preview
  const [exerciseNames, setExerciseNames] = useState<Record<string, string>>({});
  useEffect(() => {
    async function fetchNames() {
      try {
        const ids: string[] = Array.isArray(program?.weeks)
          ? program.weeks.flatMap((w: any) =>
              Array.isArray(w.sessions)
                ? w.sessions.flatMap((s: any) =>
                    Array.isArray(s.exercises) ? s.exercises.map((e: any) => e.exercise_id).filter(Boolean) : []
                  )
                : []
            )
          : [];
        const unique = Array.from(new Set(ids));
        if (unique.length === 0) {
          setExerciseNames({});
          return;
        }
        const map = await getExerciseNamesByIds(unique);
        setExerciseNames(map);
      } catch {
        // best-effort; fall back to IDs
        setExerciseNames({});
      }
    }
    fetchNames();
  }, [program]);
  // Compute total sessions from weeks since program_json does not include a top-level sessions array
  const totalSessions = Array.isArray(program?.weeks)
    ? program.weeks.reduce((sum: number, w: any) => sum + (Array.isArray(w.sessions) ? w.sessions.length : 0), 0)
    : 0;
  // Overlay if assessment not approved
  if (!assessmentApproved) {
    return (
      <div className="relative bg-white rounded-lg shadow-md p-6 mt-8 overflow-hidden">
        <div className="absolute inset-0 bg-blue-200 bg-opacity-70 flex flex-col items-center justify-center z-10">
          <h2 className="text-2xl font-semibold text-blue-900 mb-2">Review & Approve Your Assessment</h2>
          <p className="text-blue-800 mb-4">Approve your personalized assessment to unlock your fitness program.</p>
        </div>
        <div className="opacity-40 pointer-events-none select-none">
          <h2 className="text-2xl font-semibold mb-4">Your Fitness Program</h2>
          <div className="h-32 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  // Show skeleton while generating
  if (isGeneratingProgram) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mt-8">
        <h2 className="text-2xl font-semibold mb-4">Your Fitness Program</h2>
        <div className="space-y-4">
          <div className="h-6 bg-gray-100 rounded w-1/2 animate-pulse" />
          <div className="h-4 bg-gray-100 rounded w-1/3 animate-pulse" />
          <div className="h-20 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  // Error state
  if (programError) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mt-8">
        <h2 className="text-2xl font-semibold mb-4">Your Fitness Program</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p>{programError}</p>
        </div>
      </div>
    );
  }

  // Draft preview (program exists but not approved)
  if (program && !programApproved) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mt-8">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-semibold">Your Fitness Program <span className="ml-2 px-2 py-1 text-xs bg-yellow-200 text-yellow-900 rounded">Draft</span></h2>
          <button onClick={onSeeProgram} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">See my program</button>
        </div>
        {startDate && (
          <div className="mb-4">
            <label className="block text-gray-700 mb-1 font-medium">Program Start Date</label>
            <input type="date" value={startDate} onChange={e => onStartDateChange(e.target.value)} className="border rounded px-2 py-1" />
          </div>
        )}
        <div className="mb-2 text-gray-700">{program.weeks?.length || 0} weeks, {totalSessions} sessions</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {program.weeks?.slice(0, 2).map((week: any, wIdx: number) => (
            <div key={wIdx} className="border rounded p-3 bg-gray-50">
              <div className="font-semibold mb-1">Week {wIdx + 1}</div>
              <ul className="text-sm text-gray-700 list-disc ml-4">
                {week.sessions?.slice(0, 2).map((session: any, sIdx: number) => (
                  <li key={sIdx}>
                    {(session.goal || `Session ${session.session ?? sIdx + 1}`)}: {Array.isArray(session.exercises)
                      ? session.exercises
                          .slice(0, 2)
                          .map((ex: any) => exerciseNames[ex.exercise_id] || ex.exercise_id)
                          .join(", ")
                      : ""}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex mt-4 space-x-2">
          <button onClick={onGiveFeedback} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Give Feedback</button>
          <button onClick={onApproveProgram} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Approve Program</button>
        </div>
      </div>
    );
  }

  // Approved program preview
  if (program && programApproved) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mt-8">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-semibold">Your Fitness Program <span className="ml-2 px-2 py-1 text-xs bg-green-200 text-green-900 rounded">Approved</span></h2>
          <button onClick={onSeeProgram} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">View Program Details</button>
        </div>
        <div className="mb-2 text-gray-700">{program.weeks?.length || 0} weeks, {totalSessions} sessions</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {program.weeks?.slice(0, 2).map((week: any, wIdx: number) => (
            <div key={wIdx} className="border rounded p-3 bg-gray-50">
              <div className="font-semibold mb-1">Week {wIdx + 1}</div>
              <ul className="text-sm text-gray-700 list-disc ml-4">
                {week.sessions?.slice(0, 2).map((session: any, sIdx: number) => (
                  <li key={sIdx}>
                    {(session.goal || `Session ${session.session ?? sIdx + 1}`)}: {Array.isArray(session.exercises)
                      ? session.exercises
                          .slice(0, 2)
                          .map((ex: any) => exerciseNames[ex.exercise_id] || ex.exercise_id)
                          .join(", ")
                      : ""}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex mt-4 space-x-2">
          <button onClick={onSeeProgram} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">See Full Program</button>
          <button onClick={onGiveFeedback} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Give Feedback</button>
        </div>
      </div>
    );
  }

  // Default fallback
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-8">
      <h2 className="text-2xl font-semibold mb-2">Your Fitness Program</h2>
      <p className="text-gray-700 mb-4">No program has been created yet. Generate your personalized plan to get started.</p>
      <button
        onClick={onGenerateProgram}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Generate Program
      </button>
    </div>
  );
};

export default ProgramSection;
