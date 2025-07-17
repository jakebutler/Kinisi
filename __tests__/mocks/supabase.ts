// Mock Supabase client for testing
import { mockUser, mockSession } from '../fixtures/users';
import { mockSurveyResponse } from '../fixtures/surveys';
import { mockAssessment } from '../fixtures/assessments';

// Mock Supabase client
export const createMockSupabaseClient = () => {
  const mockSelect = jest.fn().mockReturnThis();
  const mockEq = jest.fn().mockReturnThis();
  const mockOrder = jest.fn().mockReturnThis();
  const mockLimit = jest.fn().mockReturnThis();
  const mockSingle = jest.fn();
  const mockMaybeSingle = jest.fn();
  const mockInsert = jest.fn().mockReturnThis();
  const mockUpdate = jest.fn().mockReturnThis();
  const mockUpsert = jest.fn().mockReturnThis();

  const mockFrom = jest.fn((table: string) => {
    const chainable = {
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      upsert: mockUpsert,
      eq: mockEq,
      order: mockOrder,
      limit: mockLimit,
      single: mockSingle,
      maybeSingle: mockMaybeSingle
    };

    // Default successful responses based on table
    switch (table) {
      case 'survey_responses':
        mockSingle.mockResolvedValue({ data: mockSurveyResponse, error: null });
        mockMaybeSingle.mockResolvedValue({ data: mockSurveyResponse, error: null });
        break;
      case 'assessments':
        mockSingle.mockResolvedValue({ data: mockAssessment, error: null });
        mockMaybeSingle.mockResolvedValue({ data: mockAssessment, error: null });
        break;
      default:
        mockSingle.mockResolvedValue({ data: null, error: null });
        mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    }

    return chainable;
  });

  const mockAuth = {
    getSession: jest.fn().mockResolvedValue({
      data: { session: mockSession },
      error: null
    }),
    onAuthStateChange: jest.fn().mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } }
    }),
    signOut: jest.fn().mockResolvedValue({ error: null })
  };

  return {
    from: mockFrom,
    auth: mockAuth,
    // Expose mocks for test assertions
    _mocks: {
      from: mockFrom,
      select: mockSelect,
      eq: mockEq,
      order: mockOrder,
      limit: mockLimit,
      single: mockSingle,
      maybeSingle: mockMaybeSingle,
      insert: mockInsert,
      update: mockUpdate,
      upsert: mockUpsert,
      auth: mockAuth
    }
  };
};

// Default mock for jest.mock()
export const mockSupabaseClient = createMockSupabaseClient();
