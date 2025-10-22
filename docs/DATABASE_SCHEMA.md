# Kinisi Database Schema Documentation

## Overview

This document provides comprehensive documentation of all database schemas, data models, relationships, and constraints in the Kinisi application. The database uses **Supabase PostgreSQL** with Row-Level Security (RLS) policies enabled.

---

## Table of Contents

1. [Core Tables](#core-tables)
2. [Authentication](#authentication)
3. [Survey & Assessment Tables](#survey--assessment-tables)
4. [Exercise Program Tables](#exercise-program-tables)
5. [RAG (Retrieval-Augmented Generation) Tables](#rag-retrieval-augmented-generation-tables)
6. [Beta Access Tables](#beta-access-tables)
7. [Relationships & Foreign Keys](#relationships--foreign-keys)
8. [Row-Level Security (RLS) Policies](#row-level-security-rls-policies)
9. [Indexes](#indexes)
10. [TypeScript Type Definitions](#typescript-type-definitions)

---

## Core Tables

### 1. `auth.users`

**Purpose**: Managed by Supabase Auth. Stores user authentication data.

**Schema**: Managed by Supabase (not directly modified by migrations)

**Key Fields**:
- `id` (UUID): Primary key, user identifier
- `email` (TEXT): User's email address
- `created_at` (TIMESTAMPTZ): Account creation timestamp
- `updated_at` (TIMESTAMPTZ): Last update timestamp

**Notes**: This table is referenced by all user-owned tables via foreign keys.

---

## Survey & Assessment Tables

### 2. `survey_responses`

**Purpose**: Stores user intake survey responses. Uses an **append-only history model** where each submission creates a new row.

**Schema**:
```sql
CREATE TABLE survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  response JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Fields**:
- `id` (UUID): Primary key
- `user_id` (UUID): Foreign key to `auth.users(id)`
- `response` (JSONB): Survey response data (see [Survey Response Schema](#survey-response-jsonb-schema))
- `created_at` (TIMESTAMPTZ): When the response was created
- `updated_at` (TIMESTAMPTZ): Last modification timestamp

**Constraints**:
- `user_id` references `auth.users(id)` with `ON DELETE CASCADE`

**RLS Policies**:
- Users can SELECT, INSERT, UPDATE, DELETE only their own survey responses
- Policy: `user_id = auth.uid()`

**Notes**:
- Multiple rows per user are allowed (history model)
- Latest response is determined by `ORDER BY updated_at DESC` or `created_at DESC`

#### Survey Response JSONB Schema

The `response` field contains a JSONB object with the following structure:

```typescript
{
  primaryGoal: string,                    // 'Improve health' | 'Lose weight' | 'Gain strength' | 'Reduce pain' | 'Feel better/energized' | 'Other'
  medicalClearance: string,               // 'Yes' | 'No'
  currentPain: {
    hasPain: boolean,
    description?: string                  // Required if hasPain is true
  },
  activityFrequency: string,              // '0' | '1–2' | '3–4' | '5–7'
  physicalFunction: string,               // 'Excellent' | 'Good' | 'Fair' | 'Poor'
  intentToChange: string,                 // 'Yes' | 'No' | 'Not sure'
  importance: number,                     // 0-10 scale
  confidence: number,                     // 0-10 scale
  sleep: string,                          // 'Less than 5' | '5–6' | '7–8' | 'More than 8'
  tobaccoUse: string,                     // 'Yes' | 'No'
  activityPreferences: string[],          // Array of: 'Walking/hiking' | 'Strength training' | 'Yoga/stretching' | 'Group classes' | 'Sports' | 'Cycling' | 'Swimming' | 'Home workouts' | 'Other'
  otherActivityPreferences?: string,      // Optional, max 1000 chars
  equipmentAccess: string[],              // Array of: 'None / Bodyweight only' | 'Dumbbells or resistance bands' | 'Gym with machines/weights' | 'Cardio equipment' | 'Outdoor space' | 'Pool' | 'Other'
  otherEquipmentAccess?: string,          // Optional, max 1000 chars
  timeCommitment: {
    daysPerWeek: number,                  // 0-7
    minutesPerSession: number,            // 5-180
    preferredTimeOfDay: string            // 'Morning' | 'Afternoon' | 'Evening' | 'Flexible'
  }
}
```

---

### 3. `assessments`

**Purpose**: Stores AI-generated personalized fitness assessments. Uses an **append-only revision model** with `revision_of` field for tracking assessment history.

**Schema**:
```sql
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  survey_response_id UUID REFERENCES survey_responses(id) ON DELETE CASCADE,
  assessment TEXT NOT NULL,
  approved BOOLEAN DEFAULT FALSE,
  revision_of UUID REFERENCES assessments(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Fields**:
- `id` (UUID): Primary key
- `user_id` (UUID): Foreign key to `auth.users(id)`
- `survey_response_id` (UUID): Foreign key to `survey_responses(id)`
- `assessment` (TEXT): AI-generated assessment text
- `approved` (BOOLEAN): Whether user has approved this assessment (default: false)
- `revision_of` (UUID): Self-referencing FK to parent assessment if this is a revision
- `created_at` (TIMESTAMPTZ): Creation timestamp
- `updated_at` (TIMESTAMPTZ): Last modification timestamp

**Constraints**:
- `user_id` references `auth.users(id)` with `ON DELETE CASCADE`
- `survey_response_id` references `survey_responses(id)` with `ON DELETE CASCADE`
- `revision_of` references `assessments(id)` (nullable)

**RLS Policies**:
- Users can SELECT, INSERT, UPDATE, DELETE only their own assessments
- Policy: `user_id = auth.uid()`

**Notes**:
- Revisions create new rows with `revision_of` pointing to the original
- Latest assessment: `ORDER BY created_at DESC LIMIT 1`
- Approved assessments have `approved = true`

---

## Exercise Program Tables

### 4. `exercises`

**Purpose**: Read-only reference table containing exercise definitions. Seeded from `exercises-data/exercises.json`.

**Schema**:
```sql
CREATE TABLE exercises (
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
```

**Fields**:
- `exercise_id` (TEXT): Primary key, unique exercise identifier
- `name` (TEXT): Exercise name
- `image_url` (TEXT): URL to exercise image
- `equipments` (TEXT[]): Array of required equipment
- `body_parts` (TEXT[]): Array of body parts targeted
- `exercise_type` (TEXT): Type of exercise
- `target_muscles` (TEXT[]): Primary muscles targeted
- `secondary_muscles` (TEXT[]): Secondary muscles engaged
- `video_url` (TEXT): URL to instructional video
- `keywords` (TEXT[]): Search keywords
- `overview` (TEXT): Exercise description
- `instructions` (TEXT[]): Step-by-step instructions
- `exercise_tips` (TEXT[]): Tips for proper form
- `variations` (TEXT[]): Exercise variations
- `related_exercise_ids` (TEXT[]): Related exercise IDs

**RLS Policies**:
- Authenticated users can SELECT (read-only)
- Policy: `authenticated` role can read

**Notes**:
- This table is read-only for application users
- Data is seeded from JSON files during setup

---

### 5. `exercise_programs`

**Purpose**: Stores user exercise programs with status tracking, scheduling preferences, and program data.

**Schema**:
```sql
CREATE TABLE exercise_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_id UUID,
  status TEXT NOT NULL DEFAULT 'draft',
  approved_at TIMESTAMPTZ,
  revision INT NOT NULL DEFAULT 1,
  program_json JSONB,
  start_date DATE,
  scheduling_preferences JSONB,
  last_scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Fields**:
- `id` (UUID): Primary key
- `user_id` (UUID): Foreign key to `auth.users(id)`
- `assessment_id` (UUID): Reference to associated assessment
- `status` (TEXT): Program status: `'draft'` | `'approved'`
- `approved_at` (TIMESTAMPTZ): When program was approved
- `revision` (INT): Revision number (default: 1)
- `program_json` (JSONB): Complete program structure (see [Program JSON Schema](#program-json-schema))
- `start_date` (DATE): User's intended program start date
- `scheduling_preferences` (JSONB): User scheduling preferences (timezone, days, time windows)
- `last_scheduled_at` (TIMESTAMPTZ): Last successful scheduling operation timestamp
- `created_at` (TIMESTAMPTZ): Creation timestamp
- `updated_at` (TIMESTAMPTZ): Last modification timestamp

**Constraints**:
- `user_id` references `auth.users(id)` with `ON DELETE CASCADE`

**RLS Policies**:
- Users can SELECT, INSERT, UPDATE, DELETE only their own programs
- Policy: `user_id = auth.uid()`

**Indexes**:
- `idx_exercise_programs_user_created` on `(user_id, created_at)`

#### Program JSON Schema

The `program_json` field contains a JSONB object with the following structure:

```typescript
{
  weeks: [
    {
      week: number,                       // Week number (1-based)
      sessions: [
        {
          session: number,                // Session number within week
          goal: string,                   // Session goal/focus
          uid?: string,                   // Stable identifier (e.g., "w1s2")
          start_at?: string,              // ISO 8601 datetime for scheduled session
          duration_minutes?: number,      // Planned duration for calendar
          exercises: [
            {
              exercise_id: string,        // FK to exercises.exercise_id
              sets: number,
              reps: number,
              notes?: string
            }
          ]
        }
      ]
    }
  ]
}
```

---

### 6. `sessions`

**Purpose**: Stores individual workout sessions within a program.

**Schema**:
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES exercise_programs(id) ON DELETE CASCADE,
  week INT NOT NULL,
  session_number INT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Fields**:
- `id` (UUID): Primary key
- `program_id` (UUID): Foreign key to `exercise_programs(id)`
- `week` (INT): Week number
- `session_number` (INT): Session number within the week
- `notes` (TEXT): Session notes
- `created_at` (TIMESTAMPTZ): Creation timestamp
- `updated_at` (TIMESTAMPTZ): Last modification timestamp

**Constraints**:
- `program_id` references `exercise_programs(id)` with `ON DELETE CASCADE`

**RLS Policies**:
- Users can access sessions for programs they own
- Policy: `EXISTS (SELECT 1 FROM exercise_programs WHERE id = sessions.program_id AND user_id = auth.uid())`

**Indexes**:
- `idx_sessions_program_id` on `program_id`

---

### 7. `session_exercises`

**Purpose**: Stores individual exercises within a session with sets, reps, and intensity details.

**Schema**:
```sql
CREATE TABLE session_exercises (
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
```

**Fields**:
- `id` (UUID): Primary key
- `session_id` (UUID): Foreign key to `sessions(id)`
- `exercise_id` (TEXT): Foreign key to `exercises(exercise_id)`
- `exercise_order` (INT): Order of exercise in session
- `sets` (INT): Number of sets
- `reps` (INT): Number of repetitions
- `duration` (INT): Duration in seconds (for time-based exercises)
- `intensity` (TEXT): Intensity level
- `variation` (TEXT): Exercise variation
- `custom_notes` (TEXT): Custom notes for this exercise

**Constraints**:
- `session_id` references `sessions(id)` with `ON DELETE CASCADE`
- `exercise_id` references `exercises(exercise_id)`

**RLS Policies**:
- Users can access session_exercises for sessions they own (via program ownership)
- Policy: `EXISTS (SELECT 1 FROM sessions s JOIN exercise_programs p ON p.id = s.program_id WHERE s.id = session_exercises.session_id AND p.user_id = auth.uid())`

**Indexes**:
- `idx_session_exercises_session_id` on `session_id`
- `idx_session_exercises_exercise_id` on `exercise_id`

---

### 8. `program_feedback`

**Purpose**: Stores user feedback on exercise programs for revision tracking.

**Schema**:
```sql
CREATE TABLE program_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES exercise_programs(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback TEXT NOT NULL,
  revision INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Fields**:
- `id` (UUID): Primary key
- `program_id` (UUID): Foreign key to `exercise_programs(id)`
- `session_id` (UUID): Foreign key to `sessions(id)` (nullable)
- `user_id` (UUID): Foreign key to `auth.users(id)`
- `feedback` (TEXT): User's feedback text
- `revision` (INT): Program revision number this feedback applies to
- `created_at` (TIMESTAMPTZ): Creation timestamp

**Constraints**:
- `program_id` references `exercise_programs(id)` with `ON DELETE CASCADE`
- `session_id` references `sessions(id)` with `ON DELETE CASCADE`
- `user_id` references `auth.users(id)` with `ON DELETE CASCADE`

**RLS Policies**:
- Users can access feedback for programs they own
- Policy: `user_id = auth.uid() AND EXISTS (SELECT 1 FROM exercise_programs WHERE id = program_feedback.program_id AND user_id = auth.uid())`

**Indexes**:
- `idx_program_feedback_program_id` on `program_id`

---

## RAG (Retrieval-Augmented Generation) Tables

### 9. `rag_documents`

**Purpose**: Stores source documents for RAG (e.g., exercise guides, research papers).

**Schema**:
```sql
CREATE TABLE rag_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Fields**:
- `id` (UUID): Primary key
- `name` (TEXT): Document name/title
- `content` (TEXT): Full document content
- `metadata` (JSONB): Additional metadata
- `created_at` (TIMESTAMPTZ): Creation timestamp

**RLS Policies**:
- RLS enabled but not forced (allows SECURITY DEFINER functions to bypass)
- No direct user access policies

**Indexes**:
- `rag_documents_created_at_idx` on `created_at`

---

### 10. `rag_chunks`

**Purpose**: Stores chunked segments of RAG documents for embedding and retrieval.

**Schema**:
```sql
CREATE TABLE rag_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES rag_documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Fields**:
- `id` (UUID): Primary key
- `document_id` (UUID): Foreign key to `rag_documents(id)`
- `content` (TEXT): Chunk content
- `metadata` (JSONB): Chunk-specific metadata
- `created_at` (TIMESTAMPTZ): Creation timestamp

**Constraints**:
- `document_id` references `rag_documents(id)` with `ON DELETE CASCADE`

**RLS Policies**:
- RLS enabled but not forced
- No direct user access policies

**Indexes**:
- `rag_chunks_document_id_idx` on `document_id`

---

### 11. `rag_vectors`

**Purpose**: Stores vector embeddings for RAG chunks (using pgvector extension).

**Schema**:
```sql
CREATE TABLE rag_vectors (
  chunk_id UUID PRIMARY KEY REFERENCES rag_chunks(id) ON DELETE CASCADE,
  embedding vector(1536)
);
```

**Fields**:
- `chunk_id` (UUID): Primary key, foreign key to `rag_chunks(id)`
- `embedding` (vector(1536)): OpenAI text-embedding-3-small vector (1536 dimensions)

**Constraints**:
- `chunk_id` references `rag_chunks(id)` with `ON DELETE CASCADE`

**RLS Policies**:
- RLS enabled but not forced
- No direct user access policies

**Indexes**:
- `rag_vectors_embedding_ivfflat_idx` using IVFFlat for fast ANN search (lists = 100)

**Functions**:
- `match_rag_chunks(query_embedding vector(1536), match_count int)`: SECURITY DEFINER function for similarity search

---

## Beta Access Tables

### 12. `beta_requests`

**Purpose**: Stores beta access requests from unauthenticated users on the homepage.

**Schema**:
```sql
CREATE TABLE beta_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT,
  referral_source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Fields**:
- `id` (UUID): Primary key
- `email` (TEXT): User's email (unique constraint)
- `name` (TEXT): User's name (optional)
- `referral_source` (TEXT): How they heard about Kinisi (optional)
- `created_at` (TIMESTAMPTZ): Request timestamp

**Constraints**:
- `beta_requests_email_unique`: UNIQUE constraint on `email`

**RLS Policies**:
- RLS enabled
- Unauthenticated users can INSERT
- No SELECT policies (admin-only access)

**Indexes**:
- `idx_beta_requests_created_at` on `created_at`

---

## Relationships & Foreign Keys

### Entity Relationship Diagram (Text)

```
auth.users (Supabase managed)
    ↓ (1:N)
    ├─→ survey_responses
    │       ↓ (1:N)
    │       └─→ assessments
    │               ↓ (1:1 optional)
    │               └─→ exercise_programs
    │                       ↓ (1:N)
    │                       ├─→ sessions
    │                       │       ↓ (1:N)
    │                       │       └─→ session_exercises
    │                       │               ↓ (N:1)
    │                       │               └─→ exercises (reference)
    │                       └─→ program_feedback
    │
    └─→ exercise_programs (direct)
            ↓ (1:N)
            └─→ program_feedback

assessments
    ↓ (self-referencing)
    └─→ assessments (revision_of)

rag_documents
    ↓ (1:N)
    └─→ rag_chunks
            ↓ (1:1)
            └─→ rag_vectors
```

### Key Relationships

1. **User → Survey Responses**: One-to-many (history model)
2. **Survey Response → Assessments**: One-to-many (revision model)
3. **Assessment → Assessment**: Self-referencing (revision tracking via `revision_of`)
4. **User → Exercise Programs**: One-to-many
5. **Exercise Program → Sessions**: One-to-many
6. **Session → Session Exercises**: One-to-many
7. **Exercise → Session Exercises**: One-to-many (reference table)
8. **Exercise Program → Program Feedback**: One-to-many
9. **RAG Document → RAG Chunks**: One-to-many
10. **RAG Chunk → RAG Vector**: One-to-one

---

## Row-Level Security (RLS) Policies

### Overview

All user-owned tables have RLS enabled with `FORCE ROW LEVEL SECURITY` to ensure data isolation. RAG tables have RLS enabled but not forced to allow SECURITY DEFINER functions.

### Policy Patterns

#### Owner-Only Access (Direct)
Tables: `survey_responses`, `assessments`, `exercise_programs`

```sql
-- Example for survey_responses
CREATE POLICY survey_responses_select_own ON survey_responses
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY survey_responses_insert_own ON survey_responses
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY survey_responses_update_own ON survey_responses
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY survey_responses_delete_own ON survey_responses
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
```

#### Owner-Only Access (Via Parent)
Tables: `sessions`, `session_exercises`, `program_feedback`

```sql
-- Example for sessions (via exercise_programs)
CREATE POLICY sessions_owner_select ON sessions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exercise_programs p
      WHERE p.id = sessions.program_id AND p.user_id = auth.uid()
    )
  );
```

#### Read-Only Access
Table: `exercises`

```sql
CREATE POLICY exercises_select_auth ON exercises
  FOR SELECT TO authenticated
  USING (true);
```

#### Unauthenticated Insert
Table: `beta_requests`

```sql
CREATE POLICY beta_requests_insert_anon ON beta_requests
  FOR INSERT TO anon
  WITH CHECK (true);
```

---

## Indexes

### Performance Indexes

```sql
-- Exercise Programs
CREATE INDEX idx_exercise_programs_user_created ON exercise_programs(user_id, created_at);

-- Sessions
CREATE INDEX idx_sessions_program_id ON sessions(program_id);

-- Session Exercises
CREATE INDEX idx_session_exercises_session_id ON session_exercises(session_id);
CREATE INDEX idx_session_exercises_exercise_id ON session_exercises(exercise_id);

-- Program Feedback
CREATE INDEX idx_program_feedback_program_id ON program_feedback(program_id);

-- RAG
CREATE INDEX rag_documents_created_at_idx ON rag_documents(created_at);
CREATE INDEX rag_chunks_document_id_idx ON rag_chunks(document_id);
CREATE INDEX rag_vectors_embedding_ivfflat_idx ON rag_vectors 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Beta Requests
CREATE INDEX idx_beta_requests_created_at ON beta_requests(created_at);
```

---

## TypeScript Type Definitions

### Survey Response Type

```typescript
// types/supabase.types.ts
export type SurveyResponses = {
  medicalClearance: 'Yes' | 'No';
  currentPain: {
    hasPain: boolean;
    description?: string;
  };
  activityFrequency: '0' | '1–2' | '3–4' | '5–7';
  physicalFunction: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  intentToChange: 'Yes' | 'No' | 'Not sure';
  importance: number; // 0-10
  confidence: number; // 0-10
  sleep: 'Less than 5' | '5–6' | '7–8' | 'More than 8';
  tobaccoUse: 'Yes' | 'No';
  primaryGoal: 'Improve health' | 'Lose weight' | 'Gain strength' | 'Reduce pain' | 'Feel better/energized' | 'Other';
  activityPreferences: Array<
    | 'Walking/hiking'
    | 'Strength training'
    | 'Yoga/stretching'
    | 'Group classes'
    | 'Sports'
    | 'Cycling'
    | 'Swimming'
    | 'Home workouts'
    | 'Other'
  >;
  otherActivityPreferences?: string;
  equipmentAccess: Array<
    | 'None / Bodyweight only'
    | 'Dumbbells or resistance bands'
    | 'Gym with machines/weights'
    | 'Cardio equipment'
    | 'Outdoor space'
    | 'Pool'
    | 'Other'
  >;
  otherEquipmentAccess?: string;
  timeCommitment: {
    daysPerWeek: number; // 0-7
    minutesPerSession: number;
    preferredTimeOfDay: 'Morning' | 'Afternoon' | 'Evening' | 'Flexible';
  };
};
```

### Assessment Type

```typescript
// utils/assessments.ts
export type Assessment = {
  id: string;
  user_id: string;
  survey_response_id: string;
  assessment: string;
  approved?: boolean;
  created_at: string;
  updated_at: string;
};
```

### Program Types

```typescript
// utils/types/programTypes.ts
export interface Exercise {
  exercise_id: string;
  name: string;
  primary_muscles?: string[];
  equipment?: string[];
}

export interface ProgramExerciseInstance {
  exercise_id: string;
  sets: number;
  reps: number;
  notes?: string;
}

export interface ProgramSession {
  session: number;
  goal: string;
  exercises: ProgramExerciseInstance[];
  uid?: string;
  start_at?: string;
  duration_minutes?: number;
}

export interface ProgramWeek {
  week: number;
  sessions: ProgramSession[];
}

export interface ExerciseProgramPayload {
  weeks: ProgramWeek[];
}
```

---

## Migration History

1. **20250806_create_exercise_program_schema.sql**: Initial exercise program tables
2. **20250808_add_program_json_start_date_and_feedback_fix.sql**: Added `program_json`, `start_date`, renamed feedback column
3. **20250809_add_rag_schema.sql**: Added RAG tables with pgvector
4. **20250810_add_beta_requests_table.sql**: Added beta access table
5. **20250811_enable_rls_and_policies.sql**: Enabled RLS and created all policies
6. **20250812_enable_rls_on_beta_requests.sql**: RLS for beta requests
7. **20250820_add_scheduling_fields.sql**: Added `scheduling_preferences` and `last_scheduled_at`

---

## Notes

### Onboarding Completion Criteria

1. **Survey**: Completed if `hasCompletedSurvey(userId)` returns true or a survey response exists
2. **Assessment**: Completed if latest assessment has `approved = true`
3. **Program**: Completed if user's latest `exercise_programs.status === 'approved'`
4. **Schedule**: Completed if `program_json` has at least one session with `start_at` OR `last_scheduled_at` is set

### Data Model Patterns

- **History Model**: `survey_responses` uses append-only inserts
- **Revision Model**: `assessments` uses `revision_of` for tracking revisions
- **Status Tracking**: `exercise_programs` uses `status` field ('draft' | 'approved')
- **Soft Scheduling**: Programs store scheduling preferences and timestamps separately from session data

---

**Last Updated**: 2025-01-10
**Database Version**: PostgreSQL 15+ (Supabase)
**Extensions Required**: `pgvector`, `pgcrypto`
