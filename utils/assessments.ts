import { supabase } from './supabaseClient';
import { handleApiError } from './errorHandling';
import { SurveyResponses } from '../types/supabase.types';

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
    const chain = supabase
      .from('assessments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1) as any;
    // Use maybeSingle when available to avoid 406, fallback to single for older mocks/tests
    const { data, error } = typeof chain.maybeSingle === 'function' ? await chain.maybeSingle() : await chain.single();
    return handleApiError(data, error);
  } catch (error: any) {
    return { data: null, error: error instanceof Error ? error : new Error(error?.message || String(error)) };
  }
}

export async function generateAndStoreAssessment(userId: string, surveyResponses: SurveyResponses): Promise<{ data: Assessment | null, error: Error | null }> {
  try {
    // Ensure server route receives auth via cookies and Authorization header
    const { data: sess } = await supabase.auth.getSession();
    const accessToken = sess?.session?.access_token;
    const response = await fetch('/api/assessment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify({ userId, surveyResponses }),
    });

    if (!response.ok) {
      let msg = 'Failed to generate assessment';
      try {
        const err = await response.json();
        if (err?.error) msg = err.error;
      } catch {}
      return { data: null, error: new Error(msg) };
    }

    const result = await response.json();
    // Ensure all required fields are present in the returned Assessment object
    const assessment: Assessment = {
      id: result.id || '',
      user_id: result.user_id || '',
      assessment: result.assessment || '',
      survey_response_id: result.survey_response_id || '',
      created_at: result.created_at || '',
      updated_at: result.updated_at || '',
    };
    return { data: assessment, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error') };
  }
}
