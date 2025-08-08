-- Migration: Align exercise_programs schema with application code
-- - Add program_json (JSONB) to store generated program payloads
-- - Add start_date (DATE) used by dashboard start-date API
-- - Add index on (user_id, created_at) for latest-program-by-user query
-- - Rename program_feedback.text -> program_feedback.feedback to match code

-- 1) exercise_programs: add program_json
ALTER TABLE IF EXISTS exercise_programs
  ADD COLUMN IF NOT EXISTS program_json JSONB;

-- 2) exercise_programs: add start_date
ALTER TABLE IF EXISTS exercise_programs
  ADD COLUMN IF NOT EXISTS start_date DATE;

-- 3) exercise_programs: helpful index for latest program by user
CREATE INDEX IF NOT EXISTS idx_exercise_programs_user_created
  ON exercise_programs(user_id, created_at);

-- 4) program_feedback: rename column text -> feedback if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'program_feedback'
      AND column_name = 'text'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'program_feedback'
      AND column_name = 'feedback'
  ) THEN
    ALTER TABLE program_feedback RENAME COLUMN "text" TO feedback;
  END IF;
END
$$;
