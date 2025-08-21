## Stage 1: Data + Types
**Goal**: Add scheduling fields to DB and types.
**Success Criteria**:
- New migration adds `scheduling_preferences JSONB`, `last_scheduled_at TIMESTAMPTZ` to `exercise_programs`.
- Types updated to include `uid`, `start_at`, `duration_minutes` on sessions.
**Tests**:
- Typecheck passes.
- DB migration applies locally without errors.
**Status**: In Progress

## Stage 2: Scheduling Agent + Validation
**Goal**: Build utilities to generate and update schedules via LLM.
**Success Criteria**:
- `utils/schedulingAgent.ts` with `buildInitialSchedulePrompt()`, `buildReschedulePrompt()` and application helpers.
- `utils/validateScheduleOutput.ts` validates response shape and values.
**Tests**:
- Unit tests mock LLM and validate happy/error paths.
**Status**: Not Started

## Stage 3: API Endpoints
**Goal**: Create scheduling endpoints.
**Success Criteria**:
- `POST /api/program/[id]/schedule` (initial schedule) persists `start_at` and `duration_minutes` into `program_json`, stores `scheduling_preferences`, updates `last_scheduled_at`.
- `POST /api/program/[id]/schedule/feedback` (update schedule) applies user feedback and persists changes.
**Tests**:
- Integration tests with full mocks for Supabase + LLM.
- Covers auth, validation, 404, 422, 502, 500 paths.
**Status**: Not Started

## Stage 4: Calendar UI + Add-to-Calendar
**Goal**: Visualize sessions and export calendar entries.
**Success Criteria**:
- `components/program/ProgramCalendar.tsx` using FullCalendar.
- `app/program/[id]/calendar/page.tsx` renders calendar from `program_json` sessions using `start_at`.
- `utils/ics.ts` generates per-session Google URLs and .ics; bulk .ics for all sessions.
- "View calendar" and per-session "Add to Calendar" links in `ProgramSection.tsx` and `app/program/[id]/page.tsx`.
**Tests**:
- ICS util unit tests for formatting/timezones.
**Status**: Not Started

## Stage 5: Docs & Polish
**Goal**: Document contracts and flows.
**Success Criteria**:
- README or docs update describing API contracts, scheduling flow, and UI usage.
- Lint/format clean; typecheck passes.
**Tests**:
- N/A (docs).
**Status**: Not Started
