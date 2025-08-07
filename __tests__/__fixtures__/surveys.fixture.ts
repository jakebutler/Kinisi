// Mock survey response data for testing
export const mockSurveyResponse = {
  id: 'survey-response-123',
  user_id: 'demo-user',
  survey_id: 'fitness-assessment-v1',
  response: {
    age: 25,
    gender: 'male',
    fitness_level: 'intermediate',
    goals: ['strength', 'muscle_building'],
    equipment: ['dumbbells', 'bodyweight'],
    time_availability: '45-60 minutes',
    experience: '1-2 years',
    injuries: [],
    preferences: {
      workout_style: 'strength_training',
      intensity: 'moderate_high'
    }
  },
  completed_at: '2023-01-01T00:00:00.000Z',
  created_at: '2023-01-01T00:00:00.000Z',
  updated_at: '2023-01-01T00:00:00.000Z'
};

export const mockSurveyResponseIncomplete = {
  id: 'survey-response-456',
  user_id: 'demo-user',
  survey_id: 'fitness-assessment-v1',
  response: {
    age: 30,
    gender: 'female'
    // Incomplete responses
  },
  completed_at: null,
  created_at: '2023-01-01T00:00:00.000Z',
  updated_at: '2023-01-01T00:00:00.000Z'
};

export const mockSurveyResponseEmpty = {
  id: null,
  user_id: 'demo-user',
  survey_id: 'fitness-assessment-v1',
  response: {},
  completed_at: null,
  created_at: null,
  updated_at: null
};
