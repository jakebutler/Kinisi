// Manual mock to avoid importing ESM @supabase/supabase-js in Jest
// Tests do not need a real admin client; API code handles undefined client gracefully
export const supabaseAdmin = undefined as any;
