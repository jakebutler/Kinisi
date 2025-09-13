import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { reviseAssessmentWithFeedback } from '../../../../utils/assessmentChain';
import { createSupabaseServerClient } from '../../../../utils/supabaseServer';

// POST /api/assessment/feedback
export async function POST(req: NextRequest) {
  try {
    // Auth check first to ensure unauthenticated requests return 401 before validation
    const supabase = await createSupabaseServerClient();
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    const bearer = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : undefined;
    const {
      data: { user },
      error: userError,
    } = bearer ? await supabase.auth.getUser(bearer) : await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    // surveyResponses will be optional when revisionOfAssessmentId is supplied
    if (!revisionOfAssessmentId && (typeof surveyResponses !== 'object' || surveyResponses === null)) missing.push('surveyResponses');
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

    // user is authenticated at this point

    // Determine the survey to use: if revising a specific assessment, use its linked survey
    let surveyResponseId: string | null = null;
    let surveyResponsesObj: Record<string, unknown> | null = null;
    let providedSurveyFromBody = false;

    if (revisionOfAssessmentId) {
      const { data: assessRow, error: assessErr } = await supabase
        .from('assessments')
        .select('id, user_id, survey_response_id')
        .eq('id', String(revisionOfAssessmentId))
        .eq('user_id', user.id)
        .single();

      if (assessErr || !assessRow) {
        return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
      }

      surveyResponseId = assessRow.survey_response_id as string;
      const { data: surveyRow, error: sErr } = await supabase
        .from('survey_responses')
        .select('id, response')
        .eq('id', surveyResponseId)
        .single();
      if (sErr || !surveyRow) {
        return NextResponse.json({ error: 'Could not find survey response for assessment' }, { status: 404 });
      }
      surveyResponsesObj = surveyRow.response as Record<string, unknown>;
    }

    // If not revising a specific assessment, use provided surveyResponses or fallback to latest
    if (!surveyResponsesObj) {
      if (typeof surveyResponses === 'object' && surveyResponses !== null) {
        surveyResponsesObj = surveyResponses as Record<string, unknown>;
        providedSurveyFromBody = true;
      } else {
        const { data: latestSurvey, error: latestErr } = await supabase
          .from('survey_responses')
          .select('id, response')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestErr) {
          console.error('Database error fetching survey response:', latestErr);
          return NextResponse.json({ error: 'Database error fetching survey response' }, { status: 500 });
        }
        if (!latestSurvey) {
          return NextResponse.json({ error: 'Could not find survey response for user' }, { status: 404 });
        }
        surveyResponseId = latestSurvey.id as string;
        surveyResponsesObj = latestSurvey.response as Record<string, unknown>;
      }
    }

    // If client supplied surveyResponses in the body (and we are not revising an existing assessment),
    // persist them to survey_responses and capture the id for linkage.
    if (!revisionOfAssessmentId && providedSurveyFromBody && surveyResponsesObj) {
      const { data: insertedSurvey, error: insertSurveyError } = await supabase
        .from('survey_responses')
        .insert([{ user_id: user.id, response: surveyResponsesObj }])
        .select('id')
        .single();

      if (insertSurveyError || !insertedSurvey) {
        console.error('Database error saving supplied survey response:', insertSurveyError);
        return NextResponse.json({ error: 'Failed to store survey response' }, { status: 500 });
      }
      surveyResponseId = insertedSurvey.id as string;
    }

    // 3. Call LangChain-powered revision agent (Moved here)
    // Cast validated inputs to concrete types for type safety
    const currentAssessmentStr = currentAssessment as string;
    const feedbackStr = feedback as string;
    let revisedAssessment: string;
    try {
      revisedAssessment = await reviseAssessmentWithFeedback({
        currentAssessment: currentAssessmentStr,
        feedback: feedbackStr,
        surveyResponses: (surveyResponsesObj ?? {}) as Record<string, any>,
        userId: user.id,
        revisionOfAssessmentId: revisionOfAssessmentId as string | undefined,
      });
    } catch (e: unknown) {
      console.error('reviseAssessmentWithFeedback failed:', e);
      return NextResponse.json({ error: 'Failed to revise assessment' }, { status: 500 });
    }

    let assessmentResult;
    let assessmentError;
    
    // 4. Insert assessment: append-only for revisions (use revision_of)
    if (revisionOfAssessmentId) {
        const { data, error } = await supabase
            .from("assessments")
            .insert([
              {
                user_id: user.id,
                survey_response_id: surveyResponseId,
                assessment: revisedAssessment,
                feedback: feedbackStr,
                revision_of: String(revisionOfAssessmentId),
              }
            ])
            .select("id, assessment")
            .single();

        assessmentResult = data;
        assessmentError = error;
    } else {
         const { data, error } = await supabase
            .from("assessments")
            .insert([
              {
                user_id: user.id,
                survey_response_id: surveyResponseId,
                assessment: revisedAssessment,
                feedback: feedbackStr,
                revision_of: null,
              }
            ])
            .select("id, assessment")
            .single();

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