-- Migration: Add scheduling fields to exercise_programs
-- - scheduling_preferences JSONB: stores user prefs (timezone, daysOfWeek, timeWindows, etc.)
-- - last_scheduled_at TIMESTAMPTZ: audit of the last successful scheduling operation

ALTER TABLE IF EXISTS exercise_programs
  ADD COLUMN IF NOT EXISTS scheduling_preferences JSONB;

ALTER TABLE IF EXISTS exercise_programs
  ADD COLUMN IF NOT EXISTS last_scheduled_at TIMESTAMPTZ;

-- Optional helpful index if querying by user and last_scheduled_at recency
-- CREATE INDEX IF NOT EXISTS idx_exercise_programs_user_last_scheduled
--   ON exercise_programs(user_id, last_scheduled_at DESC);
