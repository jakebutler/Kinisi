// Mock generateAssessmentFromSurvey with inline mock
const mockGenerateAssessmentFromSurvey = jest.fn();

jest.mock('../utils/assessmentChain', () => ({
  generateAssessmentFromSurvey: mockGenerateAssessmentFromSurvey
}));

// Import after mocking
import { generateAssessmentFromSurvey } from '../utils/assessmentChain';


describe('Assessment Chain (LangChain)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate a coherent summary from survey responses', async () => {
    // Setup mock response
    const mockAssessment = "Mocked assessment summary based on input survey data.";
    mockGenerateAssessmentFromSurvey.mockResolvedValue(mockAssessment);

    // Simulate survey responses - This will be the input to the mocked function
    const surveyResponses = {
      age: 32,
      activityLevel: 'Moderate',
      goals: 'Improve flexibility and reduce back pain',
      previousInjuries: 'Lower back strain',
      preferredTime: 'Morning'
    };

    // Call the mocked function
    const assessment = await generateAssessmentFromSurvey(surveyResponses);

    // *** Expect the assessment to be the string returned by the MOCKED function ***
    expect(assessment).toBe(mockAssessment);

    // Assert that the mocked function was called with the correct input
    expect(mockGenerateAssessmentFromSurvey).toHaveBeenCalledWith(surveyResponses);
    expect(mockGenerateAssessmentFromSurvey).toHaveBeenCalledTimes(1);
  });
});