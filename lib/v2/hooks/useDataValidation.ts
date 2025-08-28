import { useState, useCallback } from 'react';
import { z } from 'zod';

// Validation schemas
export const SurveyResponseSchema = z.object({
  selectedExercises: z.array(z.string()).min(1, 'At least one exercise must be selected'),
  injuries: z.string().min(1, 'Injury information is required'),
  sessionDuration: z.string().min(1, 'Session duration is required'),
  confidenceLevel: z.number().min(1).max(10),
  activityLikelihood: z.string().min(1, 'Activity likelihood is required')
});

export const AssessmentSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  survey_response_id: z.string(),
  assessment: z.string().min(10, 'Assessment must be at least 10 characters'),
  approved: z.boolean(),
  created_at: z.string()
});

export const ExerciseProgramSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  status: z.enum(['draft', 'approved', 'rejected']),
  program_json: z.array(z.object({
    id: z.string(),
    name: z.string().min(1),
    goal: z.string().optional(),
    exercises: z.array(z.object({
      id: z.string(),
      name: z.string().min(1),
      sets: z.number().min(1),
      reps: z.string().optional(),
      duration: z.string().optional(),
      targetMuscles: z.array(z.string()),
      instructions: z.string().min(1)
    })).min(1),
    start_at: z.string().optional()
  })).min(1),
  created_at: z.string(),
  updated_at: z.string(),
  last_scheduled_at: z.string().optional(),
  scheduling_preferences: z.any().optional()
});

interface ValidationError {
  field: string;
  message: string;
}

interface UseDataValidationReturn {
  errors: ValidationError[];
  isValid: boolean;
  validateSurveyResponse: (data: any) => boolean;
  validateAssessment: (data: any) => boolean;
  validateExerciseProgram: (data: any) => boolean;
  clearErrors: () => void;
}

export const useDataValidation = (): UseDataValidationReturn => {
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const validateData = useCallback((schema: z.ZodSchema, data: any, context: string): boolean => {
    try {
      schema.parse(data);
      setErrors([]);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors: ValidationError[] = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        setErrors(validationErrors);
        console.error(`${context} validation failed:`, validationErrors);
      }
      return false;
    }
  }, []);

  const validateSurveyResponse = useCallback((data: any): boolean => {
    return validateData(SurveyResponseSchema, data, 'Survey Response');
  }, [validateData]);

  const validateAssessment = useCallback((data: any): boolean => {
    return validateData(AssessmentSchema, data, 'Assessment');
  }, [validateData]);

  const validateExerciseProgram = useCallback((data: any): boolean => {
    return validateData(ExerciseProgramSchema, data, 'Exercise Program');
  }, [validateData]);

  return {
    errors,
    isValid: errors.length === 0,
    validateSurveyResponse,
    validateAssessment,
    validateExerciseProgram,
    clearErrors
  };
};

// Utility functions for data sanitization
export const sanitizeUserInput = (input: string): string => {
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
