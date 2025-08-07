-- Migration: Create tables for exercise programs, sessions, session_exercises, and program_feedback

-- 1. Read-only exercises table (seeded from exercises-data/exercises.json)
CREATE TABLE IF NOT EXISTS exercises (
    exercise_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    image_url TEXT,
    equipments TEXT[],
    body_parts TEXT[],
    exercise_type TEXT,
    target_muscles TEXT[],
    secondary_muscles TEXT[],
    video_url TEXT,
    keywords TEXT[],
    overview TEXT,
    instructions TEXT[],
    exercise_tips TEXT[],
    variations TEXT[],
    related_exercise_ids TEXT[]
);

-- 2. Exercise Programs
CREATE TABLE IF NOT EXISTS exercise_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    assessment_id UUID,
    status TEXT NOT NULL DEFAULT 'draft',
    approved_at TIMESTAMPTZ,
    revision INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Sessions
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES exercise_programs(id) ON DELETE CASCADE,
    week INT NOT NULL,
    session_number INT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Session Exercises
CREATE TABLE IF NOT EXISTS session_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    exercise_id TEXT REFERENCES exercises(exercise_id),
    exercise_order INT NOT NULL,
    sets INT,
    reps INT,
    duration INT,
    intensity TEXT,
    variation TEXT,
    custom_notes TEXT
);

-- 5. Program Feedback
CREATE TABLE IF NOT EXISTS program_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES exercise_programs(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    revision INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_program_id ON sessions(program_id);
CREATE INDEX IF NOT EXISTS idx_session_exercises_session_id ON session_exercises(session_id);
CREATE INDEX IF NOT EXISTS idx_session_exercises_exercise_id ON session_exercises(exercise_id);
CREATE INDEX IF NOT EXISTS idx_program_feedback_program_id ON program_feedback(program_id);
