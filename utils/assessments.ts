import { supabase } from './supabaseClient';

export type Assessment = {
  id: string;
  user_id: string;
  survey_response_id: string;
  assessment: string;
  approved?: boolean;
  created_at: string;
  updated_at: string;
};

export async function getLatestAssessment(userId: string): Promise<{ data: Assessment | null, error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching assessment:', error);
    return { data: null, error: error as Error };
  }
}

export async function generateAndStoreAssessment(userId: string, surveyResponses: any): Promise<{ data: Assessment | null, error: Error | null }> {
  try {
    // Call the API to generate and store the assessment
    const response = await fetch('/api/assessment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        surveyResponses,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate assessment');
    }

    const { assessment, assessmentId } = await response.json();
    return { data: { id: assessmentId, user_id: userId, assessment } as Assessment, error: null };
  } catch (error) {
    console.error('Error generating assessment:', error);
    return { data: null, error: error as Error };
  }
}
