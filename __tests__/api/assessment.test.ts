import { NextRequest } from 'next/server';
import { POST } from '../../app/api/assessment/route';

// Mock dependencies
jest.mock('../../utils/assessmentChain', () => ({
  generateAssessmentFromSurvey: jest.fn()
}));

jest.mock('../../utils/supabaseServer', () => ({
  createSupabaseServerClient: jest.fn()
}));

const mockGenerateAssessment = require('../../utils/assessmentChain').generateAssessmentFromSurvey;
const mockCreateSupabaseServerClient = require('../../utils/supabaseServer').createSupabaseServerClient;

describe('/api/assessment', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = {
      auth: {
        getUser: jest.fn()
      },
      from: jest.fn((table: string) => {
        if (table === 'survey_responses') {
          return {
            insert: jest.fn(() => ({
              select: jest.fn(() => ({
                single: jest.fn(() => Promise.resolve({
                  data: { id: 'survey-1' },
                  error: null,
                }))
              }))
            }))
          };
        }
        if (table === 'assessments') {
          return {
            insert: jest.fn(() => ({
              select: jest.fn(() => ({
                single: jest.fn(() => Promise.resolve({
                  data: {
                    id: 'assessment-1',
                    user_id: 'user-1',
                    survey_response_id: 'survey-1',
                    assessment: 'Generated assessment',
                    approved: false,
                    created_at: new Date().toISOString(),
                  },
                  error: null,
                }))
              }))
            }))
          };
        }
        // Fallback chain, unlikely used after route change
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn(() => Promise.resolve({ data: [{ id: 'survey-1' }], error: null }))
              }))
            }))
          })),
        } as any;
      })
    };

    mockCreateSupabaseServerClient.mockResolvedValue(mockSupabase);
  });

  it('should return 400 when surveyResponses is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/assessment', {
      method: 'POST',
      body: JSON.stringify({})
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing surveyResponses');
  });

  it('should return 401 when user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid token' }
    });

    const request = new NextRequest('http://localhost:3000/api/assessment', {
      method: 'POST',
      body: JSON.stringify({ surveyResponses: { goal: 'fitness' } })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should include Authorization header in auth check', async () => {
    const mockUser = { id: 'user-1', email: 'test@example.com' };
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    });
    mockGenerateAssessment.mockResolvedValue('Generated assessment');

    const request = new NextRequest('http://localhost:3000/api/assessment', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ surveyResponses: { goal: 'fitness' } })
    });

    const response = await POST(request);

    expect(mockSupabase.auth.getUser).toHaveBeenCalledWith('test-token');
    expect(response.status).toBe(200);
  });

  it('should fallback to session auth when no Authorization header', async () => {
    const mockUser = { id: 'user-1', email: 'test@example.com' };
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    });
    mockGenerateAssessment.mockResolvedValue('Generated assessment');

    const request = new NextRequest('http://localhost:3000/api/assessment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ surveyResponses: { goal: 'fitness' } })
    });

    const response = await POST(request);

    expect(mockSupabase.auth.getUser).toHaveBeenCalledWith();
    expect(response.status).toBe(200);
  });

  it('should return 500 when assessment generation fails', async () => {
    const mockUser = { id: 'user-1', email: 'test@example.com' };
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    });
    mockGenerateAssessment.mockRejectedValue(new Error('LLM service unavailable'));

    const request = new NextRequest('http://localhost:3000/api/assessment', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({ surveyResponses: { goal: 'fitness' } })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to generate assessment');
  });

  it('should return 500 when storing survey response fails', async () => {
    const mockUser = { id: 'user-1', email: 'test@example.com' };
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    });
    mockGenerateAssessment.mockResolvedValue('Generated assessment');

    // Force survey_responses insert failure
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'survey_responses') {
        return {
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ data: null, error: { message: 'insert failed' } }))
            }))
          }))
        } as any;
      }
      // Should not reach assessments insert
      return {
        insert: jest.fn(() => ({
          select: jest.fn(() => ({ single: jest.fn(() => Promise.resolve({ data: null, error: null })) }))
        }))
      } as any;
    });

    const request = new NextRequest('http://localhost:3000/api/assessment', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer test-token' },
      body: JSON.stringify({ surveyResponses: { goal: 'fitness' } })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to store survey response');
  });

  it('should successfully generate and store assessment', async () => {
    const mockUser = { id: 'user-1', email: 'test@example.com' };
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    });
    mockGenerateAssessment.mockResolvedValue('Generated assessment content');

    const request = new NextRequest('http://localhost:3000/api/assessment', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({ surveyResponses: { goal: 'fitness', experience: 'beginner' } })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe('assessment-1');
    expect(data.assessment).toBe('Generated assessment');
    expect(mockGenerateAssessment).toHaveBeenCalledWith({ goal: 'fitness', experience: 'beginner' });
  });
});
