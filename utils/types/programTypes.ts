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
}

export interface ProgramWeek {
  week: number;
  sessions: ProgramSession[];
}

export interface ExerciseProgramPayload {
  weeks: ProgramWeek[];
}
