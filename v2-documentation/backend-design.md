# Kinisi Backend Design Documentation

## Overview

This document provides comprehensive documentation of the Kinisi backend architecture, APIs, data models, and integration patterns. It serves as a technical reference for frontend developers building the v2 interface while leveraging the existing backend infrastructure.

The Kinisi backend is built on Next.js 15 with TypeScript, using Supabase for authentication and database services, and OpenAI for AI-powered assessment and program generation.

## Architecture Principles

- **Server-Side First**: All API routes use `export const dynamic = 'force-dynamic'` to ensure runtime execution
- **Security by Default**: Row-Level Security (RLS) enforces data access policies
- **AI-Driven**: Core functionality powered by OpenAI GPT models via Langchain
- **Type Safety**: Comprehensive TypeScript coverage with strict validation
- **Error Hardening**: Sanitized error responses with detailed server-side logging

## Authentication & Authorization

### Authentication Flow

The backend uses **Supabase Auth** for user management with the following patterns:

#### Server-Side Authentication
```typescript
// Pattern used in all API routes
const supabase = await createSupabaseServerClient();
const { data: { user }, error } = await supabase.auth.getUser();
if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

#### Client Types
- **Server Client** (`utils/supabaseServer.ts`): Cookie-based authentication for API routes
- **Client Client** (`utils/supabaseClient.ts`): Browser-based authentication for frontend
- **Admin Client** (`utils/supabaseAdmin.ts`): Service role for elevated operations

### Authorization Patterns

#### Row-Level Security (RLS)
All tables enforce owner-only access through RLS policies:

```sql
-- Example: exercise_programs table
CREATE POLICY exercise_programs_owner_select ON exercise_programs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
```

#### Hierarchical Access Control
- **Programs**: Direct user ownership via `user_id`
- **Sessions**: Access derived from program ownership
- **Session Exercises**: Access derived via session → program chain
- **Feedback**: Owner-only with explicit user_id validation

## Data Models & Database Schema

### Core Tables

#### Users (Supabase Auth)
- Managed by Supabase Auth system
- Referenced via `auth.uid()` in RLS policies

#### Survey Responses
```sql
CREATE TABLE survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  responses JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**TypeScript Interface:**
```typescript
export type SurveyResponses = {
  medicalClearance: 'Yes' | 'No';
  currentPain: { hasPain: boolean; description?: string; };
  activityFrequency: '0' | '1–2' | '3–4' | '5–7';
  physicalFunction: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  intentToChange: 'Yes' | 'No' | 'Not sure';
  importance: number; // 0-10
  confidence: number; // 0-10
  sleep: 'Less than 5' | '5–6' | '7–8' | 'More than 8';
  tobaccoUse: 'Yes' | 'No';
  primaryGoal: 'Improve health' | 'Lose weight' | 'Gain strength' | 'Reduce pain' | 'Feel better/energized' | 'Other';
  activityPreferences: Array<string>;
  equipmentAccess: Array<string>;
  timeCommitment: {
    daysPerWeek: number;
    minutesPerSession: number;
    preferredTimeOfDay: 'Morning' | 'Afternoon' | 'Evening' | 'Flexible';
  };
};
```

#### Assessments
```sql
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  survey_response_id UUID REFERENCES survey_responses(id),
  assessment TEXT NOT NULL,
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Exercise Programs
```sql
CREATE TABLE exercise_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_id UUID,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'approved'
  program_json JSONB, -- Stores the complete program structure
  start_date DATE,
  scheduling_preferences JSONB, -- User scheduling preferences
  last_scheduled_at TIMESTAMPTZ, -- Last scheduling operation timestamp
  approved_at TIMESTAMPTZ,
  revision INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Program JSON Structure:**
```typescript
export interface ExerciseProgramPayload {
  weeks: Array<{
    week: number;
    sessions: Array<{
      uid?: string; // Unique session identifier
      day: string;
      focus: string;
      start_at?: string; // ISO datetime for scheduling
      duration_minutes?: number;
      exercises: Array<{
        exercise_id: string;
        sets?: number;
        reps?: number;
        duration?: number;
        intensity?: string;
        notes?: string;
      }>;
    }>;
  }>;
}
```

#### Sessions & Session Exercises
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES exercise_programs(id) ON DELETE CASCADE,
  week INT NOT NULL,
  session_number INT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

#### Exercises (Read-Only Reference Data)
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

