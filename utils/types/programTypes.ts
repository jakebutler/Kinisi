// utils/types/programTypes.ts

export interface Exercise {
  exercise_id: string;
  name: string;
  primary_muscles?: string[];
  equipment?: string[];
}

export interface ProgramExerciseInstance {
  exercise_id: string;
  sets: number;
  reps: number;
  notes?: string;
}

export interface ProgramSession {
  session: number;
  goal: string;
  exercises: ProgramExerciseInstance[];
  /** Stable identifier for the session (e.g., "w1s2"). */
  uid?: string;
  /** ISO 8601 start datetime for the scheduled session. */
  start_at?: string;
  /** Planned duration in minutes for calendar/ICS export. */
  duration_minutes?: number;
}

export interface ProgramWeek {
  week: number;
  sessions: ProgramSession[];
}

export interface ExerciseProgramPayload {
  weeks: ProgramWeek[];
}
