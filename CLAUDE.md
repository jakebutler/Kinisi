# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Kinisi** is an AI-powered exercise program generator built as a modern Next.js 15 web application. It guides users through an intake survey, generates personalized fitness assessments using OpenAI GPT via LangChain, and creates tailored exercise programs with scheduling capabilities.

**Core Technologies:**
- Frontend: Next.js 15 (App Router) + TypeScript + Tailwind CSS v4
- Backend: Next.js API routes + Supabase PostgreSQL (RLS enabled)
- Authentication: Supabase Auth
- AI Integration: OpenAI GPT-3.5/4 via LangChain + PromptLayer
- Testing: Jest (unit/integration) + Playwright (E2E)
- Package Manager: pnpm (v10.15.0)
- Deployment: Vercel with GitHub Actions CI/CD

## Essential Development Commands

### Core Development
```bash
pnpm install              # Install dependencies
pnpm dev                  # Start development server (localhost:3000)
pnpm build                # Production build
pnpm start                # Start production server
pnpm lint                 # ESLint checking
```

### Testing Strategy
```bash
pnpm test                 # Run Jest tests (unit/integration)
npx playwright test       # Run Playwright E2E tests
pnpm typecheck            # TypeScript type checking (excludes tests)
```

### Database & AI
```bash
pnpm ingest:rag           # Ingest exercise data to RAG vector store
pnpm seed:e2e             # Seed E2E test data
pnpm seed:e2e:unscheduled # Seed unscheduled E2E test data
```

## Architecture Overview

### Directory Structure
```
app/                      # Next.js App Router
├── api/                  # API endpoints (assessment, program, rag, register, etc.)
├── (onboarding)/        # Onboarding flow (survey, assessment, program, schedule)
├── dashboard-v2/        # Modern dashboard with fitness-program view
├── legacy/              # Legacy components (assessment, survey)
├── register/            # User registration
├── forgot-password/     # Password reset
├── auth/                # Authentication callbacks
├── program/[id]/        # Program-specific pages (calendar, detail)
└── layout.tsx           # Root layout with navigation

components/              # React components
├── ui/                  # Common UI (NavBar, ProtectedRoute)
├── context/             # React context (AuthContext)
├── home/                # Landing page sections
├── dashboard/           # Dashboard components
└── program/             # Program-related UI

utils/                   # Core business logic
├── assessmentChain.ts   # AI assessment generation/revision with PromptLayer
├── supabaseClient.ts    # Client-side Supabase setup
├── supabaseServer.ts    # Server-side Supabase setup
├── rag.ts               # Retrieval-Augmented Generation
├── promptlayer.ts       # PromptLayer tracking utilities
└── types/               # TypeScript definitions

__tests__/               # Unit/integration tests
├── unit/               # Unit tests for utilities
├── integration/        # Integration tests
├── api/                # API route tests
├── utils/              # Test utilities and mocks
└── fixtures/           # Test data

e2e/                    # Playwright E2E tests
docs/                   # Documentation (DATABASE_SCHEMA, etc.)
scripts/                # Build and utility scripts
supabase/              # Database migrations and RAG data
```

### Key Architectural Patterns

#### Authentication Flow
- **Supabase Auth** handles email/password + social login
- **AuthContext** provides global auth state management
- **ProtectedRoute** component guards authenticated pages
- Server-side validation using `createSupabaseServerClient()`

#### API Architecture
- All API routes use `export const dynamic = 'force-dynamic'`
- Generic error responses to clients, detailed logging server-side
- Strict input validation with type narrowing
- Minimal database payloads for security

#### AI Integration
- **LangChain** + **OpenAI GPT** for assessment generation
- **PromptLayer** for prompt management and tracing
- **RAG (Retrieval-Augmented Generation)** for contextual prompts
- Fallback mechanisms when API quotas exceeded

#### Assessment Revision Model
- **Append-only revisions**: New rows with `revision_of` reference
- Preserves full audit history and supports change tracking
- Survey responses stored in history model before assessment

## Testing Infrastructure