#### Program Feedback
```sql
CREATE TABLE program_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES exercise_programs(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  revision INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Beta Requests
```sql
CREATE TABLE beta_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### RAG (Retrieval Augmented Generation)
```sql
CREATE TABLE rag_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rag_chunks (
  chunk_id TEXT PRIMARY KEY,
  document_id UUID REFERENCES rag_documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rag_vectors (
  chunk_id TEXT PRIMARY KEY REFERENCES rag_chunks(chunk_id) ON DELETE CASCADE,
  embedding vector(1536) -- OpenAI text-embedding-3-small dimensions
);
```

## API Endpoints

### Authentication & User Management

#### POST /api/register
**Purpose**: User registration with email confirmation
**Request Body**:
```typescript
{
  email: string;
  password: string;
  confirmPassword: string;
}
```
**Response**: `201` on success, `400` for validation errors, `429` for rate limiting
**Features**: Rate limiting, email validation, password strength requirements

### Assessment Workflow

#### POST /api/assessment
**Purpose**: Generate AI-powered personalized assessment from survey responses
**Authentication**: Required
**Request Body**:
```typescript
{
  surveyResponses: SurveyResponses;
}
```
**Response**:
```typescript
{
  id: string;
  user_id: string;
  survey_response_id: string;
  assessment: string;
  approved: boolean;
  created_at: string;
}
```
**Process**:
1. Validates user authentication
2. Calls `generateAssessmentFromSurvey()` via Langchain/OpenAI
3. Links to latest survey response
4. Stores assessment in database

#### POST /api/assessment/approve
**Purpose**: Mark assessment as approved by user
**Authentication**: Required
**Request Body**:
```typescript
{
  assessmentId: string;
}
```
**Response**: Updated assessment record

#### POST /api/assessment/feedback
**Purpose**: Collect user feedback and revise assessment
**Authentication**: Required
**Request Body**:
```typescript
{
  assessmentId: string;
  feedback: string;
}
```
**Response**: Revised assessment
**Process**:
1. Retrieves original assessment and survey data
2. Calls `reviseAssessmentWithFeedback()` with user input
3. Updates assessment record

### Program Management

#### POST /api/program/create
**Purpose**: Generate personalized exercise program
**Authentication**: Required
**Request Body**:
```typescript
{
  assessment: string;
  exerciseFilter: {
    primary_muscles?: string[];
    equipment?: string[];
  };
}
```
**Response**: Created program record with generated JSON
**Process**:
1. Validates assessment and exercise filter
2. Fetches available exercises from database
3. Builds LLM prompt with assessment + exercises
4. Calls OpenAI via `callLLMWithPrompt()`
5. Validates LLM output structure
6. Saves program to database

#### GET /api/program/[id]
**Purpose**: Retrieve program by ID with full session/exercise data
**Authentication**: Required (owner only)
**Response**: Complete program object with nested sessions and exercises

#### POST /api/program/[id]/approve
**Purpose**: Mark program as approved
**Authentication**: Required (owner only)
**Response**: Updated program with `status: 'approved'`

#### POST /api/program/[id]/feedback
**Purpose**: Submit feedback on program
**Authentication**: Required (owner only)
**Request Body**:
```typescript
{
  feedback: string;
  sessionId?: string; // Optional: feedback on specific session
}
```
**Response**: Stored feedback record

#### POST /api/program/[id]/revise
**Purpose**: Revise program based on feedback
**Authentication**: Required (owner only)
**Process**: Uses AI to regenerate program incorporating user feedback

#### POST /api/program/[id]/start-date
**Purpose**: Set program start date
**Authentication**: Required (owner only)
**Request Body**:
```typescript
{
  startDate: string; // ISO date string
}
```

### Scheduling System

#### POST /api/program/[id]/schedule
**Purpose**: Generate session schedule with specific dates/times
**Authentication**: Required (owner only)
**Request Body**:
```typescript
{
  startDate?: string; // ISO date string
  preferences?: {
    timezone?: string; // IANA timezone
    daysOfWeek?: number[]; // 0-6, Sunday=0
    default_time?: string; // "HH:mm" 24h format
    default_duration_minutes?: number;
  };
}
```
**Response**: Updated program with scheduled sessions
**Process**:
1. Applies scheduling preferences to program sessions
2. Generates `start_at` timestamps for each session
3. Updates `program_json`, `scheduling_preferences`, `last_scheduled_at`

