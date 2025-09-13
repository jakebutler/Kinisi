import { useState, useCallback } from 'react';

// Simple validation functions
const validateSurveyResponse = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data.selectedExercises || data.selectedExercises.length === 0) {
    errors.push('At least one exercise must be selected');
  }
  if (!data.injuries || data.injuries.trim().length === 0) {
    errors.push('Injury information is required');
  }
  if (!data.sessionDuration || data.sessionDuration.trim().length === 0) {
    errors.push('Session duration is required');
  }
  if (!data.confidenceLevel || data.confidenceLevel < 1 || data.confidenceLevel > 10) {
    errors.push('Confidence level must be between 1 and 10');
  }
  if (!data.activityLikelihood || data.activityLikelihood.trim().length === 0) {
    errors.push('Activity likelihood is required');
  }
  
  return { isValid: errors.length === 0, errors };
};

const validateAssessment = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data.id || typeof data.id !== 'string') {
    errors.push('Assessment ID is required');
  }
  if (!data.user_id || typeof data.user_id !== 'string') {
    errors.push('User ID is required');
  }
  if (!data.assessment || data.assessment.length < 10) {
    errors.push('Assessment must be at least 10 characters');
  }
  if (typeof data.approved !== 'boolean') {
    errors.push('Approval status is required');
  }
  
  return { isValid: errors.length === 0, errors };
};

const validateExerciseProgram = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data.id || typeof data.id !== 'string') {
    errors.push('Program ID is required');
  }
  if (!data.user_id || typeof data.user_id !== 'string') {
    errors.push('User ID is required');
  }
  if (!data.status || !['draft', 'approved', 'active'].includes(data.status)) {
    errors.push('Valid status is required');
  }
  
  return { isValid: errors.length === 0, errors };
};

// Type definitions
export interface SurveyResponse {
  selectedExercises: string[];
  injuries: string;
  sessionDuration: string;
  confidenceLevel: number;
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
  status: 'draft' | 'approved' | 'active';
  program_json: any;
  created_at: string;
  updated_at: string;
  last_scheduled_at?: string | null;
  scheduling_preferences?: any;
  weeks?: Array<{
    weekNumber: number;
    goal: string;
    sessions: Array<{
      id: string;
      name: string;
      goal: string;
      exercises: any[];
      start_at?: string;
      duration?: number;
    }>;
  }>;
}

interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

interface ValidationState {
  isValidating: boolean;
  errors: Record<string, string[]>;
}

export function useDataValidation() {
  const [validationState, setValidationState] = useState<ValidationState>({
    isValidating: false,
    errors: {}
  });

  const validateData = useCallback(async <T>(
    data: unknown,
    validator: (data: any) => { isValid: boolean; errors: string[] }
  ): Promise<ValidationResult<T>> => {
    setValidationState(prev => ({ ...prev, isValidating: true }));
    
    try {
      const result = validator(data);
      if (result.isValid) {
        setValidationState({ isValidating: false, errors: {} });
        return { success: true, data: data as T };
      } else {
        setValidationState({ 
          isValidating: false, 
          errors: { general: result.errors } 
        });
        return { success: false, errors: result.errors };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Validation failed';
      setValidationState({ 
        isValidating: false, 
        errors: { general: [errorMessage] } 
      });
      return { success: false, errors: [errorMessage] };
    }
  }, []);

  const validateSurveyResponseData = useCallback(async (data: unknown) => {
    return validateData<SurveyResponse>(data, validateSurveyResponse);
  }, [validateData]);

  const validateAssessmentData = useCallback(async (data: unknown) => {
    return validateData<Assessment>(data, validateAssessment);
  }, [validateData]);

  const validateExerciseProgramData = useCallback(async (data: unknown) => {
    return validateData<ExerciseProgram>(data, validateExerciseProgram);
  }, [validateData]);

  const clearErrors = useCallback(() => {
    setValidationState(prev => ({ ...prev, errors: {} }));
  }, []);

  const setFieldError = useCallback((field: string, errors: string[]) => {
    setValidationState(prev => ({
      ...prev,
      errors: { ...prev.errors, [field]: errors }
    }));
  }, []);

  return {
    validationState,
    validateData,
    validateSurveyResponse: validateSurveyResponseData,
    validateAssessment: validateAssessmentData,
    validateExerciseProgram: validateExerciseProgramData,
    clearErrors,
    setFieldError,
    isValidating: validationState.isValidating,
    errors: validationState.errors
  };
}

const sanitizeUserInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
