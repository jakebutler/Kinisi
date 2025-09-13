import { NextRequest } from 'next/server';
import { POST } from '../../app/api/assessment/feedback/route';

jest.mock('../../utils/assessmentChain', () => ({
  reviseAssessmentWithFeedback: jest.fn().mockResolvedValue('revised-assessment')
}));

jest.mock('../../utils/supabaseServer', () => ({
  createSupabaseServerClient: jest.fn()
}));

const mockCreateSupabaseServerClient = require('../../utils/supabaseServer').createSupabaseServerClient;

describe('/api/assessment/feedback (append-only revisions)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('inserts a new assessment row with revision_of when revising an existing assessment', async () => {
    const mockUser = { id: 'user-1' };

    const mockSupabase = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }) },
      from: jest.fn((table: string) => {
        if (table === 'assessments') {
          return {
            // When fetching the original assessment to get survey_response_id
            select: jest.fn((cols: string) => {
              if (cols.includes('survey_response_id')) {
                return {
                  eq: jest.fn(() => ({
                    eq: jest.fn(() => ({
                      single: jest.fn(() => Promise.resolve({
                        data: { id: 'a-old', user_id: 'user-1', survey_response_id: 'survey-1' },
                        error: null,
                      }))
                    }))
                  }))
                } as any;
              }
              // After insert, selecting id, assessment
              return {
                single: jest.fn(() => Promise.resolve({
                  data: { id: 'a-new', assessment: 'revised-assessment' },
                  error: null,
                }))
              } as any;
            }),
            insert: jest.fn(() => ({
              select: jest.fn(() => ({
                single: jest.fn(() => Promise.resolve({
                  data: { id: 'a-new', assessment: 'revised-assessment' },
                  error: null,
                }))
              }))
            })),
          } as any;
        }
        if (table === 'survey_responses') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => Promise.resolve({
                  data: { id: 'survey-1', response: {} },
                  error: null,
                }))
              }))
            }))
          } as any;
        }
        return {} as any;
      }),
    };

    mockCreateSupabaseServerClient.mockResolvedValue(mockSupabase);

    const request = new NextRequest('http://localhost:3000/api/assessment/feedback', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        currentAssessment: 'old',
        feedback: 'please revise',
        revisionOfAssessmentId: '123e4567-e89b-12d3-a456-426614174000'
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.assessmentId).toBe('a-new');
    expect(data.assessment).toBe('revised-assessment');
  });

  it('persists provided surveyResponses before inserting a new assessment when not revising', async () => {
    const mockUser = { id: 'user-1' };

    const insertedSurvey = { id: 'survey-2' };

    const mockSupabase = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }) },
      from: jest.fn((table: string) => {
        if (table === 'survey_responses') {
          return {
            insert: jest.fn(() => ({
              select: jest.fn(() => ({
                single: jest.fn(() => Promise.resolve({ data: insertedSurvey, error: null }))
              }))
            })),
          } as any;
        }
        if (table === 'assessments') {
          return {
            insert: jest.fn(() => ({
              select: jest.fn(() => ({
                single: jest.fn(() => Promise.resolve({
                  data: { id: 'a-new', assessment: 'revised-assessment' },
                  error: null,
                }))
              }))
            })),
          } as any;
        }
        return {} as any;
      }),
    };

    mockCreateSupabaseServerClient.mockResolvedValue(mockSupabase);

    const request = new NextRequest('http://localhost:3000/api/assessment/feedback', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        currentAssessment: 'current',
        feedback: 'new feedback',
        surveyResponses: { goal: 'fitness' }
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.assessmentId).toBe('a-new');
    expect(data.assessment).toBe('revised-assessment');
  });
});
