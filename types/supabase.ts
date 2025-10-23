// Enhanced Supabase Database Type Definitions
// Based on the tables and columns used throughout the application

import { ProgramJson } from './fitness/Program';
import { SurveyResponses } from './supabase.types';

export interface Database {
  public: {
    Tables: {
      exercise_programs: {
        Row: {
          id: string;
          user_id: string;
          status: 'draft' | 'approved' | 'active' | 'completed' | 'cancelled';
          program_json: ProgramJson | null;
          created_at: string;
          updated_at: string;
          last_scheduled_at?: string;
          scheduling_preferences?: Record<string, unknown>;
          approved?: boolean;
        };
        Insert: Omit<Database['public']['Tables']['exercise_programs']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['exercise_programs']['Row']>;
      };

      assessments: {
        Row: {
          id: string;
          user_id: string;
          survey_response_id: string;
          assessment: string;
          approved: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['assessments']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['assessments']['Row']>;
      };

      survey_responses: {
        Row: {
          id: string;
          user_id: string;
          response: SurveyResponses;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['survey_responses']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['survey_responses']['Row']>;
      };

      program_feedback: {
        Row: {
          id: string;
          program_id: string;
          session_id?: string;
          user_id: string;
          feedback: string;
          revision: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['program_feedback']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['program_feedback']['Row']>;
      };

      sessions: {
        Row: {
          id: string;
          program_id: string;
          name: string;
          goal: string;
          exercises: Record<string, unknown>[];
          scheduled_date?: string;
          completed?: boolean;
          feedback?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['sessions']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['sessions']['Row']>;
      };

      session_exercises: {
        Row: {
          id: string;
          session_id: string;
          exercise_id: string;
          sets: number;
          reps?: string;
          duration?: string;
          rest?: string;
          notes?: string;
          completed?: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['session_exercises']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['session_exercises']['Row']>;
      };

      exercises: {
        Row: {
          exercise_id: string;
          name: string;
          target_muscles: string[];
          equipments: string[];
          body_parts: string[];
          primary_muscles?: string[];
          secondary_muscles?: string[];
          instructions?: string;
          difficulty?: 'beginner' | 'intermediate' | 'advanced';
          category?: string;
          created_at?: string;
          updated_at?: string;
        };
        Insert: Omit<Database['public']['Tables']['exercises']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['exercises']['Row']>;
      };

      users: {
        Row: {
          id: string;
          email: string;
          username?: string;
          status: 'onboarding' | 'active';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Row']>;
      };

      beta_requests: {
        Row: {
          id: string;
          email: string;
          name?: string;
          message?: string;
          status: 'pending' | 'approved' | 'rejected';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['beta_requests']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['beta_requests']['Row']>;
      };
    };

    Views: {
      [_ in never]: never;
    };

    Functions: {
      [_ in never]: never;
    };

    Enums: {
      program_status: 'draft' | 'approved' | 'active' | 'completed' | 'cancelled';
      user_status: 'onboarding' | 'active';
      beta_request_status: 'pending' | 'approved' | 'rejected';
    };
  };
}

// Enhanced Session Types for Supabase Auth
export interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: {
    id: string;
    email?: string;
    phone?: string;
    email_confirmed_at?: string;
    phone_confirmed_at?: string;
    last_sign_in_at?: string;
    created_at?: string;
    updated_at?: string;
    app_metadata?: Record<string, unknown>;
    user_metadata?: Record<string, unknown>;
    identities?: Array<{
      id: string;
      user_id: string;
      identity_data?: Record<string, unknown>;
      provider: string;
      last_sign_in_at?: string;
      created_at?: string;
      updated_at?: string;
    }>;
  };
}

// Auth State Change Types
export type AuthStateChange =
  | 'INITIAL_SESSION'
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'TOKEN_REFRESHED'
  | 'USER_UPDATED'
  | 'PASSWORD_RECOVERY';

// Auth Context Types
export interface AuthState {
  session: SupabaseSession | null;
  user: SupabaseSession['user'] | null;
  loading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: Error | null; success: boolean }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null; success: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null; success: boolean }>;
  updatePassword: (password: string) => Promise<{ error: Error | null; success: boolean }>;
}