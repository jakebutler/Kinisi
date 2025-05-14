// Import necessary testing utilities
import { createMocks } from 'node-mocks-http';

// Do NOT import the real API handler here. We will require/import it *after* mocks are set up.
// import handler from '../app/api/assessment/feedback/route';

// Do NOT import the real supabase client here
// import { supabase } from '../utils/supabaseClient';


// --- Mock external dependencies ---

// Mock the assessmentChain module
// Assumes reviseAssessmentWithFeedback is used by the API route
// --- Correct the path here ---
jest.mock('../utils/assessmentChain', () => ({
  // Mock the specific function export. Use jest.fn() so we can configure its return value per test.
  reviseAssessmentWithFeedback: jest.fn(),
}));
// Import the mocked function to configure it in tests
// --- Correct the path here as well ---
import { reviseAssessmentWithFeedback } from '../utils/assessmentChain';


// Mock the Supabase client module
jest.mock('../utils/supabaseClient', () => ({
  // Mock the 'supabase' object that is exported
  supabase: {
    from: jest.fn((tableName: string) => {
      const queryBuilderMock = {
        select: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        match: jest.fn().mockReturnThis(),
        filter: jest.fn().mockReturnThis(),

        single: jest.fn(),
        maybeSingle: jest.fn(),
      };

      queryBuilderMock.update = jest.fn((dataToUpdate: any) => {
         const updateBuilderMock = {
            eq: jest.fn().mockReturnThis(),
            match: jest.fn().mockReturnThis(),
            select: jest.fn((columns?: string) => {
                const updateSelectBuilderMock = {
                    single: jest.fn(),
                    maybeSingle: jest.fn(),
                };
                return updateSelectBuilderMock;
            }),
         };
         return updateBuilderMock;
      });

       queryBuilderMock.insert = jest.fn((dataToInsert: any) => {
         const insertBuilderMock = {
            select: jest.fn((columns?: string) => {
                 const insertSelectBuilderMock = {
                    single: jest.fn(),
                    maybeSingle: jest.fn(),
                 };
                 return insertSelectBuilderMock;
            }),
         };
         return insertBuilderMock;
      });

      return queryBuilderMock;
    }),
  },
}));

// Import the mocked supabase client to access its mock methods for configuration in tests
// --- Correct the path here as well ---
import { supabase } from '../utils/supabaseClient';


// --- Require the API handler AFTER the mock is set up ---
// Assuming POST is exported from your route file
// Correct the path to the route file as well - it's in app/api/assessment/feedback/route
// From __tests__ (root/kindisi-app), go down into app, then api, then assessment, then feedback, then route
import { POST as handlerPOST } from '../app/api/assessment/feedback/route';


// --- Test Suite ---

