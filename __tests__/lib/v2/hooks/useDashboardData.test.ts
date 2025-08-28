import { renderHook, waitFor } from '@testing-library/react';
import { useDashboardData } from '@/lib/v2/hooks/useDashboardData';
import { useUser } from '@/lib/v2/contexts/UserContext';
import { supabase } from '@/utils/supabaseClient';

// Mock dependencies
jest.mock('@/lib/v2/contexts/UserContext');
jest.mock('@/utils/supabaseClient');

const mockUseUser = useUser as jest.MockedFunction<typeof useUser>;
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('useDashboardData Hook', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    username: 'testuser'
  };

  const mockProgram = {
    id: 'program-1',
    user_id: 'test-user-id',
    status: 'approved',
    program_json: [{ week: 1, sessions: [] }],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    last_scheduled_at: '2024-01-02T00:00:00Z'
  };

  const mockAssessment = {
    id: 'assessment-1',
    user_id: 'test-user-id',
    survey_response_id: 'survey-1',
    assessment: 'Test assessment content',
    approved: true,
    created_at: '2024-01-01T00:00:00Z'
  };

  const mockSurveyData = {
    id: 'survey-1',
    user_id: 'test-user-id',
    response_data: { primaryGoal: 'weight_loss' },
    created_at: '2024-01-01T00:00:00Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockUseUser.mockReturnValue({
      user: mockUser,
      userStatus: 'active',
      loading: false,
      setUser: jest.fn(),
      setUserStatus: jest.fn(),
      refreshUserStatus: jest.fn(),
      signOut: jest.fn()
    });

    // Mock Supabase responses
    mockSupabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [],
              error: null
            })
          })
        })
      })
    });
  });

  it('initializes with loading state', () => {
    const { result } = renderHook(() => useDashboardData());
    
    expect(result.current.loading).toBe(true);
    expect(result.current.program).toBe(null);
    expect(result.current.assessment).toBe(null);
    expect(result.current.surveyData).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('loads program data successfully', async () => {
    // Mock successful program response
    mockSupabase.from = jest.fn().mockImplementation((table) => {
      if (table === 'exercise_programs') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({
                  data: [mockProgram],
                  error: null
                })
              })
            })
          })
        };
      }
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: [],
                error: null
              })
            })
          })
        })
      };
    });

    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.program).toEqual(mockProgram);
    expect(result.current.error).toBe(null);
  });

  it('loads assessment data successfully', async () => {
    // Mock successful assessment response
    mockSupabase.from = jest.fn().mockImplementation((table) => {
      if (table === 'assessments') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({
                  data: [mockAssessment],
                  error: null
                })
              })
            })
          })
        };
      }
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: [],
                error: null
              })
            })
          })
        })
      };
    });

    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.assessment).toEqual(mockAssessment);
    expect(result.current.error).toBe(null);
  });

  it('loads survey data successfully', async () => {
    // Mock successful survey response
    mockSupabase.from = jest.fn().mockImplementation((table) => {
      if (table === 'survey_responses') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({
                  data: [mockSurveyData],
                  error: null
                })
              })
            })
          })
        };
      }
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: [],
                error: null
              })
            })
          })
        })
      };
    });

    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.surveyData).toEqual(mockSurveyData);
    expect(result.current.error).toBe(null);
  });

  it('handles database errors gracefully', async () => {
    // Mock database error
    mockSupabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed' }
            })
          })
        })
      })
    });

    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load dashboard data');
    expect(result.current.program).toBe(null);
    expect(result.current.assessment).toBe(null);
    expect(result.current.surveyData).toBe(null);
  });

  it('does not load data when user is not available', () => {
    mockUseUser.mockReturnValue({
      user: null,
      userStatus: 'onboarding',
      loading: false,
      setUser: jest.fn(),
      setUserStatus: jest.fn(),
      refreshUserStatus: jest.fn(),
      signOut: jest.fn()
    });

    const { result } = renderHook(() => useDashboardData());

    expect(result.current.loading).toBe(true);
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it('refreshes data when refreshData is called', async () => {
    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Clear previous calls
    jest.clearAllMocks();

    // Call refreshData
    result.current.refreshData();

    // Verify data is being reloaded
    expect(mockSupabase.from).toHaveBeenCalled();
  });

  it('loads all data types simultaneously', async () => {
    // Mock successful responses for all data types
    mockSupabase.from = jest.fn().mockImplementation((table) => {
      switch (table) {
        case 'exercise_programs':
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [mockProgram],
                    error: null
                  })
                })
              })
            })
          };
        case 'assessments':
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [mockAssessment],
                    error: null
                  })
                })
              })
            })
          };
        case 'survey_responses':
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [mockSurveyData],
                    error: null
                  })
                })
              })
            })
          };
        default:
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [],
                    error: null
                  })
                })
              })
            })
          };
      }
    });

    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.program).toEqual(mockProgram);
    expect(result.current.assessment).toEqual(mockAssessment);
    expect(result.current.surveyData).toEqual(mockSurveyData);
    expect(result.current.error).toBe(null);
  });
});
