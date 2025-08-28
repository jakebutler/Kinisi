require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

const E2E_USER_ID = process.env.E2E_USER_ID;
const E2E_EMAIL = process.env.E2E_EMAIL || 'e2e@example.com';

if (!E2E_USER_ID) {
  console.error('E2E_USER_ID is required');
  process.exit(1);
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Ensure a user row exists in the app's users table for FK constraints
  const { data: existing, error: selErr } = await supabase
    .from('users')
    .select('id')
    .eq('id', E2E_USER_ID)
    .limit(1);

  if (selErr) {
    console.error('Failed to query users table:', selErr);
    process.exit(1);
  }

  if (existing && existing.length > 0) {
    console.log('E2E user already exists:', E2E_USER_ID);
    return;
  }

  const insertedAt = new Date().toISOString();
  const { error: insErr } = await supabase.from('users').insert([
    {
      id: E2E_USER_ID,
      email: E2E_EMAIL,
      created_at: insertedAt,
      updated_at: insertedAt,
    },
  ]);

  if (insErr) {
    console.error('Failed to insert E2E user:', insErr);
    process.exit(1);
  }

  console.log('Inserted E2E user:', E2E_USER_ID);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
