require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

const E2E_USER_ID_ENV = process.env.E2E_USER_ID || '';
const E2E_EMAIL = process.env.E2E_EMAIL || 'e2e@example.com';

function isUuid(v) {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(v);
}

function pad(n) { return String(n).padStart(2, '0'); }

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Resolve or create the E2E Auth user
  let E2E_USER_ID = E2E_USER_ID_ENV;
  if (!isUuid(E2E_USER_ID)) {
    try {
      // Scan pages to find matching email
      let page = 1;
      const perPage = 1000;
      let found = null;
      while (!found) {
        const res = await supabase.auth.admin.listUsers({ page, perPage });
        if (res.error) throw res.error;
        const users = res.data?.users || [];
        found = users.find((u) => u.email?.toLowerCase() === E2E_EMAIL.toLowerCase()) || null;
        if (found || users.length < perPage) break;
        page += 1;
      }
      if (found?.id) {
        E2E_USER_ID = found.id;
      } else {
        const created = await supabase.auth.admin.createUser({ email: E2E_EMAIL, email_confirm: true });
        if (created.error) throw created.error;
        E2E_USER_ID = created.data.user.id;
      }
      console.log(`[seed-unscheduled] Using auth user ${E2E_EMAIL} with id ${E2E_USER_ID}`);
      console.log('[seed-unscheduled] Tip: add E2E_USER_ID to your .env for faster subsequent runs.');
    } catch (e) {
      console.error('Failed to resolve/create E2E auth user via admin API:', e);
      process.exit(1);
    }
  }

  // Ensure a minimal survey response exists for the user
  try {
    const { data: existingSurvey } = await supabase
      .from('survey_responses')
      .select('id')
      .eq('user_id', E2E_USER_ID)
      .limit(1);
    if (!existingSurvey || existingSurvey.length === 0) {
      await supabase.from('survey_responses').insert([
        {
          user_id: E2E_USER_ID,
          response: {
            goal: 'general_fitness',
            experience: 'beginner',
            timeCommitment: { daysPerWeek: 3, minutesPerSession: 45, preferredTimeOfDay: 'morning' },
          },
        }
      ]);
    }
  } catch {}

  // Ensure an approved assessment exists
  try {
    const { data: existingAssess } = await supabase
      .from('assessments')
      .select('id, approved')
      .eq('user_id', E2E_USER_ID)
      .order('created_at', { ascending: false })
      .limit(1);
    if (existingAssess && existingAssess.length > 0) {
      const id = existingAssess[0].id;
      await supabase.from('assessments').update({ approved: true }).eq('id', id);
    } else {
      await supabase.from('assessments').insert([
        { user_id: E2E_USER_ID, assessment: 'E2E Approved Assessment', approved: true }
      ]);
    }
  } catch {}

  // Create an approved but UNSCHEDULED program for the E2E user.
  const today = new Date();
  const start_date = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`;

  // Minimal program_json without start_at fields
  const program_json = {
    weeks: [
      {
        week: 1,
        sessions: [
          { session: 1, goal: 'General fitness', uid: 'w1s1', exercises: [{ exercise_id: 'push-up', sets: 3, reps: 10 }] },
          { session: 2, goal: 'General fitness', uid: 'w1s2', exercises: [{ exercise_id: 'push-up', sets: 3, reps: 10 }] },
        ],
      },
    ],
  };

  const insert = await supabase
    .from('exercise_programs')
    .insert([
      {
        user_id: E2E_USER_ID,
        status: 'approved',
        approved_at: new Date().toISOString(),
        revision: 1,
        program_json,
        start_date,
        last_scheduled_at: null,
        scheduling_preferences: null,
      }
    ])
    .select('id')
    .single();

  if (insert.error) {
    console.error('Failed to insert UNSCHEDULED program:', insert.error);
    process.exit(1);
  }

  console.log('E2E unscheduled program seeded. Export for Playwright if needed:');
  console.log(`E2E_PROGRAM_ID_UNSCHEDULED=${insert.data.id}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
