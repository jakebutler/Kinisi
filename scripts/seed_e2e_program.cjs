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
function formatLocalISO(d) {
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function findUserByEmail(admin, email) {
  let page = 1;
  const perPage = 1000;
  while (true) {
    const res = await admin.listUsers({ page, perPage });
    if (res.error) throw res.error;
    const users = res.data?.users || [];
    const hit = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) return hit;
    if (!users.length || users.length < perPage) return null;
    page += 1;
  }
}

async function pickAnyExerciseId(supabase) {
  const { data, error } = await supabase.from('exercises').select('exercise_id').limit(1);
  if (error) return 'push-up';
  return data?.[0]?.exercise_id || 'push-up';
}

function buildScheduledProgram(exampleExerciseId) {
  // 2 weeks x 3 sessions, each with one exercise
  const program = { weeks: [] };
  const start = new Date();
  start.setHours(0,0,0,0);
  let cursor = new Date(start);
  for (let w = 0; w < 2; w++) {
    const week = { week: w + 1, sessions: [] };
    for (let s = 0; s < 3; s++) {
      const startAt = new Date(cursor);
      startAt.setHours(8, 0, 0, 0);
      const session = {
        session: s + 1,
        goal: 'General fitness',
        exercises: [
          { exercise_id: exampleExerciseId, sets: 3, reps: 10 }
        ],
        uid: `w${w+1}s${s+1}`,
        start_at: formatLocalISO(startAt),
        duration_minutes: 60,
      };
      week.sessions.push(session);
      // advance one day
      cursor.setDate(cursor.getDate() + 1);
    }
    program.weeks.push(week);
  }
  return program;
}

async function ensureAssessmentForUser(supabase, userId) {
  // Best-effort: mark an assessment approved if table exists
  try {
    const { data: existing } = await supabase
      .from('assessments')
      .select('id, approved')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);
    if (existing && existing.length > 0) {
      const id = existing[0].id;
      await supabase.from('assessments').update({ approved: true }).eq('id', id);
      return;
    }
    // Insert minimal approved assessment if possible
    await supabase.from('assessments').insert([
      {
        user_id: userId,
        assessment: 'E2E Approved Assessment',
        approved: true,
        survey_response_id: null,
      }
    ]);
  } catch {}
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Resolve or create the E2E Auth user
  let E2E_USER_ID = E2E_USER_ID_ENV;
  if (!isUuid(E2E_USER_ID)) {
    try {
      // Try to find by email first via listUsers scan
      const existing = await findUserByEmail(supabase.auth.admin, E2E_EMAIL);
      if (existing?.id) {
        E2E_USER_ID = existing.id;
      } else {
        const created = await supabase.auth.admin.createUser({ email: E2E_EMAIL, email_confirm: true });
        if (created.error) throw created.error;
        E2E_USER_ID = created.data.user.id;
      }
      console.log(`[seed] Using auth user ${E2E_EMAIL} with id ${E2E_USER_ID}`);
      console.log('[seed] Tip: add E2E_USER_ID to your .env to avoid admin lookups next time.');
    } catch (e) {
      console.error('Failed to resolve/create E2E auth user via admin API:', e);
      process.exit(1);
    }
  }

  // Ensure a minimal-but-complete survey response (>=3 fields)
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

  // Try to pick any exercise id
  const exId = await pickAnyExerciseId(supabase);
  const program_json = buildScheduledProgram(exId);
  const today = new Date();
  const start_date = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`;
  const last_scheduled_at = new Date().toISOString();

  // Create approved program for the e2e user
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
        last_scheduled_at,
        scheduling_preferences: { default_time: '08:00', default_duration_minutes: 60 },
      }
    ])
    .select('id')
    .single();

  if (insert.error) {
    console.error('Failed to insert program:', insert.error);
    process.exit(1);
  }

  const programId = insert.data.id;

  // Best-effort ensure assessment is approved for onboarding UX
  await ensureAssessmentForUser(supabase, E2E_USER_ID);

  console.log('E2E program seeded. Export this for Playwright:');
  console.log(`E2E_PROGRAM_ID=${programId}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
