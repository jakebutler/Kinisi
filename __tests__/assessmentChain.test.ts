import { generateAssessmentFromSurvey } from '../utils/assessmentChain';

describe('Assessment Chain (LangChain)', () => {
  it('should generate a coherent summary from survey responses', async () => {
    // Simulate survey responses
    const surveyResponses = {
      age: 32,
      activityLevel: 'Moderate',
      goals: 'Improve flexibility and reduce back pain',
      previousInjuries: 'Lower back strain',
      preferredTime: 'Morning'
    };

    // Call the chain (will fail until implemented)
    const assessment = await generateAssessmentFromSurvey(surveyResponses);

    // Expect a non-empty, relevant summary (placeholder expectation)
    expect(assessment).toMatch(/flexibility|back pain|morning/i);
  });
});
