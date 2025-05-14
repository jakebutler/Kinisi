import { NextRequest, NextResponse } from 'next/server';
import { reviseAssessmentWithFeedback } from '../../../../utils/assessmentChain';
import { supabase } from '../../../../utils/supabaseClient';

// POST /api/assessment/feedback
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { currentAssessment, feedback, surveyResponses, userId, revisionOfAssessmentId } = body;
    if (!currentAssessment || !feedback || !surveyResponses || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Call LangChain-powered revision agent
    const revisedAssessment = await reviseAssessmentWithFeedback({
      currentAssessment,
      feedback,
      surveyResponses
    });

    // Find the latest survey_response_id for this user
    const { data: surveyRows, error: surveyError } = await supabase
      .from("survey_responses")
      .select("id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (surveyError || !surveyRows || surveyRows.length === 0) {
      return NextResponse.json({ error: "Could not find survey response for user" }, { status: 404 });
    }

    const survey_response_id = surveyRows[0].id;

    // Insert revised assessment into the database
    const { data: insertData, error: insertError } = await supabase
      .from("assessments")
      .insert([
        {
          user_id: userId,
          survey_response_id,
          assessment: revisedAssessment,
          feedback,
          revision_of: revisionOfAssessmentId || null,
        }
      ])
      .select();

    if (insertError || !insertData || insertData.length === 0) {
      return NextResponse.json({ error: "Failed to store revised assessment" }, { status: 500 });
    }

    const revisedAssessmentId = insertData[0].id;

    return NextResponse.json({ assessment: revisedAssessment, assessmentId: revisedAssessmentId });
  } catch (error) {
    console.error('Assessment Feedback API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
