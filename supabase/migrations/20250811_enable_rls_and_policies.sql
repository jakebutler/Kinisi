-- Enable RLS and add policies across public tables
-- Decisions:
-- - exercises: authenticated-only read
-- - RAG: RPC-only access via SECURITY DEFINER function; no direct reads for users
-- - survey_responses: keep history (multiple rows per user)
-- - all program-related tables: owner-only via user_id on parent

-- 1) Enable RLS (and FORCE where appropriate)
alter table if exists public.survey_responses enable row level security;
alter table if exists public.survey_responses force row level security;

alter table if exists public.assessments enable row level security;
alter table if exists public.assessments force row level security;

alter table if exists public.exercise_programs enable row level security;
alter table if exists public.exercise_programs force row level security;

alter table if exists public.sessions enable row level security;
alter table if exists public.sessions force row level security;

alter table if exists public.session_exercises enable row level security;
alter table if exists public.session_exercises force row level security;

alter table if exists public.program_feedback enable row level security;
alter table if exists public.program_feedback force row level security;

alter table if exists public.exercises enable row level security;
alter table if exists public.exercises force row level security;

-- For RAG tables we DO NOT FORCE RLS to allow SECURITY DEFINER RPC to bypass RLS
alter table if exists public.rag_documents enable row level security;
alter table if exists public.rag_chunks enable row level security;
alter table if exists public.rag_vectors enable row level security;

-- 2) Policies (drop-if-exists, then create)
-- survey_responses
drop policy if exists survey_responses_select_own on public.survey_responses;
drop policy if exists survey_responses_insert_own on public.survey_responses;
drop policy if exists survey_responses_update_own on public.survey_responses;
drop policy if exists survey_responses_delete_own on public.survey_responses;

create policy survey_responses_select_own on public.survey_responses
  for select to authenticated
  using (user_id = auth.uid());

create policy survey_responses_insert_own on public.survey_responses
  for insert to authenticated
  with check (user_id = auth.uid());

create policy survey_responses_update_own on public.survey_responses
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy survey_responses_delete_own on public.survey_responses
  for delete to authenticated
  using (user_id = auth.uid());

-- assessments
drop policy if exists assessments_select_own on public.assessments;
drop policy if exists assessments_insert_own on public.assessments;
drop policy if exists assessments_update_own on public.assessments;
drop policy if exists assessments_delete_own on public.assessments;

create policy assessments_select_own on public.assessments
  for select to authenticated
  using (user_id = auth.uid());

create policy assessments_insert_own on public.assessments
  for insert to authenticated
  with check (user_id = auth.uid());

create policy assessments_update_own on public.assessments
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy assessments_delete_own on public.assessments
  for delete to authenticated
  using (user_id = auth.uid());

-- exercise_programs (owner-only)
drop policy if exists exercise_programs_owner_select on public.exercise_programs;
drop policy if exists exercise_programs_owner_insert on public.exercise_programs;
drop policy if exists exercise_programs_owner_update on public.exercise_programs;
drop policy if exists exercise_programs_owner_delete on public.exercise_programs;

create policy exercise_programs_owner_select on public.exercise_programs
  for select to authenticated
  using (user_id = auth.uid());

create policy exercise_programs_owner_insert on public.exercise_programs
  for insert to authenticated
  with check (user_id = auth.uid());

create policy exercise_programs_owner_update on public.exercise_programs
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy exercise_programs_owner_delete on public.exercise_programs
  for delete to authenticated
  using (user_id = auth.uid());

-- sessions (derive from program owner)
drop policy if exists sessions_owner_select on public.sessions;
drop policy if exists sessions_owner_insert on public.sessions;
drop policy if exists sessions_owner_update on public.sessions;
drop policy if exists sessions_owner_delete on public.sessions;

create policy sessions_owner_select on public.sessions
  for select to authenticated
  using (
    exists (
      select 1 from public.exercise_programs p
      where p.id = sessions.program_id and p.user_id = auth.uid()
    )
  );

create policy sessions_owner_insert on public.sessions
  for insert to authenticated
  with check (
    exists (
      select 1 from public.exercise_programs p
      where p.id = program_id and p.user_id = auth.uid()
    )
  );

