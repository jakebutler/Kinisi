import { SurveyQuestion, SurveyResponseData, SurveyValidationResult } from '@/types/survey';

export const validateQuestion = (question: SurveyQuestion, value: unknown): SurveyValidationResult => {
  // If not required and empty, it's valid
  if (!question.required && isEmptyValue(value)) {
    return { isValid: true };
  }

  // Required but empty
  if (question.required && isEmptyValue(value)) {
    return {
      isValid: false,
      errorMessage: 'This field is required.'
    };
  }

  // Type-specific validation
  switch (question.type) {
    case 'text':
      return validateText(value, question);
    case 'number':
      return validateNumber(value, question);
    case 'radio':
    case 'select':
      return validateSingleChoice(value, question);
    case 'multiselect':
      return validateMultiChoice(value, question);
    case 'group':
      return validateGroup(value, question);
    default:
      return { isValid: true };
  }
};

export const validateSurveyResponse = (
  questions: SurveyQuestion[],
  responses: SurveyResponseData
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  let isValid = true;

  questions.forEach(question => {
    const result = validateQuestion(question, responses[question.key]);
    if (!result.isValid) {
      errors[question.key] = result.errorMessage || 'Invalid response';
      isValid = false;
    }
  });

  return { isValid, errors };
};

// Helper validation functions
const isEmptyValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

const validateText = (value: unknown, question: SurveyQuestion): SurveyValidationResult => {
  if (typeof value !== 'string') {
    return { isValid: false, errorMessage: 'Please enter a valid text response.' };
  }

  const trimmed = value.trim();
  if (question.required && trimmed.length === 0) {
    return { isValid: false, errorMessage: 'This field is required.' };
  }

  // Max length validation (default 1000 chars)
  const maxLength = 1000;
  if (trimmed.length > maxLength) {
    return {
      isValid: false,
      errorMessage: `Response must be ${maxLength} characters or less.`
    };
  }

  return { isValid: true };
};

const validateNumber = (value: unknown, question: SurveyQuestion): SurveyValidationResult => {
  const numValue = typeof value === 'number' ? value : Number(value);

  if (Number.isNaN(numValue)) {
    return { isValid: false, errorMessage: 'Please enter a valid number.' };
  }

  if (question.min !== undefined && numValue < question.min) {
    return {
      isValid: false,
      errorMessage: `Value must be at least ${question.min}.`
    };
  }

  if (question.max !== undefined && numValue > question.max) {
    return {
      isValid: false,
      errorMessage: `Value must be at most ${question.max}.`
    };
  }

  return { isValid: true };
};

const validateSingleChoice = (value: unknown, question: SurveyQuestion): SurveyValidationResult => {
  if (typeof value !== 'string') {
    return { isValid: false, errorMessage: 'Please select an option.' };
  }

  if (question.required && value === '') {
    return { isValid: false, errorMessage: 'Please select an option.' };
  }

  // Validate against available options
  if (question.options && !question.options.some(option => option.value === value)) {
    return { isValid: false, errorMessage: 'Please select a valid option.' };
  }

  return { isValid: true };
};

const validateMultiChoice = (value: unknown, question: SurveyQuestion): SurveyValidationResult => {
  if (!Array.isArray(value)) {
    return { isValid: false, errorMessage: 'Please select one or more options.' };
  }

  if (question.required && value.length === 0) {
    return { isValid: false, errorMessage: 'Please select at least one option.' };
  }

  // Validate against available options
  if (question.options) {
    const invalidOptions = value.filter(v =>
      !question.options!.some(option => option.value === v)
    );

    if (invalidOptions.length > 0) {
      return { isValid: false, errorMessage: 'Please select valid options.' };
    }
  }

  return { isValid: true };
};

const validateGroup = (value: unknown, question: SurveyQuestion): SurveyValidationResult => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { isValid: false, errorMessage: 'Please complete all fields.' };
  }

  const groupValue = value as Record<string, unknown>;
  const fieldErrors: string[] = [];

  // Validate each field in the group
  question.fields?.forEach(field => {
    const fieldValue = groupValue[field.key];
    const fieldResult = validateQuestion(field, fieldValue);

    if (!fieldResult.isValid) {
      fieldErrors.push(`${field.title}: ${fieldResult.errorMessage}`);
    }
  });

  if (fieldErrors.length > 0) {
    return {
      isValid: false,
      errorMessage: fieldErrors.join('; ')
    };
  }

  return { isValid: true };
};