// User and Authentication Types
export interface User {
  id: string;
  email: string;
  username?: string;
  status: UserStatus;
}

export type UserStatus = 'onboarding' | 'active';

// Onboarding Types (matching POC patterns)
export interface SurveyData {
  selectedExercises: string[];
  injuries: string;
  sessionDuration: string;
  confidenceLevel: number | null;
  activityLikelihood: string;
}

export interface Assessment {
  id: string;
  user_id: string;
  survey_response_id: string;
  assessment: string;
  approved: boolean;
  created_at: string;
}

export interface ExerciseProgram {
  id: string;
  user_id: string;
  status: string;
  program_json: any;
  created_at: string;
  updated_at: string;
  last_scheduled_at?: string;
  scheduling_preferences?: any;
  approved?: boolean;
  weeks?: ProgramWeek[];
}

export interface ProgramWeek {
  weekNumber: number;
  goal: string;
  sessions: ProgramSession[];
}

export interface ProgramSession {
  id: string;
  name: string;
  goal: string;
  exercises: Exercise[];
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps?: string;
  duration?: string;
  targetMuscles: string[];
  secondaryMuscles?: string[];
  instructions: string;
}

// UI State Types
export interface UIState {
  loading: boolean;
  error: string | null;
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

// Component Props Types (from POC)
export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

export interface HeaderProps {
  username?: string;
  onSignOut?: () => void;
}
