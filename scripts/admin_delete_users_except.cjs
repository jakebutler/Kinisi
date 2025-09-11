#!/usr/bin/env node
/*
  Destructive admin cleanup: delete all users and app data EXCEPT a keep email.
  Usage:
    SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/admin_delete_users_except.cjs --keep "butler.jake@gmail.com" --dry-run
    SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/admin_delete_users_except.cjs --keep "butler.jake@gmail.com"

  Notes:
  - Requires the Service Role key. Do NOT commit it. Provide via environment variables.
  - Bypasses RLS and uses Auth Admin API to delete users.
  - Deletes in dependency order: exercise_programs -> assessments -> survey_responses -> program_feedback -> auth users
*/

const { createClient } = require('@supabase/supabase-js');

function parseArgs(argv) {
  const args = { dryRun: false, keep: 'butler.jake@gmail.com' };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--keep') {
      args.keep = argv[i + 1];
      i += 1;
    }
  }
  return args;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function listAllUsers(admin) {
  const perPage = 1000;
  let page = 1;
  let users = [];
  // paginate until empty
  // supabase-js v2 admin.listUsers({ page, perPage })
  while (true) {
    const { data, error } = await admin.listUsers({ page, perPage });
    if (error) throw error;
    users = users.concat(data.users || []);
    if (!data.users || data.users.length < perPage) break;
    page += 1;
  }
  return users;
}

async function countForIds(client, table, column, ids) {
  if (ids.length === 0) return 0;
  const { count, error } = await client
    .from(table)
    .select('*', { count: 'exact', head: true })
    .in(column, ids);
  if (error) throw error;
  return count || 0;
}

async function deleteForIds(client, table, column, ids, label) {
  if (ids.length === 0) return { count: 0 };
  let total = 0;
  for (const batch of chunk(ids, 200)) {
    const { error, count } = await client
      .from(table)
      .delete({ count: 'exact' })
      .in(column, batch);
    if (error) throw error;
    total += count || 0;
  }
  console.log(`Deleted ${total} from ${label}`);
  return { count: total };
}

async function main() {
  const {
    SUPABASE_URL: RAW_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    SERVICE_ROLE_KEY,
    SUPABASE_SERVICE_ROLE,
  } = process.env;
  const args = parseArgs(process.argv);

  // Resolve Supabase URL: prefer SUPABASE_URL unless it's an unexpanded template like '${...}',
  // then fall back to NEXT_PUBLIC_SUPABASE_URL. Also strip any trailing slashes.
  let resolvedUrl = RAW_SUPABASE_URL && !/\$\{.*\}/.test(RAW_SUPABASE_URL)
    ? RAW_SUPABASE_URL
    : NEXT_PUBLIC_SUPABASE_URL;
  if (resolvedUrl) {
    resolvedUrl = resolvedUrl.replace(/\/+$/, '');
  }

  // Resolve Service Role key from common env names.
  const resolvedServiceRole = SUPABASE_SERVICE_ROLE_KEY || SERVICE_ROLE_KEY || SUPABASE_SERVICE_ROLE;

  if (!resolvedUrl || !/^https?:\/\//.test(resolvedUrl)) {
    console.error('Missing or invalid Supabase URL. Provide SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL in your env.');
    process.exit(1);
  }
  if (!resolvedServiceRole) {
    console.error('Missing service role key. Provide SUPABASE_SERVICE_ROLE_KEY (or SERVICE_ROLE_KEY / SUPABASE_SERVICE_ROLE) in your env.');
    process.exit(1);
  }
  if (!args.keep) {
    console.error('Missing --keep <email> argument.');
    process.exit(1);
  }

  const supabase = createClient(resolvedUrl, resolvedServiceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const admin = supabase.auth.admin;

  console.log(`Fetching users… (keeping: ${args.keep})`);
  const allUsers = await listAllUsers(admin);
  const keepUser = allUsers.find((u) => u.email?.toLowerCase() === args.keep.toLowerCase());
  if (!keepUser) {
    console.error(`Keep email not found in auth.users: ${args.keep}`);
    process.exit(1);
  }

  const toDelete = allUsers.filter((u) => u.id !== keepUser.id);
  const ids = toDelete.map((u) => u.id);

  console.log(`Found ${allUsers.length} users total. Will delete ${ids.length}.`);

  // Dry-run: show counts and exit
  if (args.dryRun) {
    const [programs, assessments, survey, feedback] = await Promise.all([
      countForIds(supabase, 'exercise_programs', 'user_id', ids),
      countForIds(supabase, 'assessments', 'user_id', ids),
      countForIds(supabase, 'survey_responses', 'user_id', ids),
      countForIds(supabase, 'program_feedback', 'user_id', ids),
    ]);
    console.log('Dry run counts:');
    console.log({
      auth_users_to_delete: ids.length,
      programs_to_delete: programs,
      assessments_to_delete: assessments,
      survey_responses_to_delete: survey,
      feedback_rows_to_delete: feedback,
    });
    return;
  }

  console.log('Deleting application data…');
  // Order matters: programs (cascade sessions/session_exercises) -> assessments -> survey_responses -> feedback
  await deleteForIds(supabase, 'exercise_programs', 'user_id', ids, 'exercise_programs');
  await deleteForIds(supabase, 'assessments', 'user_id', ids, 'assessments');
  await deleteForIds(supabase, 'survey_responses', 'user_id', ids, 'survey_responses');
  await deleteForIds(supabase, 'program_feedback', 'user_id', ids, 'program_feedback');

  console.log('Deleting auth users…');
  // Delete auth users in batches to avoid rate limiting
  let deleted = 0;
  for (const batch of chunk(ids, 50)) {
    const results = await Promise.allSettled(batch.map((id) => admin.deleteUser(id)));
    const success = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected');
    deleted += success;
    if (failed.length) {
      console.warn(`Failed to delete ${failed.length} users in this batch:`);
      failed.forEach((f) => console.warn(f.reason));
    }
  }
  console.log(`Deleted ${deleted} auth users.`);

  console.log('Verifying remaining users…');
  const remaining = await listAllUsers(admin);
  console.table(remaining.map((u) => ({ id: u.id, email: u.email })));

  const keepStillExists = remaining.some((u) => u.id === keepUser.id);
  if (!keepStillExists) {
    console.error('ERROR: Keep user was removed unexpectedly!');
    process.exit(2);
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
