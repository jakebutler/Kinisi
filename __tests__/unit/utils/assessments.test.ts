// Unit tests for assessment utility functions
import { getLatestAssessment, generateAndStoreAssessment } from '../../../utils/assessments';
import { supabase } from '../../../utils/supabaseClient';
import { mockAssessment } from '../../fixtures/assessments';
import { mockSurveyResponse } from '../../fixtures/surveys';

// Mock Supabase client
jest.mock('../../../utils/supabaseClient', () => ({
  supabase: {
    from: jest.fn()
  }
}));

// Mock fetch for API calls
global.fetch = jest.fn();

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('assessment utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getLatestAssessment', () => {
    describe('when assessment exists', () => {
      it('should return the latest assessment for a user', async () => {
        const mockChain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: mockAssessment,
            error: null
          })
        };

        mockSupabase.from.mockReturnValue(mockChain as any);

        const result = await getLatestAssessment('test-user-id-123');

        expect(result.data).toEqual(mockAssessment);
        expect(result.error).toBeNull();
        expect(mockSupabase.from).toHaveBeenCalledWith('assessments');
        expect(mockChain.select).toHaveBeenCalledWith('*');
        expect(mockChain.eq).toHaveBeenCalledWith('user_id', 'test-user-id-123');
        expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: false });
        expect(mockChain.limit).toHaveBeenCalledWith(1);
      });
    });

    describe('when no assessment exists', () => {
      it('should return null data when no assessment found', async () => {
        const mockChain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: null
          })
        };

        mockSupabase.from.mockReturnValue(mockChain as any);

        const result = await getLatestAssessment('test-user-no-assessment');

        expect(result.data).toBeNull();
        expect(result.error).toBeNull();
      });
    });

    describe('when there are database errors', () => {
      it('should return error when database query fails', async () => {
        const dbError = new Error('Database connection failed');
        const mockChain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          single: jest.fn().mockRejectedValue(dbError)
        };

        mockSupabase.from.mockReturnValue(mockChain as any);

        const result = await getLatestAssessment('test-user-error');

        expect(result.data).toBeNull();
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error?.message).toBe('Database connection failed');
      });

      it('should handle Supabase error responses', async () => {
        const supabaseError = { message: 'Row not found', code: '404' };
        const mockChain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: supabaseError
          })
        };

        mockSupabase.from.mockReturnValue(mockChain as any);

        const result = await getLatestAssessment('test-user-not-found');

        expect(result.data).toBeNull();
        expect(result.error).toEqual(supabaseError);
      });
    });
  });

  describe('generateAndStoreAssessment', () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

    describe('when assessment generation succeeds', () => {
      it('should generate and return assessment data', async () => {
        const mockResponse = {
          ok: true,
          json: jest.fn().mockResolvedValue({
            assessment: mockAssessment.assessment,
            assessmentId: mockAssessment.id
          })
        };
        
        mockFetch.mockResolvedValue(mockResponse as any);
        
        const result = await generateAndStoreAssessment(
          'test-user-id-123',
          mockSurveyResponse.response
        );
        
        expect(result.data).toEqual({
          id: '',
          user_id: '',
          assessment: mockAssessment.assessment,
          survey_response_id: '',
          created_at: '',
          updated_at: '',
        });
        expect(result.error).toBeNull();
        expect(mockFetch).toHaveBeenCalledWith('/api/assessment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: 'test-user-id-123',
            surveyResponses: mockSurveyResponse.response,
          }),
        });
      });
    });

    describe('when assessment generation fails', () => {
      it('should return error when API request fails', async () => {
        const mockResponse = {
          ok: false,
          status: 500,
          statusText: 'Internal Server Error'
        };

        mockFetch.mockResolvedValue(mockResponse as any);

        const result = await generateAndStoreAssessment(
          'test-user-error',
          mockSurveyResponse.response
        );

        expect(result.data).toBeNull();
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error?.message).toBe('Failed to generate assessment');
      });

      it('should handle network errors', async () => {
        mockFetch.mockRejectedValue(new Error('Network error'));

        const result = await generateAndStoreAssessment(
          'test-user-network-error',
          mockSurveyResponse.response
        );

        expect(result.data).toBeNull();
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error?.message).toBe('Network error');
      });

      it('should handle JSON parsing errors', async () => {
        const mockResponse = {
          ok: true,
          json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
        };

        mockFetch.mockResolvedValue(mockResponse as any);

        const result = await generateAndStoreAssessment(
          'test-user-json-error',
          mockSurveyResponse.response
        );

        expect(result.data).toBeNull();
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error?.message).toBe('Invalid JSON');
      });
    });
  });
});
