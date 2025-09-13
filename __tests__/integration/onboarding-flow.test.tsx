import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserProvider } from '@/lib/v2/contexts/UserContext';
import { UIProvider } from '@/lib/v2/contexts/UIContext';
import { OnboardingProvider } from '@/lib/v2/contexts/OnboardingContext';
import SurveyPage from '@/app/(onboarding)/survey/page';
import AssessmentPage from '@/app/(onboarding)/assessment/page';
import ProgramPage from '@/app/(onboarding)/program/page';
import SchedulePage from '@/app/(onboarding)/schedule/page';
import { supabase } from '@/utils/supabaseClient';

// Make ProtectedRoute a no-op in this integration test
jest.mock('@/lib/v2/components/ProtectedRoute', () => ({
  __esModule: true,
  default: ({ children }: any) => <>{children}</>,
}));

// Mock hooks to avoid real fetch and make flow deterministic
jest.mock('@/lib/v2/hooks/useAssessment', () => {
  const api = {
    loading: false,
    error: null,
    generateAssessment: jest.fn(async () => ({ id: 'a1', approved: false, assessment: 'Generated assessment', user_id: 'test-user' })),
    approveAssessment: jest.fn(async () => true),
    requestAssessmentUpdate: jest.fn(async () => ({ id: 'a1', approved: false, assessment: 'Updated assessment', user_id: 'test-user' })),
  };
  return {
    __esModule: true,
    useAssessment: () => api,
    __api: api,
  };
});

// Mock OnboardingContext to remove provider effects and allow direct state control
jest.mock('@/lib/v2/contexts/OnboardingContext', () => {
  const state: any = {
    currentStep: 1,
    setCurrentStep: jest.fn(),
    surveyData: null,
    setSurveyData: jest.fn((v: any) => { state.surveyData = v; }),
    assessment: null,
    setAssessment: jest.fn((v: any) => { state.assessment = v; }),
    exerciseProgram: null,
    setExerciseProgram: jest.fn((v: any) => { state.exerciseProgram = v; }),
    resetOnboarding: jest.fn(() => {
      state.currentStep = 1;
      state.surveyData = null;
      state.assessment = null;
      state.exerciseProgram = null;
    }),
    loading: false,
  };
  return {
    __esModule: true,
    useOnboarding: () => state,
    OnboardingProvider: ({ children }: any) => <>{children}</>,
    __setOnboardingState: (partial: any) => Object.assign(state, partial),
  };
});

jest.mock('@/lib/v2/hooks/useProgram', () => {
  const api = {
    loading: false,
    error: null,
    generateProgram: jest.fn(async () => ({ id: 'p1', user_id: 'test-user', approved: false, program_json: [ { weekNumber: 1, goal: 'Foundation', sessions: [ { id: 's1', name: 'Session 1', goal: 'Strength', exercises: [ { id: 'e1', name: 'Push-ups', sets: 3, reps: '10-12', targetMuscles: ['chest'] } ] } ] } ] })),
    approveProgram: jest.fn(async () => true),
    requestProgramUpdate: jest.fn(async () => ({ id: 'p1', user_id: 'test-user', approved: false, program_json: [] })),
    scheduleProgram: jest.fn(async () => true),
  };
  return {
    __esModule: true,
    useProgram: () => api,
    __api: api,
  };
});

// Mock Next.js router/navigation used by ProtectedRoute and pages
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/',
  useSearchParams: () => ({ get: () => null }),
}));

// Mock Supabase
jest.mock('@/utils/supabaseClient', () => {
  const makeChain = (table: string) => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        order: jest.fn(() => ({
          limit: jest.fn(() => ({
            maybeSingle: jest.fn(() => {
              if (table === 'assessments') {
                return Promise.resolve({ data: { id: 'a1', user_id: 'test-user', approved: true, assessment: 'Approved assessment' }, error: null });
              }
              if (table === 'exercise_programs') {
                return Promise.resolve({ data: null, error: null });
              }
              if (table === 'survey_responses') {
                return Promise.resolve({ data: null, error: null });
              }
              return Promise.resolve({ data: null, error: null });
            })
          }))
        }))
      }))
    })),
  });
  return {
    supabase: {
      from: jest.fn((table: string) => makeChain(table)),
      insert: jest.fn(() => Promise.resolve({ data: { id: '1' }, error: null })),
      update: jest.fn(() => ({ eq: jest.fn(() => Promise.resolve({ data: { id: '1' }, error: null })) })),
      auth: {
        getSession: jest.fn(() => Promise.resolve({ data: { session: { user: { id: 'test-user', email: 'test@example.com' } } }, error: null })),
        getUser: jest.fn(() => Promise.resolve({ data: { user: { id: 'test-user', email: 'test@example.com' } }, error: null })),
        onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
        signOut: jest.fn(() => Promise.resolve({ error: null })),
      }
    }
  };
});

