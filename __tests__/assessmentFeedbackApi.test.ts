// Import necessary testing utilities
import { NextRequest, NextResponse } from 'next/server';

// Mock external dependencies
jest.mock('../utils/assessmentChain', () => ({
  reviseAssessmentWithFeedback: jest.fn(),
}));
import { reviseAssessmentWithFeedback } from '../utils/assessmentChain';

// --- Refined Supabase Mock Setup ---
jest.mock('../utils/supabaseClient', () => ({
  supabase: {
    // The 'from' method is the entry point. We will mock its implementation
    // in beforeEach to return a fresh set of chainable mocks for each test.
    from: jest.fn(),
    // No need to expose mockSingle/maybeSingle here, they are variables in beforeEach
  },
}));

// Import the mocked supabase client to access its 'from' mock method
import { supabase } from '../utils/supabaseClient';

// Helper function to create a mock NextRequest object
const createMockRequest = (body: any, method: string = 'POST'): NextRequest => {
    // Use a more explicit mock structure for the request
    const mockReq = {
        method: method,
        // Explicitly mock the json() method to return the body using global jest.fn()
        json: jest.fn().mockResolvedValue(body),
        headers: new Headers({'Content-Type': 'application/json'}),
        url: 'http://localhost/api/assessment/feedback',
        // Add other properties/methods of NextRequest if accessed in the handler
        // For example, if your handler uses req.nextUrl, req.cookies, req.signal, etc.:
        // nextUrl: new URL('http://localhost/api/assessment/feedback'),
        // cookies: { get: jest.fn() }, // Mock cookies if needed
        // signal: new AbortController().signal, // Mock signal if needed
        // ip: '127.0.0.1', // Mock IP if needed
    };
    // Cast to any to satisfy type checks, as this is a partial mock for testing purposes
    // Ensure you add mocks for any other req properties your handler might access
    return mockReq as any;
};


// Import the actual API handler
import { POST as handlerPOST } from '../app/api/assessment/feedback/route';