### Direct Function Testing Approach
**Critical**: Due to Jest/Next.js compatibility issues, we use **Direct Function Testing** that bypasses NextResponse entirely:

```typescript
// Mock dependencies inline per test
jest.mock('@/utils/llm', () => ({
  callLLMWithPrompt: jest.fn()
}));

// Test business logic directly, not HTTP layer
it('should process assessment logic', async () => {
  (callLLMWithPrompt as jest.Mock).mockResolvedValue(mockResponse);
  const result = await generateAssessmentFromSurvey(data);
  expect(result).toMatchObject(expectedShape);
});
```

### Key Testing Rules
- **Network Isolation**: All external calls blocked in tests
- **Manual Mocking**: Mock Supabase, LLM services, network calls
- **Separate Typechecking**: Tests excluded from main typecheck via `tsconfig.build.json`

### CI/CD Pipeline
- Triggers: Push to main, pull requests
- Jobs: Build, lint, typecheck, security audit, Jest tests, Playwright tests
- Environment: Supabase secrets from GitHub repository secrets

## Database Schema (Key Tables)

- **users**: User profiles and authentication data
- **survey_responses**: User intake survey responses (history model)
- **assessments**: AI-generated assessments (append-only revisions)
- **exercise_programs**: Generated exercise programs
- **program_sessions**: Scheduled exercise sessions

See `docs/DATABASE_SCHEMA.md` for complete schema.

## Critical Business Logic Files

1. **`utils/assessmentChain.ts`** - Core AI assessment generation and revision logic
2. **`app/api/assessment/route.ts`** - Assessment generation endpoint
3. **`components/context/AuthContext.tsx`** - Global authentication state
4. **`utils/supabaseServer.ts`** - Server-side Supabase client
5. **`__tests__/unit/`** - Unit test examples and patterns

## Development Workflow

### Pre-commit Checks
- Husky hooks run tests automatically
- Manual verification: `pnpm lint && pnpm test && pnpm typecheck && pnpm build`

### Branch Management
- Automated cleanup of merged branches via scripts
- PR-based development with comprehensive review

## Security Considerations

- Row-Level Security (RLS) enabled on all Supabase tables
- Generic error responses to clients (detailed errors logged server-side)
- Strict input validation and safe type narrowing
- Minimal database payloads and narrow selects
- API keys and secrets managed via environment variables

## Current Implementation Status

**Fully Implemented:**
- User authentication and registration (email/password + social login)
- Dynamic intake survey with validation
- AI-powered assessment generation and feedback loop
- Exercise program generation with chat-based revisions
- Complete program scheduling infrastructure
- Calendar integration with Google Calendar links and ICS export
- PromptLayer tracking for LLM prompt observability
- Comprehensive testing infrastructure (Jest + Playwright)
- RAG (Retrieval-Augmented Generation) for contextual prompts

**Architecture Maturity:**
- ✅ **Sprint 1-7 Complete**: All core features implemented
- ✅ **Production Ready**: Full CI/CD pipeline with comprehensive testing
- ✅ **Security**: Row-Level Security, proper authentication, input validation
- ✅ **Scalability**: Modern Next.js 15 architecture with TypeScript

## Environment Setup

Required environment variables (create `.env.local`):
```ini
# Supabase (client)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Supabase (server)
SUPABASE_SERVICE_ROLE_KEY=

# Secure registration
ACCESS_CODE=

# Email (Resend)
RESEND_API_KEY=
EMAIL_FROM=

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Common Pitfalls & Solutions

### Testing Issues
- **NextResponse Mocking**: Never test NextResponse directly - use direct function testing
- **Network Calls**: Always mock external services in tests
- **Type Checking**: Tests excluded from main typecheck - use `tsconfig.build.json`

### API Development
- **Dynamic Routes**: Must include `export const dynamic = 'force-dynamic'`
- **Supabase Client**: Use `createSupabaseServerClient()` in API routes
- **Error Handling**: Return generic errors to clients, log details server-side

### Database Operations
- **RLS Policies**: Ensure policies exist for all table operations
- **Append-only Model**: Never update existing assessments - create new revisions
- **History Tracking**: Survey responses stored before assessment creation