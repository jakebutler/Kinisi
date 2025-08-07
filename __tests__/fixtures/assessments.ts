// Mock assessment data for testing
export const mockAssessment = {
  id: 'assessment-123',
  user_id: 'demo-user',
  assessment_text: 'Based on your survey responses, I recommend a strength training program focusing on compound movements. You should start with bodyweight exercises and gradually progress to weighted movements. Your program should include 3-4 sessions per week with adequate rest between sessions.',
  status: 'draft',
  created_at: '2023-01-01T00:00:00.000Z',
  updated_at: '2023-01-01T00:00:00.000Z'
};

export const mockRevisedAssessment = {
  id: 'assessment-456',
  user_id: 'demo-user',
  assessment_text: 'Based on your feedback, I have revised the assessment. Your updated program should focus more on flexibility and mobility work in addition to strength training. I recommend starting with yoga or stretching routines before progressing to strength exercises.',
  status: 'revised',
  created_at: '2023-01-01T00:00:00.000Z',
  updated_at: '2023-01-02T00:00:00.000Z',
  revision_notes: 'User requested more focus on flexibility and mobility'
};

export const mockAssessmentDraft = {
  id: 'assessment-789',
  user_id: 'demo-user',
  assessment_text: 'This is a draft assessment that is still being worked on...',
  status: 'draft',
  created_at: '2023-01-01T00:00:00.000Z',
  updated_at: '2023-01-01T00:00:00.000Z'
};

export const mockAssessmentApproved = {
  id: 'assessment-101',
  user_id: 'demo-user',
  assessment_text: 'Your final approved fitness assessment recommends a comprehensive program including strength training, cardiovascular exercise, and flexibility work. This program is tailored to your specific goals and fitness level.',
  status: 'approved',
  created_at: '2023-01-01T00:00:00.000Z',
  updated_at: '2023-01-03T00:00:00.000Z',
  approved_at: '2023-01-03T00:00:00.000Z'
};
