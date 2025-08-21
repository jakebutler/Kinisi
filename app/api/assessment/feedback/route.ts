import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { reviseAssessmentWithFeedback } from '../../../../utils/assessmentChain';
import { createSupabaseServerClient } from '../../../../utils/supabaseServer';

// POST /api/assessment/feedback
export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const { currentAssessment, feedback, surveyResponses, revisionOfAssessmentId } = body as {
      currentAssessment?: unknown;
      feedback?: unknown;
      surveyResponses?: unknown;
      revisionOfAssessmentId?: unknown;
    };

    // 1. Validate required fields
    const missing: string[] = [];
    if (typeof currentAssessment !== 'string' || !currentAssessment.trim()) missing.push('currentAssessment');
    if (typeof feedback !== 'string' || !feedback.trim()) missing.push('feedback');
    if (typeof surveyResponses !== 'object' || surveyResponses === null) missing.push('surveyResponses');
    if (missing.length) {
      return NextResponse.json({ error: `Missing or invalid: ${missing.join(', ')}` }, { status: 400 });
    }

    // Validate optional revisionOfAssessmentId if present
    if (revisionOfAssessmentId !== undefined) {
      const uuidRe = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
      if (typeof revisionOfAssessmentId !== 'string' || !uuidRe.test(revisionOfAssessmentId)) {
        return NextResponse.json({ error: 'Invalid revisionOfAssessmentId' }, { status: 400 });
      }
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    // Cast validated inputs to concrete types for type safety
    const currentAssessmentStr = currentAssessment as string;
    const feedbackStr = feedback as string;
    const surveyResponsesObj = surveyResponses as Record<string, unknown>;
    let revisedAssessment: string;
    try {
      revisedAssessment = await reviseAssessmentWithFeedback({
        currentAssessment: currentAssessmentStr,
        feedback: feedbackStr,
        surveyResponses: surveyResponsesObj,
      });
    } catch (e: unknown) {
      console.error('reviseAssessmentWithFeedback failed:', e);
      return NextResponse.json({ error: 'Failed to revise assessment' }, { status: 500 });
    }

    let assessmentResult;
    let assessmentError;
    
    // 4. Insert or Update assessment based on revisionOfAssessmentId
    const dataToSave = {
        user_id: user.id,
        survey_response_id: surveyResponseId, // Use the correctly extracted ID
        assessment: revisedAssessment,
        feedback: feedbackStr, // Store the feedback that led to this assessment
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
            .eq("id", revisionOfAssessmentId as string)
            .eq("user_id", user.id)
            .select("id, assessment")
            .maybeSingle(); // 0 or 1 row

        if (error) {
          assessmentError = error;
        } else if (!data) {
          return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
        } else {
          assessmentResult = data;
        }

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
            .select("id, assessment")
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
      console.error('Database operation returned no data:', assessmentError);
      return NextResponse.json({ error: "Failed to store revised assessment" }, { status: 500 });
    }


    // 6. Return success response
    return NextResponse.json({ assessment: assessmentResult.assessment, assessmentId: assessmentResult.id });

  } catch (error) {
    // Catch any unexpected errors during request processing or revisionChain call
    console.error('Assessment Feedback API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}