#### POST /api/program/[id]/schedule/feedback
**Purpose**: Adjust schedule based on user feedback
**Authentication**: Required (owner only)
**Request Body**:
```typescript
{
  feedback: string;
  adjustments?: {
    shiftDays?: number;
    shiftMinutes?: number;
    sessionUpdates?: Array<{
      uid: string;
      start_at?: string;
      duration_minutes?: number;
    }>;
  };
}
```

### Exercise Data

#### GET /api/exercises/[id]
**Purpose**: Retrieve exercise details by ID
**Authentication**: Required
**Response**: Complete exercise record with instructions, tips, variations

### Utility Endpoints

#### GET /api/health
**Purpose**: Health check endpoint
**Response**: `{ status: "ok" }`

#### POST /api/beta-request
**Purpose**: Beta signup requests
**Request Body**:
```typescript
{
  email: string;
}
```
**Features**: Rate limiting, duplicate prevention

#### POST /api/rag/retrieve
**Purpose**: Retrieve relevant context via vector similarity search
**Authentication**: Required
**Request Body**:
```typescript
{
  query: string;
  k?: number; // Number of results, default 5
}
```
**Response**: Array of relevant content chunks with similarity scores

## AI/LLM Integration

### Core LLM Service

#### `utils/llm.ts`
**Purpose**: Abstraction layer for OpenAI API calls
**Configuration**:
- Model: `gpt-4o-mini` (configurable via `OPENAI_MODEL`)
- Temperature: `0.4`
- Max tokens: `1500`
- Response format: Strict JSON only

```typescript
export async function callLLMWithPrompt(prompt: string): Promise<any> {
  // Direct OpenAI Chat Completions API call
  // Returns parsed JSON response
}
```

### Assessment Generation

#### `utils/assessmentChain.ts`
**Functions**:
- `generateAssessmentFromSurvey(surveyResponses)`: Creates personalized assessment
- `reviseAssessmentWithFeedback(assessment, surveyData, feedback)`: Updates assessment based on user input

**Process**:
1. Formats survey responses into structured prompt
2. Retrieves prompt template from PromptLayer (with fallback)
3. Calls OpenAI via Langchain
4. Returns formatted assessment text

### Program Generation

#### `utils/programPromptTemplate.ts`
**Purpose**: Builds structured prompts for exercise program generation
**Input**: Assessment text + available exercises
**Output**: Formatted prompt for LLM consumption

#### Validation: `utils/validateProgramOutput.ts`
**Purpose**: Ensures LLM-generated programs conform to expected schema
**Validation Rules**:
- Required fields presence
- Data type validation
- Exercise ID validation against available exercises
- Session structure validation

### Retrieval Augmented Generation (RAG)

#### `utils/rag.ts`
**Functions**:
- `retrieveRagChunksByText(query, k)`: Vector similarity search
- `retrieveRagChunksForSurvey(survey, k)`: Survey-specific context retrieval
- `formatChunksAsContext(chunks)`: Format results for prompt inclusion

**Process**:
1. Generates embeddings using OpenAI `text-embedding-3-small`
2. Performs vector similarity search via Supabase `match_rag_chunks` RPC
3. Returns ranked content chunks for prompt augmentation

## Scheduling System

### Core Scheduling Logic

#### `utils/scheduling.ts`
**Key Functions**:

##### `scheduleProgram(program, startDate?, preferences?)`
**Purpose**: Assigns specific dates/times to program sessions
**Parameters**:
- `program`: Exercise program JSON
- `startDate`: Optional start date (defaults to today)
- `preferences`: Scheduling preferences object

**Process**:
1. Normalizes start date to beginning of day
2. Applies day-of-week restrictions if specified
3. Generates `start_at` timestamps for each session
4. Assigns unique session UIDs
5. Sets default duration if not specified

##### `shiftProgramSchedule(program, shiftDays, shiftMinutes)`
**Purpose**: Bulk shift all scheduled sessions
**Use Case**: User wants to move entire program forward/backward

##### `updateSessionStart(program, uid, newStartAt)`
**Purpose**: Update specific session start time
**Use Case**: Individual session rescheduling

##### `updateSessionDuration(program, uid, newDurationMinutes)`
**Purpose**: Modify session duration
**Use Case**: User feedback on session length

### Scheduling Preferences

```typescript
export type SchedulingPreferences = {
  timezone?: string; // IANA timezone string
  daysOfWeek?: number[]; // 0-6, Sunday=0
  default_time?: string; // "HH:mm" 24h format
  default_duration_minutes?: number;
};
```

