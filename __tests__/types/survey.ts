export interface SurveyQuestion {
  key: string;
  title: string;
  type: 'radio' | 'select' | 'multiselect' | 'text' | 'number' | 'group';
  options?: Array<{ label: string; value: string }>;
  required?: boolean;
  min?: number;
  max?: number;
  subtitle?: string;
  showFollowUp?: (value: unknown) => boolean;
  followUp?: Omit<SurveyQuestion, 'showFollowUp' | 'followUp'>;
  isFollowUp?: boolean;
  fields?: SurveyQuestion[];
}

export interface SurveyResponseData {
  [key: string]: unknown;
}

export interface SurveyProgress {
  currentQuestionIndex: number;
  totalQuestions: number;
  isCompleted: boolean;
}

export interface SurveyValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

export interface SurveyQuestionProps {
  question: SurveyQuestion;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  disabled?: boolean;
}

export interface SurveyConfig {
  questions: SurveyQuestion[];
  onSubmit: (responses: SurveyResponseData) => void | Promise<void>;
  onProgress?: (progress: SurveyProgress) => void;
  allowNavigation?: boolean;
}