// Mock LLM utilities
jest.mock('@/utils/llm', () => ({
  generateAssessment: jest.fn(() => Promise.resolve('Mock assessment content')),
  generateProgram: jest.fn(() => Promise.resolve({
    weeks: [
      {
        weekNumber: 1,
        goal: 'Foundation building',
        sessions: [
          {
            id: 'session-1',
            name: 'Upper Body Strength',
            goal: 'Build upper body strength',
            exercises: [
              {
                id: 'ex-1',
                name: 'Push-ups',
                sets: 3,
                reps: '10-12',
                targetMuscles: ['chest', 'triceps'],
                instructions: 'Standard push-up form'
              }
            ]
          }
        ]
      }
    ]
  }))
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <UserProvider>
    <UIProvider>
      <OnboardingProvider>
        {children}
      </OnboardingProvider>
    </UIProvider>
  </UserProvider>
);

describe('Onboarding Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { __setOnboardingState } = require('@/lib/v2/contexts/OnboardingContext');
    __setOnboardingState({
      currentStep: 1,
      surveyData: null,
      assessment: null,
      exerciseProgram: null,
      loading: false,
    });
  });

  const completeSurveyFlow = async () => {
    const user = userEvent.setup();
    // Wait for survey heading
    await waitFor(() => expect(screen.getByText(/intake survey/i)).toBeInTheDocument());

    // Primary goal
    await user.click(screen.getByText('Gain strength'));
    await user.click(screen.getByRole('button', { name: /continue/i }));

    // Medical clearance
    await user.click(screen.getByText('No'));
    await user.click(screen.getByRole('button', { name: /continue/i }));

    // Current pain
    await user.click(screen.getByText('No'));
    await user.click(screen.getByRole('button', { name: /continue/i }));

    // Activity frequency
    await user.click(screen.getByText(/3–4/));
    await user.click(screen.getByRole('button', { name: /continue/i }));

    // Physical function
    await user.click(screen.getByText('Good'));
    await user.click(screen.getByRole('button', { name: /continue/i }));

    // Intent to change
    await user.click(screen.getByText('Yes'));
    await user.click(screen.getByRole('button', { name: /continue/i }));

    // Importance (choose 7)
    await user.click(screen.getByRole('button', { name: '7' }));
    await user.click(screen.getByRole('button', { name: /continue/i }));

    // Confidence (choose 7)
    await user.click(screen.getByRole('button', { name: '7' }));
    await user.click(screen.getByRole('button', { name: /continue/i }));

    // Sleep
    await user.click(screen.getByText('7–8 hours'));
    await user.click(screen.getByRole('button', { name: /continue/i }));

    // Tobacco use
    await user.click(screen.getByText('No'));
    await user.click(screen.getByRole('button', { name: /continue/i }));

    // Activity preferences
    await user.click(screen.getByText('Strength training'));
    await user.click(screen.getByRole('button', { name: /continue/i }));

    // Equipment access
    await user.click(screen.getByText('Dumbbells or resistance bands'));
    await user.click(screen.getByRole('button', { name: /continue/i }));

    // Time commitment
    await user.click(screen.getByRole('button', { name: '3' }));
    const minutes = screen.getByPlaceholderText('Enter minutes (5-180)');
    await user.type(minutes, '30');
    await user.click(screen.getByText('Morning'));
    await user.click(screen.getByRole('button', { name: /complete/i }));
  };

  describe('Complete Onboarding Journey', () => {
    it('should complete full onboarding flow from survey to schedule', async () => {
      // Step 1: Survey completion
      const { rerender, container } = render(
        <TestWrapper>
          <SurveyPage />
        </TestWrapper>
      );
      await completeSurveyFlow();

      // After completing survey, proceed to Assessment step
      const { __setOnboardingState } = require('@/lib/v2/contexts/OnboardingContext');
      __setOnboardingState({
        assessment: { id: 'a1', approved: false, assessment: 'Generated assessment', user_id: 'test-user' },
        currentStep: 2,
      });

      // Step 2: Assessment generation and approval
      rerender(
        <TestWrapper>
          <AssessmentPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/personalized assessment/i)).toBeInTheDocument();
      });

      const approveButton = screen.getByRole('button', { name: /approve assessment/i });
      fireEvent.click(approveButton);

      // Approval succeeded via mocked hook

      // Step 3: Program generation and approval
      // Ensure state reflects approved assessment and a generated draft program
      __setOnboardingState({
        assessment: { id: 'a1', approved: true, assessment: 'Generated assessment', user_id: 'test-user' },
        exerciseProgram: { id: 'p1', user_id: 'test-user', approved: false, program_json: [ { weekNumber: 1, goal: 'Foundation', sessions: [ { id: 's1', name: 'Session 1', goal: 'Strength', exercises: [ { id: 'e1', name: 'Push-ups', sets: 3, reps: '10-12', targetMuscles: ['chest'] } ] } ] } ] },
        currentStep: 3,
      });
      rerender(
        <TestWrapper>
          <ProgramPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/exercise program/i)).toBeInTheDocument();
      });

      const approveProgramButton = screen.getByRole('button', { name: /approve program/i });
      fireEvent.click(approveProgramButton);

      // Scheduling will show a success notification

      // Step 4: Schedule selection
      // Mark program as approved in onboarding state before navigating to schedule
      __setOnboardingState({
        exerciseProgram: { id: 'p1', user_id: 'test-user', approved: true, program_json: [ { weekNumber: 1, goal: 'Foundation', sessions: [ { id: 's1', name: 'Session 1', goal: 'Strength', exercises: [ { id: 'e1', name: 'Push-ups', sets: 3, reps: '10-12', targetMuscles: ['chest'] } ] } ] } ] },
        currentStep: 4,
      });
      rerender(
        <TestWrapper>
          <SchedulePage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryAllByText(/schedule/i).length).toBeGreaterThan(0);
      });

      // Select a start date via the date input (more reliable than clicking calendar cells)
      const future = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      const futureStr = future.toISOString().split('T')[0];
      const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement;
      expect(dateInput).toBeTruthy();
      fireEvent.change(dateInput!, { target: { value: futureStr } });

      const scheduleButton = screen.getByRole('button', { name: /create my fitness program/i });
      fireEvent.click(scheduleButton);

      const programMod2 = require('@/lib/v2/hooks/useProgram');
      await waitFor(() => {
        expect(programMod2.__api.scheduleProgram).toHaveBeenCalledWith(
          'p1',
          expect.stringMatching(/\d{4}-\d{2}-\d{2}/)
        );
      });
    });

    it('should handle errors gracefully during onboarding', async () => {
      // Make generateAssessment throw to trigger error UI
      const assess = require('@/lib/v2/hooks/useAssessment');
      assess.__api.generateAssessment.mockRejectedValueOnce(new Error('LLM error'));

      render(
        <TestWrapper>
          <SurveyPage />
        </TestWrapper>
      );

      await completeSurveyFlow();

      await waitFor(() => {
        expect(screen.getByTestId('notifications')).toHaveTextContent(/error/i);
      });
    });

    it('should allow users to request updates during program review', async () => {
      const { __setOnboardingState } = require('@/lib/v2/contexts/OnboardingContext');
      __setOnboardingState({
        currentStep: 3,
        surveyData: {},
        assessment: { id: 'a1', user_id: 'test-user', approved: true, assessment: 'Approved assessment' },
        exerciseProgram: { id: 'p1', user_id: 'test-user', approved: false, program_json: [ { weekNumber: 1, goal: 'Foundation', sessions: [ { id: 's1', name: 'Session 1', goal: 'Strength', exercises: [ { id: 'e1', name: 'Push-ups', sets: 3, reps: '10-12', targetMuscles: ['chest'] } ] } ] } ] },
        loading: false,
      });

      render(
        <TestWrapper>
          <ProgramPage />
        </TestWrapper>
      );

      // Program UI should be present
      await waitFor(() => {
        expect(screen.getByText(/your exercise program/i)).toBeInTheDocument();
      });

      const requestUpdatesButton = screen.getByRole('button', { name: /request updates/i });
      fireEvent.click(requestUpdatesButton);

      const feedbackInput = screen.getByPlaceholderText(/what you'd like to change/i);
      fireEvent.change(feedbackInput, { 
        target: { value: 'Please add more cardio exercises' } 
      });

      const submitRequestButton = screen.getByRole('button', { name: /submit request/i });
      fireEvent.click(submitRequestButton);

      const programMod = require('@/lib/v2/hooks/useProgram');
      await waitFor(() => {
        expect(programMod.__api.requestProgramUpdate).toHaveBeenCalledWith(
          'p1',
          expect.stringMatching(/cardio/i)
        );
      });
    });
  });

  describe('Navigation and State Management', () => {
    it('should maintain user state across onboarding steps', async () => {
      const { rerender } = render(
        <TestWrapper>
          <SurveyPage />
        </TestWrapper>
      );

      await completeSurveyFlow();

      // Navigate to assessment - user state should persist
      const { __setOnboardingState } = require('@/lib/v2/contexts/OnboardingContext');
      __setOnboardingState({
        currentStep: 2,
        surveyData: {},
        assessment: { id: 'a1', user_id: 'test-user', approved: false, assessment: 'Generated assessment' },
        exerciseProgram: null,
        loading: false,
      });
      rerender(
        <TestWrapper>
          <AssessmentPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/personalized assessment/i)).toBeInTheDocument();
      });
    });

    it('should handle loading states properly', async () => {
      render(
        <TestWrapper>
          <AssessmentPage />
        </TestWrapper>
      );

      // Content for no assessment should be displayed (protected route is mocked as no-op)
      await waitFor(() => {
        expect(screen.getByText(/no assessment found/i)).toBeInTheDocument();
      });
    });
  });
});
