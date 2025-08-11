import { NextRequest, NextResponse } from 'next/server';
import { generateAssessmentFromSurvey } from '../../../utils/assessmentChain';
import { createSupabaseServerClient } from '../../../utils/supabaseServer';

export const dynamic = 'force-dynamic';

// POST /api/assessment - Generate personalized assessment
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { surveyResponses } = body;
    if (!surveyResponses) {
      return NextResponse.json({ error: 'Missing surveyResponses' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    // Temporary debug: log cookie context and project URL
    try {
      const dbgUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      // next/headers cookies are not directly accessible here, but @supabase/ssr will read them.
      console.log('[assessment] Using SUPABASE_URL:', dbgUrl);
    } catch {}
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    const bearer = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : undefined;
    const {
      data: { user },
      error: userError,
    } = bearer ? await supabase.auth.getUser(bearer) : await supabase.auth.getUser();
    if (userError || !user) {
      console.warn('[assessment] Unauthorized. userError:', userError?.message, 'user null?', !user);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Call LangChain-powered assessment generator
    const assessment = await generateAssessmentFromSurvey(surveyResponses);

    // Find the latest survey_response_id for this user
    const { data: surveyRows, error: surveyError } = await supabase
      .from("survey_responses")
      .select("id")
      .eq("user_id", user.id)
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
          user_id: user.id,
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
