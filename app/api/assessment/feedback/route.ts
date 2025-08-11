import { NextRequest, NextResponse } from 'next/server';
import { reviseAssessmentWithFeedback } from '../../../../utils/assessmentChain';
import { createSupabaseServerClient } from '../../../../utils/supabaseServer';
import { getAuthenticatedUser } from '../../../../utils/auth';

// POST /api/assessment/feedback
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { currentAssessment, feedback, surveyResponses, revisionOfAssessmentId } = body;

    // 1. Validate required fields
    if (!currentAssessment || !feedback || !surveyResponses) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { user, response } = await getAuthenticatedUser(supabase);
    if (!user) return response;


    // 2. Find the latest survey_response_id for this user
    const { data: surveyRows, error: surveyError } = await supabase
      .from("survey_responses")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(); // Use maybeSingle as we expect 0 or 1 result

    if (surveyError) {
      console.error('Database error fetching survey response:', surveyError);
      return NextResponse.json({ error: "Database error fetching survey response" }, { status: 500 });
    }

    if (!surveyRows) { // surveyRows will be null if no rows are found with maybeSingle()
      return NextResponse.json({ error: "Could not find survey response for user" }, { status: 404 });
    }

    // Extract the survey response ID - FIX for ReferenceError
    const surveyResponseId = surveyRows.id;

    // 3. Call LangChain-powered revision agent (Moved here)
    const revisedAssessment = await reviseAssessmentWithFeedback({
      currentAssessment,
      feedback,
      surveyResponses
    });

    let assessmentResult;
    let assessmentError;
    
    // 4. Insert or Update assessment based on revisionOfAssessmentId
    const dataToSave = {
        user_id: user.id,
        survey_response_id: surveyResponseId, // Use the correctly extracted ID
        assessment: revisedAssessment,
        feedback: feedback, // Store the feedback that led to this assessment
    };

    if (revisionOfAssessmentId) {
        // Update existing assessment
        console.log(`Attempting to update assessment ID: ${revisionOfAssessmentId}`);
        const { data, error } = await supabase
            .from("assessments")
            .update({
                ...dataToSave,
                // We don't change revision_of on an update of a revision
                // It should point to the original or previous revision if applicable
                // For this logic, we assume revisionOfAssessmentId *is* the record being updated
            })
            .eq("id", revisionOfAssessmentId)
            .eq("user_id", user.id)
            .select()
            .single(); // Expecting the updated row back

        assessmentResult = data;
        assessmentError = error;

    } else {
        // Insert new assessment
        console.log('Attempting to insert new assessment');
         const { data, error } = await supabase
            .from("assessments")
            .insert([
                {
                    ...dataToSave,
                    revision_of: null, // New assessments don't revise others
                }
            ])
            .select()
            .single(); // Expecting the inserted row back

        assessmentResult = data;
        assessmentError = error;
         
    }

    // 5. Handle DB operation result
    if (assessmentError) {
      console.error('Database error saving assessment:', assessmentError);
      return NextResponse.json({ error: "Failed to store revised assessment" }, { status: 500 });
    }

     // Supabase update/insert single() returns the object directly in data if successful
     // If data is null or undefined here, it might indicate an issue even without a specific error object
    if (!assessmentResult) {
         console.error('Database operation returned no data:', assessmentError); // Log error object if it exists
         return NextResponse.json({ error: "Failed to store revised assessment (no data returned)" }, { status: 500 });
    }


    // 6. Return success response
    return NextResponse.json({ assessment: assessmentResult.assessment, assessmentId: assessmentResult.id });

  } catch (error) {
    // Catch any unexpected errors during request processing or revisionChain call
    console.error('Assessment Feedback API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}