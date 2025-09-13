import 'server-only';
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

    // Insert a new survey_responses row (history model)
    const { data: insertedSurvey, error: insertSurveyError } = await supabase
      .from('survey_responses')
      .insert([{ user_id: user.id, response: surveyResponses }])
      .select('id')
      .single();

    if (insertSurveyError || !insertedSurvey) {
      console.error('[assessment] Failed to store survey response:', insertSurveyError);
      return NextResponse.json({ error: 'Failed to store survey response' }, { status: 500 });
    }

    const survey_response_id = insertedSurvey.id as string;

    // Call LangChain-powered assessment generator
    let assessment: string;
    try {
      assessment = await generateAssessmentFromSurvey(surveyResponses, { userId: user.id });
    } catch (e: unknown) {
      console.error('[assessment] Generation failed:', e);
      return NextResponse.json({ error: 'Failed to generate assessment' }, { status: 500 });
    }

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
      .select()
      .single();

    if (insertError || !insertData) {
      console.error('[assessment] Insert failed:', insertError?.message || insertError);
      return NextResponse.json({ error: "Failed to store assessment" }, { status: 500 });
    }

    // Return the inserted assessment row (aligns with client expectations in utils/assessments.ts)
    return NextResponse.json(insertData);
  } catch (error) {
    console.error('Assessment API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
