import { supabase } from './supabaseClient';
import { Database } from '../types/supabase';

// Survey response TypeScript type (matches Supabase schema)
export type SurveyResponse = {
  id: string;
  user_id: string;
  response: any;
  created_at: string;
  updated_at: string;
};

// Save or update survey response (auto-save)
export async function upsertSurveyResponse(userId: string, response: any) {
  const { data, error } = await supabase
    .from('survey_responses')
    .upsert([{ user_id: userId, response }], { onConflict: 'id' })
    .select();
  return { data, error };
}

// Get latest survey response for a user
export async function getSurveyResponse(userId: string) {
  try {
    const { data, error } = await supabase
      .from('survey_responses')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    
    return { data, error };
  } catch (err) {
    console.error('Error fetching survey response:', err);
    return { data: null, error: new Error('Failed to fetch survey response. Please try again.') };
  }
}