### Session UID Generation

Sessions receive unique identifiers for scheduling operations:
```typescript
function generateSessionUID(weekIndex: number, sessionIndex: number) {
  return `w${weekIndex + 1}s${sessionIndex + 1}`; // e.g., "w1s1", "w2s3"
}
```

## Data Access Patterns

### Program Data Helpers

#### `utils/programDataHelpers.ts`
**Key Functions**:

##### CRUD Operations
- `saveExerciseProgram(program, client)`: Create new program
- `getProgramById(id, client)`: Retrieve with full session/exercise data
- `getProgramByUserId(userId, client)`: Get user's latest program
- `updateProgramJson(id, programJson, status?, client)`: Update program content
- `updateProgramFields(id, fields, client)`: Update multiple fields including scheduling

##### Program Management
- `approveProgram(id, client)`: Set status to 'approved'
- `saveProgramFeedback(params, client)`: Store user feedback

##### Exercise Data
- `getAvailableExercises(filter?, client)`: Query exercises with filtering
- `getExerciseNamesByIds(ids, client)`: Bulk exercise name lookup

**Pattern**: All functions require explicit Supabase client parameter to avoid client confusion

### Survey & Assessment Helpers

#### `utils/surveyResponses.ts`
- Survey response persistence and retrieval
- History tracking (multiple responses per user)
- Completion validation

#### `utils/assessments.ts`
- Assessment CRUD operations
- Approval status management
- Assessment-survey linking

### User Flow Management

#### `utils/userFlow.ts`
**Functions**:
- `hasCompletedSurvey(userId)`: Check survey completion status
- `getPostLoginRedirect(user)`: Determine post-login destination
- Onboarding progress tracking

#### `utils/onboarding.ts`
**Onboarding Completion Criteria**:
1. **Survey**: `hasCompletedSurvey(userId)` returns true
2. **Assessment**: Latest assessment has `approved = true`
3. **Program**: Latest program has `status = 'approved'`
4. **Schedule**: Program has sessions with `start_at` timestamps OR `last_scheduled_at` is set

## Calendar Integration

### ICS Generation

#### `utils/ics.ts`
**Functions**:
- `generateGoogleCalendarUrl(session)`: Creates Google Calendar "add event" URL
- `generateICSContent(sessions)`: Creates .ics file content for bulk import
- `generateSessionICS(session)`: Individual session .ics

**Features**:
- Timezone handling
- Event descriptions with exercise details
- Recurring event support

### Calendar Data Flow

1. **Scheduling**: `POST /api/program/[id]/schedule` populates `start_at` fields
2. **Calendar View**: Frontend reads `program_json.weeks[].sessions[].start_at`
3. **Export**: ICS utilities generate calendar files from session data

## Error Handling & Security

### Error Response Pattern

All API routes follow consistent error handling:

```typescript
// Generic error responses (no internal details leaked)
return NextResponse.json({ error: "Failed to process request" }, { status: 500 });

// Detailed logging server-side
console.error('[500] Detailed error context:', error);
```

