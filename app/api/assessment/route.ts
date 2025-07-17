import { NextRequest, NextResponse } from 'next/server';
import { generateAssessmentFromSurvey } from '../../../utils/assessmentChain';
import { supabase } from '../../../utils/supabaseClient';

// POST /api/assessment - Generate personalized assessment
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { surveyResponses, userId } = body;
    if (!surveyResponses || !userId) {
      return NextResponse.json({ error: 'Missing surveyResponses or userId' }, { status: 400 });
    }

    // Call LangChain-powered assessment generator
    const assessment = await generateAssessmentFromSurvey(surveyResponses);

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

    // Insert assessment into the database
    const { data: insertData, error: insertError } = await supabase
      .from("assessments")
      .insert([
        {
          user_id: userId,
          survey_response_id,
          assessment,
        }
      ])
      .select();

    if (insertError || !insertData || insertData.length === 0) {
      return NextResponse.json({ error: "Failed to store assessment" }, { status: 500 });
    }

    const assessmentId = insertData[0].id;

    return NextResponse.json({ assessment, assessmentId });
  } catch (error) {
    console.error('Assessment API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
