// Unified Survey Type System
// Consolidates all survey-related types from across the codebase

import { Database } from '@/types/supabase';

// Core Survey Types
export interface SurveyQuestion {
  key: string;
  title: string;
  type: 'radio' | 'select' | 'number' | 'text' | 'multiselect' | 'group';
  options?: SurveyOption[];
  required?: boolean;
  min?: number;
  max?: number;
  showFollowUp?: (value: unknown) => boolean;
  followUp?: Omit<SurveyQuestion, 'isFollowUp'>;
  isFollowUp?: boolean;
  fields?: SurveyQuestion[];
  subtitle?: string;
}

export interface SurveyOption {
  label: string;
  value: string;
}

// Survey Response Data (what users actually fill out)
export interface SurveyResponseData {
  [key: string]: unknown;
}

// Database Survey Response (stored in database)
export type SurveyResponse = Database['public']['Tables']['survey_responses']['Row'];

// Data Validation Survey Response (for validation purposes)
export interface ValidationSurveyResponse {
  selectedExercises: string[];
  injuries: string;
  sessionDuration: string;
  confidenceLevel: number;
  activityLikelihood: string;
}

// Export both types for use in different contexts
export type SurveyResponseForValidation = ValidationSurveyResponse;

// Survey Progress and Configuration
export interface SurveyValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

export interface SurveyProgress {
  currentQuestionIndex: number;
  totalQuestions: number;
  isCompleted: boolean;
}

export interface SurveyConfig {
  questions: SurveyQuestion[];
  onSubmit: (responses: SurveyResponseData) => Promise<void>;
  onProgress?: (progress: SurveyProgress) => void;
  allowNavigation?: boolean;
  showProgress?: boolean;
}

// Component Props
export interface SurveyQuestionProps {
  question: SurveyQuestion;
  value: unknown;
  onChange: (value: unknown) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
}

export interface QuestionGroupProps extends Omit<SurveyQuestionProps, 'value' | 'onChange'> {
  value: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

// Type Guards and Utilities
export function isValidationSurveyResponse(data: any): data is ValidationSurveyResponse {
  return data &&
    typeof data === 'object' &&
    Array.isArray(data.selectedExercises) &&
    typeof data.injuries === 'string' &&
    typeof data.sessionDuration === 'string' &&
    typeof data.confidenceLevel === 'number' &&
    typeof data.activityLikelihood === 'string';
}

export function isSurveyResponseData(data: any): data is SurveyResponseData {
  return data && typeof data === 'object';
}

export function isSurveyResponse(data: any): data is SurveyResponse {
  return data &&
    typeof data === 'object' &&
    typeof data.id === 'string' &&
    typeof data.user_id === 'string' &&
    typeof data.response === 'object' &&
    typeof data.created_at === 'string';
}