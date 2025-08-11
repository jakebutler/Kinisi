import { supabase } from './supabaseClient';
import type { SupabaseClient } from '@supabase/supabase-js';
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
export async function upsertSurveyResponse(userId: string, response: any, client?: SupabaseClient) {
  // History model: always insert a new row; latest is by created_at/updated_at desc
  const db = client ?? supabase;
  const table: any = (db as any).from('survey_responses');
  if (typeof table.insert === 'function') {
    const { data, error } = await table
      .insert([{ user_id: userId, response }])
      .select();
    return { data, error };
  }
  // Fallback for test mocks that only implement upsert
  const { data, error } = await table
    .upsert([{ user_id: userId, response }], { onConflict: 'id' })
    .select();
  return { data, error };
}

// Get latest survey response for a user
export async function getSurveyResponse(userId: string, client?: SupabaseClient) {
  try {
    const db = client ?? supabase;
    const { data, error } = await db
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
