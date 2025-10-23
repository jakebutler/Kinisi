// Program JSON Structure Types
export interface ProgramJson {
  weeks: ProgramWeek[];
  metadata?: ProgramMetadata;
}

export interface ProgramWeek {
  weekNumber: number;
  goal: string;
  sessions: ProgramSession[];
}

export interface ProgramSession {
  id?: string;
  name: string;
  goal: string;
  exercises: ProgramExercise[];
  start_at?: string; // ISO date string for scheduled sessions
}

export interface ProgramExercise {
  id?: string;
  name: string;
  sets: number;
  reps?: string;
  duration?: string;
  targetMuscles: string[];
  secondaryMuscles?: string[];
  instructions: string;
  equipment?: string[];
  rest?: string;
  notes?: string;
}

export interface ProgramMetadata {
  title?: string;
  description?: string;
  duration?: string; // e.g., "8 weeks"
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  goals?: string[];
  equipment?: string[];
  frequency?: string; // e.g., "3 days per week"
  created_at?: string;
  updated_at?: string;
}

// Database Program Types
export interface ExerciseProgram {
  id: string;
  user_id: string;
  status: ProgramStatus;
  program_json: ProgramJson | null; // Can be null for legacy data
  created_at: string;
  updated_at: string;
  last_scheduled_at?: string;
  scheduling_preferences?: SchedulingPreferences;
  approved?: boolean;
  weeks?: ProgramWeek[]; // Computed from program_json for convenience
}

export type ProgramStatus = 'draft' | 'approved' | 'active' | 'completed' | 'cancelled';

export interface SchedulingPreferences {
  preferredDays?: number[]; // 0-6 (Sunday-Saturday)
  preferredTime?: string; // e.g., "morning", "afternoon", "evening"
  sessionDuration?: number; // minutes
  restDays?: number[];
  startDate?: string; // ISO date string
  flexibility?: boolean; // Whether schedule can be flexible
}

// API Response Types
export interface ProgramResponse {
  id: string;
  user_id: string;
  status: ProgramStatus;
  program_json: ProgramJson | null;
  created_at: string;
  updated_at: string;
  last_scheduled_at?: string;
  scheduling_preferences?: SchedulingPreferences;
  approved?: boolean;
}

export interface ProgramSessionData {
  id: string;
  program_id: string;
  session_id?: string;
  name: string;
  goal: string;
  exercises: ProgramExercise[];
  scheduled_date?: string;
  completed?: boolean;
  feedback?: string;
}

// Helper Types for Legacy Compatibility
export interface LegacyProgramWeek {
  weekNumber: number;
  goal: string;
  sessions: ProgramSession[];
}

export interface LegacyProgramExercise {
  id: string;
  name: string;
  sets: number;
  reps?: string;
  duration?: string;
  targetMuscles: string[];
  secondaryMuscles?: string[];
  instructions: string;
}