describe('/api/assessment/feedback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 if required fields are missing', async () => {
    // Mock the reviseAssessmentWithFeedback to not be called in this case
    reviseAssessmentWithFeedback.mockResolvedValue('SHOULD NOT BE CALLED');

    const { req, res } = createMocks({
      method: 'POST',
      body: { userId: 'user-1' } // missing currentAssessment, feedback, surveyResponses
    });

    await handlerPOST(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe('Missing surveyResponses or userId');
    expect(supabase.from).not.toHaveBeenCalled();
    expect(reviseAssessmentWithFeedback).not.toHaveBeenCalled();
  });

  it('returns 404 if initial survey response not found for the user', async () => {
    supabase.from('surveys').select().eq('user_id', 'user-1').single.mockResolvedValue({ data: null, error: null });
    reviseAssessmentWithFeedback.mockResolvedValue('SHOULD NOT BE CALLED');

    const { req, res } = createMocks({
      method: 'POST',
      body: { currentAssessment: 'Initial Assessment', feedback: 'Revise please', surveyResponses: {}, userId: 'user-1' }
    });

    await handlerPOST(req, res);

    expect(res._getStatusCode()).toBe(404);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe('Survey response not found');

    expect(supabase.from).toHaveBeenCalledWith('surveys');
    expect(supabase.from('surveys').select).toHaveBeenCalled();
    expect(supabase.from('surveys').select().eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(supabase.from('surveys').select().eq().single).toHaveBeenCalled();

    expect(supabase.from('assessments').update).not.toHaveBeenCalled();
    expect(supabase.from('assessments').insert).not.toHaveBeenCalled();
    expect(reviseAssessmentWithFeedback).not.toHaveBeenCalled();
  });

  it('returns 500 if database operation fails after revision (update path)', async () => {
      supabase.from('surveys').select().eq('user_id', 'user-1').single.mockResolvedValue({ data: { id: 'survey-1', response: {} }, error: null });
      reviseAssessmentWithFeedback.mockResolvedValue('SUCCESSFUL REVISED TEXT');
      supabase.from('assessments').update().eq('id', 'assessment-1').select().single.mockResolvedValue({ data: null, error: new Error('Mock Supabase update error') });
      supabase.from('assessments').insert().select().single.mockResolvedValue({ data: null, error: new Error('Mock Supabase insert error - should not be called') });


      const { req, res } = createMocks({
        method: 'POST',
        body: { currentAssessment: 'Initial Assessment', feedback: 'Revise please', surveyResponses: {}, userId: 'user-1', revisionOfAssessmentId: 'assessment-1' }
      });

      await handlerPOST(req, res);

      expect(res._getStatusCode()).toBe(500);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('Internal server error');

      expect(supabase.from).toHaveBeenCalledWith('surveys');
      expect(supabase.from('assessments').update).toHaveBeenCalled();
      expect(supabase.from('assessments').update().eq).toHaveBeenCalledWith('id', 'assessment-1');
      expect(supabase.from('assessments').update().eq().select).toHaveBeenCalled();
      expect(supabase.from('assessments').update().eq().select().single).toHaveBeenCalled();
      expect(reviseAssessmentWithFeedback).toHaveBeenCalled();

      expect(supabase.from('assessments').insert).not.toHaveBeenCalled();
    });


  it('returns 200 and updates existing assessment if revisionId is provided', async () => {
    supabase.from('surveys').select().eq('user_id', 'user-1').single.mockResolvedValue({ data: { id: 'survey-1', response: {} }, error: null });
    const mockRevisedText = 'This is the mocked revised assessment text.';
    reviseAssessmentWithFeedback.mockResolvedValue(mockRevisedText);
    const mockRevisedAssessmentId = 'mock-updated-assessment-id';
    supabase.from('assessments').update().eq('id', 'assessment-1').select().single.mockResolvedValue({
       data: {
         id: mockRevisedAssessmentId,
         user_id: 'user-1',
         assessment_text: mockRevisedText,
       },
       error: null
    });
     supabase.from('assessments').insert().select().single.mockResolvedValue({
       data: { id: 'mock-insert-id-should-not-be-used' },
       error: null
    });


    const { req, res } = createMocks({
      method: 'POST',
      body: { currentAssessment: 'Initial Assessment', feedback: 'Revise please', surveyResponses: {}, userId: 'user-1', revisionOfAssessmentId: 'assessment-1' }
    });

    await handlerPOST(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());

    expect(data.assessment).toBe(mockRevisedText);
    expect(data.assessmentId).toBe(mockRevisedAssessmentId);

    expect(reviseAssessmentWithFeedback).toHaveBeenCalledWith(
      'Initial Assessment',
      'Revise please',
      {},
      'user-1'
    );

    expect(supabase.from).toHaveBeenCalledWith('assessments');
    expect(supabase.from('assessments').update).toHaveBeenCalledWith(expect.objectContaining({
        user_id: 'user-1',
        assessment_text: mockRevisedText,
    }));
    expect(supabase.from('assessments').update().eq).toHaveBeenCalledWith('id', 'assessment-1');
    expect(supabase.from('assessments').update().eq().select).toHaveBeenCalled();
    expect(supabase.from('assessments').update().eq().select().single).toHaveBeenCalled();
    expect(supabase.from('assessments').insert).not.toHaveBeenCalled();
  });

   it('returns 200 and inserts new assessment if revisionId is missing', async () => {
       supabase.from('surveys').select().eq('user_id', 'user-1').single.mockResolvedValue({ data: { id: 'survey-1', response: {} }, error: null });
       const mockRevisedText = 'This is the mocked revised assessment text.';
       reviseAssessmentWithFeedback.mockResolvedValue(mockRevisedText);
       const mockInsertedAssessmentId = 'mock-new-assessment-id-from-insert';

       supabase.from('assessments').insert().select().single.mockResolvedValue({
          data: {
            id: mockInsertedAssessmentId,
            user_id: 'user-1',
            assessment_text: mockRevisedText,
          },
          error: null
       });
       supabase.from('assessments').update().eq().select().single.mockResolvedValue({
          data: { id: 'mock-update-id-should-not-be-used' }, error: null
       });


       const { req, res } = createMocks({
         method: 'POST',
         body: { currentAssessment: 'Initial Assessment', feedback: 'Revise please', surveyResponses: {}, userId: 'user-1' }
       });

       await handlerPOST(req, res);

       expect(res._getStatusCode()).toBe(200);
       const data = JSON.parse(res._getData());

       expect(data.assessment).toBe(mockRevisedText);
       expect(data.assessmentId).toBe(mockInsertedAssessmentId);

       expect(reviseAssessmentWithFeedback).toHaveBeenCalledWith(
         'Initial Assessment',
         'Revise please',
         {},
         'user-1'
       );

       expect(supabase.from).toHaveBeenCalledWith('assessments');
       expect(supabase.from('assessments').insert).toHaveBeenCalledWith(expect.objectContaining({
           user_id: 'user-1',
           assessment_text: mockRevisedText,
       }));
       expect(supabase.from('assessments').insert().select).toHaveBeenCalled();
       expect(supabase.from('assessments').insert().select().single).toHaveBeenCalled();

       expect(supabase.from('assessments').update).not.toHaveBeenCalled();
     });
});