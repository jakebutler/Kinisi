// Unit tests for surveyResponses utility functions
import { upsertSurveyResponse, getSurveyResponse } from '../../../utils/surveyResponses';
import { supabase } from '../../../utils/supabaseClient';
import { mockSurveyResponse } from '../../fixtures/surveys';

// Mock Supabase client
jest.mock('../../../utils/supabaseClient', () => ({
  supabase: {
    from: jest.fn()
  }
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('surveyResponses utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('upsertSurveyResponse', () => {
    describe('when upsert succeeds', () => {
      it('should successfully save survey response', async () => {
        const mockChain = {
          upsert: jest.fn().mockReturnThis(),
          select: jest.fn().mockResolvedValue({
            data: [mockSurveyResponse],
            error: null
          })
        };

        mockSupabase.from.mockReturnValue(mockChain as any);

        const result = await upsertSurveyResponse(
          'test-user-id-123',
          mockSurveyResponse.response
        );

        expect(result.data).toEqual([mockSurveyResponse]);
        expect(result.error).toBeNull();
        expect(mockSupabase.from).toHaveBeenCalledWith('survey_responses');
        expect(mockChain.upsert).toHaveBeenCalledWith(
          [{ user_id: 'test-user-id-123', response: mockSurveyResponse.response }],
          { onConflict: ['id'] }
        );
        expect(mockChain.select).toHaveBeenCalled();
      });

      it('should handle updating existing survey response', async () => {
        const updatedResponse = {
          ...mockSurveyResponse.response,
          fitnessLevel: 'advanced'
        };

        const mockChain = {
          upsert: jest.fn().mockReturnThis(),
          select: jest.fn().mockResolvedValue({
            data: [{ ...mockSurveyResponse, response: updatedResponse }],
            error: null
          })
        };

        mockSupabase.from.mockReturnValue(mockChain as any);

        const result = await upsertSurveyResponse('test-user-id-123', updatedResponse);

        expect(result.data?.[0].response.fitnessLevel).toBe('advanced');
        expect(result.error).toBeNull();
      });
    });

    describe('when upsert fails', () => {
      it('should return error when database operation fails', async () => {
        const dbError = { message: 'Constraint violation', code: '23505' };
        const mockChain = {
          upsert: jest.fn().mockReturnThis(),
          select: jest.fn().mockResolvedValue({
            data: null,
            error: dbError
          })
        };

        mockSupabase.from.mockReturnValue(mockChain as any);

        const result = await upsertSurveyResponse(
          'test-user-error',
          mockSurveyResponse.response
        );

        expect(result.data).toBeNull();
        expect(result.error).toEqual(dbError);
      });
    });
  });

  describe('getSurveyResponse', () => {
    describe('when survey response exists', () => {
      it('should return survey response for user', async () => {
        const mockChain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: [mockSurveyResponse],
            error: null
          })
        };

        mockSupabase.from.mockReturnValue(mockChain as any);

        const result = await getSurveyResponse('test-user-id-123');

        expect(result.data).toEqual([mockSurveyResponse]);
        expect(result.error).toBeNull();
        expect(mockSupabase.from).toHaveBeenCalledWith('survey_responses');
        expect(mockChain.select).toHaveBeenCalledWith('*');
        expect(mockChain.eq).toHaveBeenCalledWith('user_id', 'test-user-id-123');
        expect(mockChain.order).toHaveBeenCalledWith('updated_at', { ascending: false });
      });

      it('should return multiple survey responses ordered by updated_at', async () => {
        const olderResponse = {
          ...mockSurveyResponse,
          id: 'older-response',
          updated_at: '2023-12-01T00:00:00.000Z'
        };

        const mockChain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: [mockSurveyResponse, olderResponse], // Latest first
            error: null
          })
        };

        mockSupabase.from.mockReturnValue(mockChain as any);

        const result = await getSurveyResponse('test-user-multiple');

        expect(result.data).toHaveLength(2);
        expect(result.data?.[0].id).toBe(mockSurveyResponse.id); // Latest first
        expect(result.error).toBeNull();
      });
    });

    describe('when no survey response exists', () => {
      it('should return empty array when no responses found', async () => {
        const mockChain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        };

        mockSupabase.from.mockReturnValue(mockChain as any);

        const result = await getSurveyResponse('test-user-no-survey');

        expect(result.data).toEqual([]);
        expect(result.error).toBeNull();
      });
    });

    describe('when there are database errors', () => {
      it('should return error when database query fails', async () => {
        const dbError = { message: 'Connection timeout', code: 'TIMEOUT' };
        const mockChain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: null,
            error: dbError
          })
        };

        mockSupabase.from.mockReturnValue(mockChain as any);

        const result = await getSurveyResponse('test-user-error');

        expect(result.data).toBeNull();
        expect(result.error).toEqual(dbError);
      });

      it('should handle exceptions and return formatted error', async () => {
        const mockChain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockRejectedValue(new Error('Network failure'))
        };

        mockSupabase.from.mockReturnValue(mockChain as any);

        const result = await getSurveyResponse('test-user-exception');

        expect(result.data).toBeNull();
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error?.message).toBe('Failed to fetch survey response. Please try again.');
      });
    });
  });
});
