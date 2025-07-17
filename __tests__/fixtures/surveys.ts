// Test fixtures for survey data
import { SurveyResponse } from '../../utils/surveyResponses';

export const mockSurveyResponse: SurveyResponse = {
  id: 'survey-response-123',
  user_id: 'test-user-id-123',
  response: {
    age: 30,
    gender: 'male',
    fitnessLevel: 'intermediate',
    goals: ['weight_loss', 'muscle_gain'],
    availableTime: '30-60 minutes',
    preferredActivities: ['weightlifting', 'cardio'],
    injuries: 'none',
    equipment: ['dumbbells', 'resistance_bands']
  },
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z'
};

export const mockIncompleteSurveyResponse: SurveyResponse = {
  id: 'survey-response-incomplete-456',
  user_id: 'test-user-no-survey-456',
  response: {
    age: 25
    // Missing required fields
  },
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z'
};

export const mockEmptySurveyResponse: SurveyResponse = {
  id: 'survey-response-empty-789',
  user_id: 'test-user-empty-789',
  response: {},
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z'
};
