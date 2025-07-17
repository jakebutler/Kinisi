// Unit tests for userFlow utility functions
import { hasCompletedSurvey, getPostLoginRedirect } from '../../../utils/userFlow';
import { getSurveyResponse } from '../../../utils/surveyResponses';
import { mockSurveyResponse, mockIncompleteSurveyResponse, mockEmptySurveyResponse } from '../../fixtures/surveys';

// Mock the surveyResponses module
jest.mock('../../../utils/surveyResponses');
const mockGetSurveyResponse = getSurveyResponse as jest.MockedFunction<typeof getSurveyResponse>;

describe('userFlow utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hasCompletedSurvey', () => {
    describe('when user has completed survey', () => {
      it('should return true for valid survey response', async () => {
        mockGetSurveyResponse.mockResolvedValue({
          data: [mockSurveyResponse],
          error: null
        });

        const result = await hasCompletedSurvey('test-user-id-123');
        
        expect(result).toBe(true);
        expect(mockGetSurveyResponse).toHaveBeenCalledWith('test-user-id-123');
      });
    });

    describe('when user has not completed survey', () => {
      it('should return false when no survey data exists', async () => {
        mockGetSurveyResponse.mockResolvedValue({
          data: [],
          error: null
        });

        const result = await hasCompletedSurvey('test-user-no-survey');
        
        expect(result).toBe(false);
      });

      it('should return false when survey response is incomplete', async () => {
        mockGetSurveyResponse.mockResolvedValue({
          data: [mockIncompleteSurveyResponse],
          error: null
        });

        const result = await hasCompletedSurvey('test-user-incomplete');
        
        expect(result).toBe(false);
      });

      it('should return false when survey response is empty', async () => {
        mockGetSurveyResponse.mockResolvedValue({
          data: [mockEmptySurveyResponse],
          error: null
        });

        const result = await hasCompletedSurvey('test-user-empty');
        
        expect(result).toBe(false);
      });

      it('should return false when survey response has no meaningful values', async () => {
        const surveyWithEmptyValues = {
          ...mockSurveyResponse,
          response: {
            field1: '',
            field2: null,
            field3: undefined
          }
        };

        mockGetSurveyResponse.mockResolvedValue({
          data: [surveyWithEmptyValues],
          error: null
        });

        const result = await hasCompletedSurvey('test-user-empty-values');
        
        expect(result).toBe(false);
      });
    });

    describe('when there are errors', () => {
      it('should return false when getSurveyResponse returns an error', async () => {
        mockGetSurveyResponse.mockResolvedValue({
          data: null,
          error: new Error('Database error')
        });

        const result = await hasCompletedSurvey('test-user-error');
        
        expect(result).toBe(false);
      });

      it('should return false when getSurveyResponse throws an exception', async () => {
        mockGetSurveyResponse.mockRejectedValue(new Error('Network error'));

        const result = await hasCompletedSurvey('test-user-exception');
        
        expect(result).toBe(false);
      });

      it('should handle invalid response data gracefully', async () => {
        mockGetSurveyResponse.mockResolvedValue({
          data: [{ ...mockSurveyResponse, response: 'invalid-data' }],
          error: null
        });

        const result = await hasCompletedSurvey('test-user-invalid');
        
        expect(result).toBe(false);
      });
    });
  });

  describe('getPostLoginRedirect', () => {
    describe('when user has completed survey', () => {
      it('should return dashboard path', async () => {
        mockGetSurveyResponse.mockResolvedValue({
          data: [mockSurveyResponse],
          error: null
        });

        const result = await getPostLoginRedirect('test-user-id-123');
        
        expect(result).toBe('/dashboard');
      });
    });

    describe('when user has not completed survey', () => {
      it('should return survey path', async () => {
        mockGetSurveyResponse.mockResolvedValue({
          data: [],
          error: null
        });

        const result = await getPostLoginRedirect('test-user-no-survey');
        
        expect(result).toBe('/survey');
      });
    });

    describe('when there are errors', () => {
      it('should default to survey path on error', async () => {
        mockGetSurveyResponse.mockResolvedValue({
          data: null,
          error: new Error('Database error')
        });

        const result = await getPostLoginRedirect('test-user-error');
        
        expect(result).toBe('/survey');
      });
    });
  });
});
