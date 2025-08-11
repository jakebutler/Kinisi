import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../utils/supabaseServer';

// POST /api/assessment/approve
export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the latest assessment id for this user
    const { data: latest, error: latestError } = await supabase
      .from('assessments')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestError || !latest) {
      return NextResponse.json({ error: 'No assessment found for user' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('assessments')
      .update({ approved: true })
      .eq('id', latest.id)
      .select();

    if (error) {
      console.error('Supabase error approving assessment:', error);
      return NextResponse.json({ error: `Supabase error: ${error.message || error}` }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'No assessment updated' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in assessment approval:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
