import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;

let adminClient: SupabaseClient | undefined = undefined;
if (supabaseUrl && serviceKey) {
  adminClient = createClient(supabaseUrl, serviceKey);
}

export const supabaseAdmin = adminClient;