// Test Suite
describe('/api/assessment/feedback', () => {
  let mockSingle: jest.Mock; // Variable to hold the fresh single mock instance
  let mockMaybeSingle: jest.Mock; // Variable to hold the fresh maybeSingle mock instance

  beforeEach(() => {
    // Clear all mocks before each test using global jest
    jest.clearAllMocks();

    // --- Define the core terminal mock functions ---
    // These are the functions that the handler calls at the end of chains
    // We configure Promises on *these* Jest functions using global jest.fn().
    // These mocks are awaitable directly.
    mockSingle = jest.fn();
    mockMaybeSingle = jest.fn();

    // Helper to create a mock builder object that can be chained
    const createMockBuilder = (name: string = 'builder'): any => {
        const builder: any = {
            // Chainable methods - return a new builder instance created by the helper
            select: jest.fn(() => createMockBuilder(`${name}.select`)), // Still create new builder for clarity
            eq: jest.fn(() => createMockBuilder(`${name}.eq`)),
            order: jest.fn(() => createMockBuilder(`${name}.order`)),
            match: jest.fn(() => createMockBuilder(`${name}.match`)),
            filter: jest.fn(() => createMockBuilder(`${name}.filter`)),

            // Method that precedes the terminal call - returns an object with terminal methods
            limit: jest.fn(() => {
                 const limitReturn = { // Object returned by limit()
                     single: mockSingle, // Points to shared mockSingle (for .single() called after limit())
                     maybeSingle: mockMaybeSingle, // Points to shared maybeSingle (for .maybeSingle() called after limit())
                     _mockName: `${name}.limit.awaitable`,
                     // REMOVED .then() method - Jest should await the single/maybeSingle calls directly
                 };
                 return limitReturn;
             }),

            // Terminal methods (also available directly on builder) - Return the shared mock functions themselves
            single: mockSingle, // These point to the shared mock functions
            maybeSingle: mockMaybeSingle, // These point to the shared mock functions

             _mockName: name, // Add name for debugging
        };

        // Implement update/insert which return builders with specific methods
        builder.update = jest.fn(() => {
            const updateBuilder = createMockBuilder(`${name}.update`);
            updateBuilder.eq = jest.fn(() => {
                const updateEqBuilder = createMockBuilder(`${name}.update.eq`);
                // After update().eq(), select() returns an object with terminal methods
                updateEqBuilder.select = jest.fn(() => ({
                    single: mockSingle, // Point to the shared mockSingle
                    maybeSingle: mockMaybeSingle, // Point to the shared maybeSingle
                    _mockName: `${name}.update.eq.select.awaitable`,
                    // REMOVED .then() method
                 }));
                // Direct calls after eq() like .single() or .maybeSingle()
                updateEqBuilder.single = mockSingle;
                updateEqBuilder.maybeSingle = mockMaybeSingle;
                return updateEqBuilder;
            });
            // Direct calls after update() like .single() or .maybeSingle()
            updateBuilder.single = mockSingle;
            updateBuilder.maybeSingle = mockMaybeSingle;
            return updateBuilder;
        });

        builder.insert = jest.fn(() => {
             const insertBuilder = createMockBuilder(`${name}.insert`);
             insertBuilder.select = jest.fn(() => ({
                 single: mockSingle, // Point to the shared mockSingle
                 maybeSingle: mockMaybeSingle, // Point to the shared maybeSingle
                  _mockName: `${name}.insert.select.awaitable`,
                  // REMOVED .then() method
             }));
             // Direct calls after insert() like .single() or .maybeSingle()
             insertBuilder.single = mockSingle;
             insertBuilder.maybeSingle = mockMaybeSingle;
             return insertBuilder;
        });

        return builder;
    };

    // Implement the supabase.from mock to return the initial builder using global jest.Mock
    (supabase.from as jest.Mock).mockImplementation((tableName: string) => {
        const builder = createMockBuilder(tableName); // Create a fresh builder for each table
        builder.tableName = tableName; // Add tableName property
        return builder;
    });
  }); // End beforeEach


  // Use global it
  it('returns 400 if required fields are missing', async () => {
    // No revision is attempted if fields are missing
    reviseAssessmentWithFeedback.mockResolvedValue('SHOULD NOT BE CALLED');

    // Create a request missing 'feedback', 'surveyResponses', 'currentAssessment'
    const mockReq = createMockRequest({ userId: 'user-1' });
    const response = await handlerPOST(mockReq);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Missing required fields');

    // No database or external API calls should occur
    expect(supabase.from).not.toHaveBeenCalled();
    expect(reviseAssessmentWithFeedback).not.toHaveBeenCalled();
    expect(mockSingle).not.toHaveBeenCalled();
    expect(mockMaybeSingle).not.toHaveBeenCalled();
  });

   // Updated test for 404 scenario to match handler using maybeSingle()
   // And update the mockResolvedValueOnce to provide data structure expected by handler's maybeSingle() result
   // Corrected assertion pattern for the chained calls.
  it('returns 404 if initial survey response not found for the user', async () => {
    // Handler uses .limit(1).maybeSingle() for the survey lookup.
    // Configure mockMaybeSingle to return the not-found result for the FIRST DB call.
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

    // Revision should NOT be called if survey is not found
    reviseAssessmentWithFeedback.mockResolvedValue('SHOULD NOT BE CALLED');

    const mockReq = createMockRequest({ currentAssessment: 'Initial Assessment', feedback: 'Revise please', surveyResponses: {}, userId: 'user-1' });
    const response = await handlerPOST(mockReq);

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('Could not find survey response for user');

    // Assert that mockMaybeSingle was called exactly once (by the survey lookup)
    expect(mockMaybeSingle).toHaveBeenCalledTimes(1);
    // Ensure mockSingle was NOT called in this path
    expect(mockSingle).not.toHaveBeenCalled();


    // Assert the chain calls for survey_responses using the corrected pattern
    expect(supabase.from).toHaveBeenCalledWith('survey_responses');
    const surveyFromCall = (supabase.from as jest.Mock).mock.results.find(call => call.value.tableName === 'survey_responses')?.value;
    expect(surveyFromCall).toBeDefined(); // Ensure the from call happened

    // Get the mock object returned by select('id')
    const selectCall = surveyFromCall.select.mock.results[0]?.value;
    expect(selectCall).toBeDefined(); // Ensure select was called and returned an object
    expect(surveyFromCall.select).toHaveBeenCalledWith("id"); // Assert select was called on fromCall

    // Get the mock object returned by eq('user_id', userId)
    const eqCall = selectCall.eq.mock.results[0]?.value;
    expect(eqCall).toBeDefined();
    expect(selectCall.eq).toHaveBeenCalledWith('user_id', 'user-1'); // Assert eq was called on selectCall

    // Get the mock object returned by order(...)
    const orderCall = eqCall.order.mock.results[0]?.value;
    expect(orderCall).toBeDefined();
    expect(eqCall.order).toHaveBeenCalledWith("created_at", { ascending: false }); // Assert order was called on eqCall

    // Get the mock object returned by limit(...)
    const limitCall = orderCall.limit.mock.results[0]?.value;
    expect(limitCall).toBeDefined();
    expect(orderCall.limit).toHaveBeenCalledWith(1); // Assert limit was called on orderCall

    // Assert the final terminal call on the object returned by limit()
    expect(limitCall.maybeSingle).toHaveBeenCalledTimes(1);


    expect(supabase.from).not.toHaveBeenCalledWith('assessments'); // No assessments interaction if survey not found
    expect(reviseAssessmentWithFeedback).not.toHaveBeenCalled(); // Revision should not happen
  });

    // Test for DB error during survey lookup
    // Corrected assertion pattern for the chained calls.
    it('returns 500 if database error occurs during survey lookup', async () => {
        // Handler uses .limit(1).maybeSingle() for the survey lookup.
        // Configure mockMaybeSingle to return an error for the FIRST DB call.
        const mockError = new Error('Mock Supabase survey lookup error');
        mockMaybeSingle.mockResolvedValueOnce({ data: null, error: mockError });


        // Revision should NOT be called if DB error occurs
        reviseAssessmentWithFeedback.mockResolvedValue('SHOULD NOT BE CALLED');

        const mockReq = createMockRequest({ currentAssessment: 'Initial Assessment', feedback: 'Revise please', surveyResponses: {}, userId: 'user-1' });
        const response = await handlerPOST(mockReq);

        expect(response.status).toBe(500);
        // Expecting the specific error message from the handler's database error check
        const data = await response.json();
        expect(data.error).toBe('Database error fetching survey response');

        // Assert that mockMaybeSingle was called exactly once
        expect(mockMaybeSingle).toHaveBeenCalledTimes(1);
         expect(mockSingle).not.toHaveBeenCalled();


        // Assert the chain calls for survey_responses using the corrected pattern
        expect(supabase.from).toHaveBeenCalledWith('survey_responses');
         const surveyFromCall = (supabase.from as jest.Mock).mock.results.find(call => call.value.tableName === 'survey_responses')?.value;
         expect(surveyFromCall).toBeDefined();

         const selectCall = surveyFromCall.select.mock.results[0]?.value;
         expect(selectCall).toBeDefined();
         expect(surveyFromCall.select).toHaveBeenCalledWith("id");

         const eqCall = selectCall.eq.mock.results[0]?.value;
         expect(eqCall).toBeDefined();
         expect(selectCall.eq).toHaveBeenCalledWith('user_id', 'user-1');

         const orderCall = eqCall.order.mock.results[0]?.value;
         expect(orderCall).toBeDefined();
         expect(eqCall.order).toHaveBeenCalledWith("created_at", { ascending: false });

         const limitCall = orderCall.limit.mock.results[0]?.value;
         expect(limitCall).toBeDefined();
         expect(orderCall.limit).toHaveBeenCalledWith(1);

         const limitCallResult = limitCall.maybeSingle.mock.results[0]?.value; // Result of maybeSingle() - data/error object
         expect(limitCall.maybeSingle).toHaveBeenCalledTimes(1); // Assert maybeSingle was called on the object returned by limit()


        expect(supabase.from).not.toHaveBeenCalledWith('assessments'); // No assessments interaction
        expect(reviseAssessmentWithFeedback).not.toHaveBeenCalled(); // Revision should not happen
    });


   it('returns 500 if database operation fails after revision (update path)', async () => {
       // Handler uses .limit(1).maybeSingle() for the survey lookup (1st call)
       // Configure mockMaybeSingle to succeed for the FIRST DB call.
       mockMaybeSingle.mockResolvedValueOnce({ data: { id: 'survey-1', response: {} }, error: null });

       // Handler uses update()...select().single() for the assessment update (2nd call)
       // Configure mockSingle to fail for the SECOND DB call.
       const mockUpdateError = new Error('Mock Supabase update error');
       mockSingle.mockResolvedValueOnce({ data: null, error: mockUpdateError });

       // Configure any subsequent mock calls if they were to happen (not expected in this path)
       mockMaybeSingle.mockResolvedValueOnce('SHOULD NOT BE CALLED');
       mockSingle.mockResolvedValueOnce('SHOULD NOT BE CALLED');


       reviseAssessmentWithFeedback.mockResolvedValue('SUCCESSFUL REVISED TEXT');
       const mockReq = createMockRequest({ currentAssessment: 'Initial Assessment', feedback: 'Revise please', surveyResponses: {}, userId: 'user-1', revisionOfAssessmentId: 'assessment-1' });
       const response = await handlerPOST(mockReq);

       expect(response.status).toBe(500);
       // The handler's specific DB error handler returns 'Failed to store revised assessment'.
       const data = await response.json();
       expect(data.error).toBe('Failed to store revised assessment');

       // Assert that mockMaybeSingle was called once (survey lookup)
       expect(mockMaybeSingle).toHaveBeenCalledTimes(1);
       // Assert that mockSingle was called once (update attempt)
       expect(mockSingle).toHaveBeenCalledTimes(1);


       // Assert that the correct chains were initiated using the corrected pattern
       expect(supabase.from).toHaveBeenCalledWith('survey_responses');
       expect(supabase.from).toHaveBeenCalledWith('assessments');

        const assessmentsFromCall = (supabase.from as jest.Mock).mock.results.find(call => call.value.tableName === 'assessments')?.value;
        expect(assessmentsFromCall).toBeDefined();


       // Verify the update chain was called
       const updateCall = assessmentsFromCall.update.mock.results[0]?.value;
       expect(updateCall).toBeDefined();
        expect(assessmentsFromCall.update).toHaveBeenCalledWith(expect.objectContaining({
            user_id: 'user-1',
            survey_response_id: 'survey-1', // Assert the extracted ID is used
            assessment: 'SUCCESSFUL REVISED TEXT',
            feedback: 'Revise please',
       }));

       const updateEqCall = updateCall.eq.mock.results[0]?.value;
       expect(updateEqCall).toBeDefined();
       expect(updateCall.eq).toHaveBeenCalledWith('id', 'assessment-1');

       const updateSelectCall = updateEqCall.select.mock.results[0]?.value;
       expect(updateSelectCall).toBeDefined();
       expect(updateEqCall.select).toHaveBeenCalledTimes(1); // Assert select was called after eq()

       // Assert single was called on the object returned by select()
       expect(updateSelectCall.single).toHaveBeenCalledTimes(1);


       expect(assessmentsFromCall?.insert).not.toHaveBeenCalled(); // Insert should not happen in update path
       expect(reviseAssessmentWithFeedback).toHaveBeenCalledTimes(1); // Revision should happen before DB op
     });


   it('returns 200 and updates existing assessment if revisionId is provided', async () => {
     // Handler uses .limit(1).maybeSingle() for the survey lookup (1st call)
     // Configure mockMaybeSingle to succeed for the FIRST DB call.
     mockMaybeSingle.mockResolvedValueOnce({ data: { id: 'survey-1', response: {} }, error: null });

     const mockRevisedText = 'This is the mocked revised assessment text.';
     reviseAssessmentWithFeedback.mockResolvedValue(mockRevisedText);
     const mockUpdatedAssessmentId = 'mock-updated-assessment-id';

     // Handler uses update()...select().single() for the assessment update (2nd call)
     // Configure mockSingle to succeed for the SECOND DB call.
     mockSingle.mockResolvedValueOnce({
        data: { // single() returns the object directly, not in an array
          id: mockUpdatedAssessmentId,
          user_id: 'user-1',
          assessment: mockRevisedText,
          feedback: 'Revise please',
          // revision_of is not in dataToSave in handler update path
        },
        error: null
     });

     // Configure any subsequent mock calls if they were to happen (not expected in this path)
      mockMaybeSingle.mockResolvedValueOnce('SHOULD NOT BE CALLED');
      mockSingle.mockResolvedValueOnce('SHOULD NOT BE CALLED');


     const mockReq = createMockRequest({ currentAssessment: 'Initial Assessment', feedback: 'Revise please', surveyResponses: {}, userId: 'user-1', revisionOfAssessmentId: 'assessment-1' });
     const response = await handlerPOST(mockReq);

     expect(response.status).toBe(200);
     const data = await response.json();

     expect(data).toHaveProperty('assessment', mockRevisedText); // Handler returns assessment from DB result
     expect(data).toHaveProperty('assessmentId', mockUpdatedAssessmentId);

     // Assert reviseAssessmentWithFeedback was called with correct arguments
     expect(reviseAssessmentWithFeedback).toHaveBeenCalledWith({
       currentAssessment: 'Initial Assessment',
       feedback: 'Revise please',
       surveyResponses: {},
       // The handler's reviseAssessmentWithFeedback call doesn't pass userId
     });


     // Assert that mockMaybeSingle was called once (survey lookup)
     expect(mockMaybeSingle).toHaveBeenCalledTimes(1);
     // Assert that mockSingle was called once (update)
     expect(mockSingle).toHaveBeenCalledTimes(1);

     // Assert that the correct chains were initiated using the corrected pattern
     expect(supabase.from).toHaveBeenCalledWith('survey_responses');
     expect(supabase.from).toHaveBeenCalledWith('assessments');
     const assessmentsFromCall = (supabase.from as jest.Mock).mock.results.find(call => call.value.tableName === 'assessments')?.value;
     expect(assessmentsFromCall).toBeDefined();

     const updateCall = assessmentsFromCall.update.mock.results[0]?.value;
     expect(updateCall).toBeDefined();
     expect(assessmentsFromCall.update).toHaveBeenCalledWith(expect.objectContaining({
         user_id: 'user-1',
         survey_response_id: 'survey-1', // Assert the extracted ID is used
         assessment: mockRevisedText,
         feedback: 'Revise please',
     }));

     const updateEqCall = updateCall.eq.mock.results[0]?.value;
     expect(updateEqCall).toBeDefined();
     expect(updateCall.eq).toHaveBeenCalledWith('id', 'assessment-1');

     const updateSelectCall = updateEqCall.select.mock.results[0]?.value;
     expect(updateSelectCall).toBeDefined();
     expect(updateEqCall.select).toHaveBeenCalledTimes(1);

     expect(updateSelectCall.single).toHaveBeenCalledTimes(1); // Assert single was called on the object returned by select()


     expect(assessmentsFromCall?.insert).not.toHaveBeenCalled();
     expect(reviseAssessmentWithFeedback).toHaveBeenCalledTimes(1);
   });

    // Test for DB error during insert
    // Corrected assertion pattern for the chained calls and insert argument.
    it('returns 500 if database operation fails after revision (insert path)', async () => {
        // Handler uses .limit(1).maybeSingle() for the survey lookup (1st call)
        // Configure mockMaybeSingle to succeed for the FIRST DB call.
        mockMaybeSingle.mockResolvedValueOnce({ data: { id: 'survey-1', response: {} }, error: null });

        const mockRevisedText = 'This is the mocked revised assessment text.';
        reviseAssessmentWithFeedback.mockResolvedValue(mockRevisedText);

        // Handler uses insert()...select().single() for the assessment insert (2nd call)
        // Configure mockSingle to fail for the SECOND DB call.
        const mockInsertError = new Error('Mock Supabase insert error');
        mockSingle.mockResolvedValueOnce({ data: null, error: mockInsertError });

        // Configure any subsequent mock calls if they were to happen (not expected in this path)
        mockMaybeSingle.mockResolvedValueOnce('SHOULD NOT BE CALLED');
        mockSingle.mockResolvedValueOnce('SHOULD NOT BE CALLED');


        const mockReq = createMockRequest({ currentAssessment: 'Initial Assessment', feedback: 'Revise please', surveyResponses: {}, userId: 'user-1' }); // No revisionOfAssessmentId
        const response = await handlerPOST(mockReq);

        expect(response.status).toBe(500);
        // Expecting the specific DB error message
        const data = await response.json();
        expect(data.error).toBe('Failed to store revised assessment');

        // Assert that mockMaybeSingle was called once (survey lookup)
        expect(mockMaybeSingle).toHaveBeenCalledTimes(1);
        // Assert that mockSingle was called once (insert attempt)
        expect(mockSingle).toHaveBeenCalledTimes(1);


        // Assert that the correct chains were initiated using the corrected pattern
        expect(supabase.from).toHaveBeenCalledWith('survey_responses');
        expect(supabase.from).toHaveBeenCalledWith('assessments');
        const assessmentsFromCall = (supabase.from as jest.Mock).mock.results.find(call => call.value.tableName === 'assessments')?.value;
        expect(assessmentsFromCall).toBeDefined();


        // Verify the insert chain was called and assert the argument correctly
        const insertDataToSave = {
            user_id: 'user-1',
            survey_response_id: 'survey-1', // Assert the extracted ID is used
            assessment: mockRevisedText,
            feedback: 'Revise please',
            revision_of: null, // Should be null for a new insert
        };
        // Assert insert was called with an array containing the data object
        expect(assessmentsFromCall.insert).toHaveBeenCalledWith([expect.objectContaining(insertDataToSave)]);

        const insertCall = assessmentsFromCall.insert.mock.results[0]?.value; // Get the mock object returned by insert()
        expect(insertCall).toBeDefined();

        const insertSelectCall = insertCall.select.mock.results[0]?.value; // Get the mock object returned by select()
        expect(insertSelectCall).toBeDefined();
        expect(insertCall.select).toHaveBeenCalledTimes(1); // Assert select was called after insert()

        expect(insertSelectCall.single).toHaveBeenCalledTimes(1); // Assert single was called on the select() awaitable


        expect(assessmentsFromCall?.update).not.toHaveBeenCalled(); // Update should not happen in insert path
        expect(reviseAssessmentWithFeedback).toHaveBeenCalledTimes(1); // Revision should happen before DB op
    });


   it('returns 200 and inserts new assessment if revisionId is missing', async () => {
        // Handler uses .limit(1).maybeSingle() for the survey lookup (1st call)
        // Configure mockMaybeSingle to succeed for the FIRST DB call.
        mockMaybeSingle.mockResolvedValueOnce({ data: { id: 'survey-1', response: {} }, error: null });

        const mockRevisedText = 'This is the mocked revised assessment text.';
        reviseAssessmentWithFeedback.mockResolvedValue(mockRevisedText);
        const mockInsertedAssessmentId = 'mock-new-assessment-id-from-insert';

        // Handler uses insert()...select().single() for the assessment insert (2nd call)
        // Configure mockSingle to succeed for the SECOND DB call.
        mockSingle.mockResolvedValueOnce({
           data: { // single() returns the object directly, not in an array
             id: mockInsertedAssessmentId,
             user_id: 'user-1',
             assessment: mockRevisedText,
             feedback: 'Revise please',
             revision_of: null,
           },
           error: null
        });

        // Configure any subsequent mock calls if they were to happen (not expected in this path)
        mockMaybeSingle.mockResolvedValueOnce('SHOULD NOT BE CALLED');
        mockSingle.mockResolvedValueOnce('SHOULD NOT BE CALLED');


        const mockReq = createMockRequest({ currentAssessment: 'Initial Assessment', feedback: 'Revise please', surveyResponses: {}, userId: 'user-1' }); // No revisionOfAssessmentId
        const response = await handlerPOST(mockReq);

        expect(response.status).toBe(200);
        const data = await response.json();

        expect(data).toHaveProperty('assessment', mockRevisedText); // Handler returns assessment from DB result
        expect(data).toHaveProperty('assessmentId', mockInsertedAssessmentId);


        // Assert reviseAssessmentWithFeedback was called with correct arguments
        expect(reviseAssessmentWithFeedback).toHaveBeenCalledWith({
          currentAssessment: 'Initial Assessment',
          feedback: 'Revise please',
          surveyResponses: {},
          // The handler's reviseAssessmentWithFeedback call doesn't pass userId
        });

        // Assert that mockMaybeSingle was called once (survey lookup)
        expect(mockMaybeSingle).toHaveBeenCalledTimes(1);
        // Assert that mockSingle was called once (insert)
        expect(mockSingle).toHaveBeenCalledTimes(1);


        // Assert that the correct chains were initiated using the corrected pattern
        expect(supabase.from).toHaveBeenCalledWith('survey_responses');
        expect(supabase.from).toHaveBeenCalledWith('assessments');
        const assessmentsFromCall = (supabase.from as jest.Mock).mock.results.find(call => call.value.tableName === 'assessments')?.value;
        expect(assessmentsFromCall).toBeDefined();


        // Verify the insert chain was called and assert the argument correctly
        const insertDataToSave = {
            user_id: 'user-1',
            survey_response_id: 'survey-1', // Assert the extracted ID is used
            assessment: mockRevisedText,
            feedback: 'Revise please',
            revision_of: null,
        };
         // Assert insert was called with an array containing the data object
        expect(assessmentsFromCall.insert).toHaveBeenCalledWith([expect.objectContaining(insertDataToSave)]);


         const insertCall = assessmentsFromCall.insert.mock.results[0]?.value; // Get the mock object returned by insert()
         expect(insertCall).toBeDefined();

         const insertSelectCall = insertCall.select.mock.results[0]?.value; // Get the mock object returned by select()
         expect(insertSelectCall).toBeDefined();
         expect(insertCall.select).toHaveBeenCalledTimes(1); // Assert select was called after insert()

         expect(insertSelectCall.single).toHaveBeenCalledTimes(1); // Assert single was called on the select() awaitable


        expect(assessmentsFromCall?.update).not.toHaveBeenCalled();
        expect(reviseAssessmentWithFeedback).toHaveBeenCalledTimes(1);
      });
});