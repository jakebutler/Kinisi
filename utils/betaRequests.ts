import { supabase } from './supabaseClient';
import type { SupabaseClient } from '@supabase/supabase-js';

export type BetaRequest = {
  id: string;
  email: string;
  name?: string | null;
  referral_source?: string | null;
  created_at: string;
};

export async function findBetaRequestByEmail(email: string, client?: SupabaseClient): Promise<BetaRequest | null> {
  const db = client || supabase;
  const { data, error } = await db
    .from('beta_requests')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error) throw error;
  return data as BetaRequest | null;
}

export async function createBetaRequest(input: { email: string; name?: string; referral_source?: string }, client?: SupabaseClient): Promise<BetaRequest> {
  const db = client || supabase;
  const { data, error } = await db
    .from('beta_requests')
    .insert({ email: input.email, name: input.name, referral_source: input.referral_source })
    .select()
    .single();

  if (error) throw error;
  return data as BetaRequest;
}