**HTTP Status Codes**:
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (resource doesn't exist)
- `422`: Unprocessable Entity (invalid data structure)
- `429`: Too Many Requests (rate limiting)
- `500`: Internal Server Error (unexpected errors)
- `502`: Bad Gateway (external service failures, e.g., LLM)

### Input Validation

- **Type Safety**: All inputs validated against TypeScript interfaces
- **UUID Validation**: Regex validation for all ID parameters
- **JSON Parsing**: Safe parsing with error handling
- **SQL Injection Prevention**: Parameterized queries via Supabase client

### Rate Limiting

Implemented on sensitive endpoints:
- User registration: Prevents abuse
- Beta requests: Prevents spam
- LLM calls: Protects against excessive usage

## Environment Configuration

### Required Environment Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o-mini # Optional, defaults to gpt-4o-mini

# PromptLayer (Optional)
PROMPTLAYER_API_KEY=your-promptlayer-key

# Application
NODE_ENV=production|development
```

### Runtime Configuration

- **Dynamic Routes**: All API routes use `export const dynamic = 'force-dynamic'`
- **Node Runtime**: Routes requiring Node-specific packages use `export const runtime = 'nodejs'`
- **Server Components**: Database operations use server-side Supabase clients

## Testing Strategy

### Unit Testing

**Framework**: Jest with TypeScript support
**Pattern**: Direct function testing (bypasses NextResponse for reliability)

```typescript
// Example test structure
describe('Program Creation Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Configure mocks
  });
  
  it('should process program creation successfully', async () => {
    // Test business logic directly
  });
});
```

### Integration Testing

**Approach**: Mock external services (LLM, Supabase) while testing business logic
**Coverage**: API route handlers, data helpers, validation functions

### End-to-End Testing

**Framework**: Playwright
**Coverage**: Critical user flows (registration, survey, assessment, program generation)

### Mock Strategy

- **LLM Calls**: Mocked responses for consistent testing
- **Supabase**: Mocked client with predefined responses
- **Network Calls**: Blocked in test environment
- **Environment Variables**: Test-specific configuration

## Performance Considerations

### Database Optimization

- **Indexes**: Strategic indexes on foreign keys and query patterns
- **RLS Performance**: Policies optimized for common access patterns
- **Connection Pooling**: Managed by Supabase

### Caching Strategy

- **Static Data**: Exercise catalog cached at application level
- **User Sessions**: Managed by Supabase Auth
- **API Responses**: No caching (dynamic user data)

### LLM Usage Optimization

- **Prompt Efficiency**: Structured prompts minimize token usage
- **Response Validation**: Early validation prevents wasted calls
- **Error Handling**: Graceful degradation when LLM unavailable

## Deployment & Monitoring

### Deployment Platform

**Primary**: Vercel (Next.js optimized)
**Features**:
- Automatic deployments from Git
- Environment variable management
- Serverless function scaling
- Preview deployments for PRs

### Monitoring & Logging

- **Application Logs**: Console logging with structured error context
- **Performance**: Vercel analytics and monitoring
- **Database**: Supabase dashboard and logging
- **LLM Usage**: PromptLayer integration for prompt/response tracking

### CI/CD Pipeline

**GitHub Actions Workflow**:
1. Checkout code
2. Install dependencies (pnpm)
3. Lint (ESLint)
4. Type check (TypeScript)
5. Security audit (pnpm audit)
6. Run tests (Jest)
7. Build application
8. Deploy to Vercel

## Frontend Integration Guidelines

### Authentication State

```typescript
// Use AuthContext for authentication state
const { user, loading, signOut } = useAuth();

// API calls should include authentication
const response = await fetch('/api/endpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
```

### Error Handling

```typescript
// Handle standard error responses
if (!response.ok) {
  const error = await response.json();
  throw new Error(error.error || 'Request failed');
}
```

### Data Flow Patterns

1. **Survey → Assessment → Program → Schedule**
2. **Feedback Loops**: Assessment feedback, program feedback, schedule adjustments
3. **State Management**: User progress through onboarding steps
4. **Real-time Updates**: Refresh data after mutations

### Recommended Frontend Architecture

- **State Management**: React Context or Zustand for global state
- **API Layer**: Custom hooks for API interactions
- **Form Handling**: React Hook Form with validation
- **UI Components**: Reusable component library
- **Routing**: Next.js App Router with protected routes

## Migration & Versioning

### Database Migrations

Located in `supabase/migrations/`:
- Incremental schema changes
- RLS policy updates
- Index optimizations
- Data migrations

### API Versioning

Current approach: Single version with backward compatibility
Future: Version headers or URL-based versioning for breaking changes

### Data Model Evolution

- **Additive Changes**: New optional fields
- **Breaking Changes**: Require migration strategy
- **JSON Fields**: Flexible schema evolution in `program_json`, `scheduling_preferences`

## Security Considerations

### Data Protection

- **Encryption**: All data encrypted at rest (Supabase)
- **Transport**: HTTPS enforced
- **Authentication**: JWT-based with automatic refresh
- **Authorization**: RLS policies enforce data isolation

### API Security

- **Input Validation**: Comprehensive validation on all inputs
- **SQL Injection**: Prevented via parameterized queries
- **XSS Protection**: Sanitized responses
- **CSRF**: SameSite cookies and origin validation

### External Service Security

- **API Keys**: Server-side only, never exposed to client
- **Rate Limiting**: Prevents abuse of external services
- **Error Sanitization**: No sensitive data in error responses

This documentation provides the complete technical foundation needed to build a new frontend while fully leveraging the existing Kinisi backend infrastructure. All endpoints, data models, and integration patterns are production-ready and thoroughly tested.
