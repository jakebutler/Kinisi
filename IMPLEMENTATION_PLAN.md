# Kinisi v2 Frontend Implementation Plan

*Updated based on v2 POC analysis - leveraging proven patterns and components*

## Stage 1: Foundation & Core Infrastructure
**Goal**: Establish new v2 foundation with authentication and routing, adapting POC patterns to Next.js
**Success Criteria**: 
- New v2 folder structure created (`app/(auth)`, `app/(onboarding)`, `app/(dashboard)`, `components/v2/`, `lib/v2/`)
- Authentication flow working with existing Supabase backend
- Route protection implemented for onboarding and dashboard routes
- **Base UI components ported from POC**: Button, Header components with Kinisi branding
- **State management**: Start with React Context (simpler than Zustand, matches POC approach)
- **Icons**: Integrate Lucide React (proven in POC)
- TypeScript interfaces matching POC patterns

**Tests**: 
- Authentication flow unit tests
- Route protection integration tests
- Base component rendering tests (Button, Header)
- Context provider behavior tests

**Status**: Not Started

## Stage 2: Onboarding Flow - Survey & Assessment
**Goal**: Implement steps 1-2 of onboarding (Survey → Assessment), adapting POC components
**Success Criteria**:
- **OnboardingProgress component**: Port from POC with 4-step progress tracker
- **IntakeSurvey component**: Multi-question form with progress bar and validation (from POC)
- **PersonalizedAssessment component**: Draft/Approved workflow with request updates (from POC)
- Survey submission to existing `POST /api/assessment` endpoint
- Assessment generation and display with loading states
- **POC patterns**: Question-by-question navigation, confidence slider, exercise selection
- State management for survey data and assessment status using Context

**Tests**: 
- Survey form validation and submission tests
- Assessment generation workflow tests
- Progress tracker state transition tests
- Request updates flow integration tests

**Status**: Not Started

## Stage 3: Onboarding Flow - Program & Schedule
**Goal**: Complete onboarding with steps 3-4 (Program → Schedule), using POC components
**Success Criteria**:
- **ExerciseProgram component**: Port from POC with week/session structure and expand/collapse
- **CalendarView component**: Port from POC with date selection and session preview
- Program approval workflow with Draft/Approved states (POC pattern)
- Schedule generation using existing `POST /api/program/[id]/schedule` endpoint
- **POC patterns**: Exercise details toggle, session expansion, calendar navigation
- Complete onboarding → Active user transition
- Progress tracker steps 3-4 functional
- Start date selection and scheduling preferences UI

**Tests**: 
- Program display and interaction tests
- Schedule generation integration tests
- Calendar integration tests
- Onboarding completion flow tests

**Status**: Not Started

## Stage 4: Active User Dashboard
**Goal**: Implement 3-page navigation for active users, using POC Navigation component
**Success Criteria**:
- **Navigation component**: Port from POC with 3-tab layout (program, assessment, survey)
- **Fitness Program & Schedule page**: Reuse ExerciseProgram component with `isActive` prop
- **Assessment management page**: Reuse PersonalizedAssessment component with `isActive` prop
- **Survey update page**: Reuse IntakeSurvey component for editing responses
- **POC patterns**: Tab-based navigation, component reuse with different modes
- Update request workflows for all content types (proven in POC)
- Calendar export functionality (Google Calendar, .ics files)
- Session rescheduling and program modification features

**Tests**: 
- Dashboard navigation tests
- Update workflow integration tests
- Calendar functionality tests
- Export feature tests

**Status**: Not Started

## Stage 5: Polish & Migration
**Goal**: Production readiness and migration strategy
**Success Criteria**:
- Performance optimization (code splitting, lazy loading, bundle analysis)
- Accessibility compliance (WCAG 2.1 AA standards)
- Error handling and loading states throughout application
- Mobile responsiveness and cross-browser compatibility
- Migration plan from v1 to v2 with feature flags
- Documentation updates for v2 architecture
- E2E test coverage for critical user journeys

**Tests**: 
- E2E flows with Playwright
- Performance tests and lighthouse scores
- Accessibility tests with axe-core
- Cross-browser compatibility tests

**Status**: Not Started

## Technical Architecture

### State Management
- **React Context** for global state management (matches POC approach)
- **User Context**: Authentication state, user status (onboarding/active)
- **Onboarding Context**: Current step, survey data, assessment, program
- **UI Context**: Loading states, error handling, notifications
- **POC Pattern**: Local useState for component-specific state, Context for shared state

### Component Architecture (Based on POC)
```
components/v2/
├── ui/                        # Base UI components (ported from POC)
│   ├── Button.tsx            # ✓ Proven in POC with Kinisi branding
│   ├── Header.tsx            # ✓ Proven in POC
│   └── Input.tsx             # New, following POC patterns
├── onboarding/               # Onboarding components (ported from POC)
│   ├── OnboardingProgress.tsx # ✓ 4-step progress tracker from POC
│   ├── IntakeSurvey.tsx      # ✓ Multi-question form from POC
│   ├── PersonalizedAssessment.tsx # ✓ Draft/approved workflow from POC
│   ├── ExerciseProgram.tsx   # ✓ Week/session structure from POC
│   └── CalendarView.tsx      # ✓ Date selection from POC
├── dashboard/                # Dashboard components (POC patterns)
│   ├── Navigation.tsx        # ✓ 3-tab navigation from POC
│   └── DashboardLayout.tsx   # New, wrapping POC components
└── shared/                   # Shared utilities
    └── LoadingSpinner.tsx    # New, following POC styling
```

### API Integration
- **Custom hooks** for API interactions (`useAssessment`, `useProgram`, `useSchedule`)
- **Error handling** with consistent patterns
- **Loading states** managed through Context (matches POC local state approach)
- **Type safety** with existing backend interfaces
- **POC Integration**: Replace mock data with real API calls, maintain UX patterns

### Routing Strategy
```
app/
├── (auth)/                   # Authentication routes
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── layout.tsx
├── (onboarding)/            # Onboarding routes
│   ├── survey/page.tsx
│   ├── assessment/page.tsx
│   ├── program/page.tsx
│   ├── schedule/page.tsx
│   └── layout.tsx
└── (dashboard)/             # Active user routes
    ├── fitness-program/page.tsx
    ├── assessment/page.tsx
    ├── survey/page.tsx
    └── layout.tsx
```

## Migration Strategy

### Phase 1: Parallel Development
- Build v2 alongside existing v1 code
- Use feature flags to control access
- Test with internal users first

### Phase 2: Gradual Rollout
- New users automatically use v2
- Existing users migrate on next login
- Rollback capability maintained

### Phase 3: Full Migration
- All users on v2
- Remove v1 code after validation period
- Update documentation and deployment

## Risk Mitigation

### Technical Risks
- **API Compatibility**: Extensive testing with existing backend
- **Performance**: Bundle size monitoring, lazy loading implementation
- **State Management**: Comprehensive Zustand store testing

### User Experience Risks
- **Migration Disruption**: Gradual rollout with user feedback
- **Feature Parity**: Ensure v2 matches/exceeds v1 functionality
- **Accessibility**: WCAG compliance testing throughout

## Definition of Done

Each stage must meet:
- All tests passing (unit, integration, E2E where applicable)
- TypeScript compilation with no errors
- ESLint and Prettier formatting clean
- Code review completed
- Documentation updated
- Accessibility requirements met
- Performance benchmarks satisfied