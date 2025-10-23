// Re-export from unified survey types
export type {
  SurveyQuestion,
  SurveyOption,
  SurveyResponseData,
  SurveyResponse,
  ValidationSurveyResponse,
  SurveyValidationResult,
  SurveyProgress,
  SurveyConfig,
  SurveyQuestionProps,
  QuestionGroupProps
} from './unified';

export {
  isValidationSurveyResponse,
  isSurveyResponseData,
  isSurveyResponse
} from './unified';

import type { SurveyResponseData } from './unified';

// Legacy alias for backward compatibility
export type SurveyResponseLegacy = SurveyResponseData;