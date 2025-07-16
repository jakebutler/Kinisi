import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../utils/supabaseClient';

// POST /api/assessment/approve
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Update the latest assessment for this user to approved
    const { data, error } = await supabase
      .from('assessments')
      .update({ approved: true })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .select();

    if (error) {
      console.error('Error approving assessment:', error);
      return NextResponse.json({ error: 'Failed to approve assessment' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in assessment approval:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