create policy sessions_owner_update on public.sessions
  for update to authenticated
  using (
    exists (
      select 1 from public.exercise_programs p
      where p.id = sessions.program_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.exercise_programs p
      where p.id = program_id and p.user_id = auth.uid()
    )
  );

create policy sessions_owner_delete on public.sessions
  for delete to authenticated
  using (
    exists (
      select 1 from public.exercise_programs p
      where p.id = sessions.program_id and p.user_id = auth.uid()
    )
  );

-- session_exercises (derive from program owner via session)
drop policy if exists session_exercises_owner_select on public.session_exercises;
drop policy if exists session_exercises_owner_insert on public.session_exercises;
drop policy if exists session_exercises_owner_update on public.session_exercises;
drop policy if exists session_exercises_owner_delete on public.session_exercises;

create policy session_exercises_owner_select on public.session_exercises
  for select to authenticated
  using (
    exists (
      select 1 from public.sessions s
      join public.exercise_programs p on p.id = s.program_id
      where s.id = session_exercises.session_id and p.user_id = auth.uid()
    )
  );

create policy session_exercises_owner_insert on public.session_exercises
  for insert to authenticated
  with check (
    exists (
      select 1 from public.sessions s
      join public.exercise_programs p on p.id = s.program_id
      where s.id = session_exercises.session_id and p.user_id = auth.uid()
    )
  );

create policy session_exercises_owner_update on public.session_exercises
  for update to authenticated
  using (
    exists (
      select 1 from public.sessions s
      join public.exercise_programs p on p.id = s.program_id
      where s.id = session_exercises.session_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.sessions s
      join public.exercise_programs p on p.id = s.program_id
      where s.id = session_exercises.session_id and p.user_id = auth.uid()
    )
  );

create policy session_exercises_owner_delete on public.session_exercises
  for delete to authenticated
  using (
    exists (
      select 1 from public.sessions s
      join public.exercise_programs p on p.id = s.program_id
      where s.id = session_exercises.session_id and p.user_id = auth.uid()
    )
  );

-- program_feedback (owner-only; easy to extend to collaborators later)
drop policy if exists program_feedback_owner_select on public.program_feedback;
drop policy if exists program_feedback_owner_insert on public.program_feedback;
drop policy if exists program_feedback_owner_update on public.program_feedback;
drop policy if exists program_feedback_owner_delete on public.program_feedback;

create policy program_feedback_owner_select on public.program_feedback
  for select to authenticated
  using (
    exists (
      select 1 from public.exercise_programs p
      where p.id = program_id and p.user_id = auth.uid()
    )
  );

create policy program_feedback_owner_insert on public.program_feedback
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.exercise_programs p
      where p.id = program_id and p.user_id = auth.uid()
    )
  );

create policy program_feedback_owner_update on public.program_feedback
  for update to authenticated
  using (
    user_id = auth.uid()
    and exists (
      select 1 from public.exercise_programs p
      where p.id = program_id and p.user_id = auth.uid()
    )
  )
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.exercise_programs p
      where p.id = program_id and p.user_id = auth.uid()
    )
  );

create policy program_feedback_owner_delete on public.program_feedback
  for delete to authenticated
  using (
    user_id = auth.uid()
    and exists (
      select 1 from public.exercise_programs p
      where p.id = program_id and p.user_id = auth.uid()
    )
  );

-- exercises: authenticated-only read
drop policy if exists exercises_select_auth on public.exercises;
create policy exercises_select_auth on public.exercises
  for select to authenticated
  using (true);

-- 3) Harden RAG RPC: SECURITY DEFINER + restrict execute
-- Wrap in DO block to avoid errors if function is absent
DO $$
BEGIN
  BEGIN
    ALTER FUNCTION public.match_rag_chunks(vector(1536), integer) SECURITY DEFINER;
    REVOKE ALL ON FUNCTION public.match_rag_chunks(vector(1536), integer) FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION public.match_rag_chunks(vector(1536), integer) TO authenticated;
  EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function public.match_rag_chunks(vector(1536), integer) does not exist, skipping security/grants';
  END;
END
$$;
