// Mock LangChain functions for testing
import { mockAssessment, mockRevisedAssessment } from '../fixtures/assessments';

// Mock assessment generation
export const mockGenerateAssessmentFromSurvey = jest.fn().mockResolvedValue(
  mockAssessment.assessment
);

// Mock assessment revision
export const mockReviseAssessmentWithFeedback = jest.fn().mockResolvedValue(
  mockRevisedAssessment.assessment
);

// Mock LangChain module
export const mockAssessmentChain = {
  generateAssessmentFromSurvey: mockGenerateAssessmentFromSurvey,
  reviseAssessmentWithFeedback: mockReviseAssessmentWithFeedback
};
