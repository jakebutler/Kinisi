import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserProvider } from '@/lib/v2/contexts/UserContext';
import { UIProvider } from '@/lib/v2/contexts/UIContext';
import SurveyPage from '@/app/(onboarding)/survey/page';
import AssessmentPage from '@/app/(onboarding)/assessment/page';
import ProgramPage from '@/app/(onboarding)/program/page';
import SchedulePage from '@/app/(onboarding)/schedule/page';
import { supabase } from '@/utils/supabaseClient';

// Mock Supabase
jest.mock('@/utils/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ data: null, error: null }))
            }))
          }))
        }))
      })),
      insert: jest.fn(() => Promise.resolve({ data: { id: '1' }, error: null })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: { id: '1' }, error: null }))
      }))
    })),
    auth: {
      getUser: jest.fn(() => Promise.resolve({
        data: { user: { id: 'test-user', email: 'test@example.com' } },
        error: null
      }))
    }
  }
}));

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
      {children}
    </UIProvider>
  </UserProvider>
);

describe('Onboarding Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Onboarding Journey', () => {
    it('should complete full onboarding flow from survey to schedule', async () => {
      // Step 1: Survey completion
      const { rerender } = render(
        <TestWrapper>
          <SurveyPage />
        </TestWrapper>
      );

      // Fill out survey form
      const exerciseCheckbox = screen.getByLabelText(/strength training/i);
      fireEvent.click(exerciseCheckbox);

      const injuriesInput = screen.getByLabelText(/injuries/i);
      fireEvent.change(injuriesInput, { target: { value: 'None' } });

      const durationSelect = screen.getByLabelText(/session duration/i);
      fireEvent.change(durationSelect, { target: { value: '30-45 minutes' } });

      const confidenceSlider = screen.getByLabelText(/confidence/i);
      fireEvent.change(confidenceSlider, { target: { value: '7' } });

      const likelihoodSelect = screen.getByLabelText(/likelihood/i);
      fireEvent.change(likelihoodSelect, { target: { value: 'Very likely' } });

      // Submit survey
      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('survey_responses');
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

      const approveButton = screen.getByRole('button', { name: /approve/i });
      fireEvent.click(approveButton);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('assessments');
      });

      // Step 3: Program generation and approval
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

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('exercise_programs');
      });

      // Step 4: Schedule selection
      rerender(
        <TestWrapper>
          <SchedulePage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/schedule/i)).toBeInTheDocument();
      });

      // Select a start date
      const dateButton = screen.getByText('15'); // Assuming calendar shows day 15
      fireEvent.click(dateButton);

      const scheduleButton = screen.getByRole('button', { name: /schedule program/i });
      fireEvent.click(scheduleButton);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('exercise_programs');
      });
    });

    it('should handle errors gracefully during onboarding', async () => {
      // Mock error response
      (supabase.from as jest.Mock).mockReturnValueOnce({
        insert: jest.fn(() => Promise.resolve({ data: null, error: { message: 'Database error' } }))
      });

      render(
        <TestWrapper>
          <SurveyPage />
        </TestWrapper>
      );

      // Fill minimal form and submit
      const exerciseCheckbox = screen.getByLabelText(/strength training/i);
      fireEvent.click(exerciseCheckbox);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    it('should allow users to request updates during program review', async () => {
      render(
        <TestWrapper>
          <ProgramPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/exercise program/i)).toBeInTheDocument();
      });

      const requestUpdatesButton = screen.getByRole('button', { name: /request updates/i });
      fireEvent.click(requestUpdatesButton);

      const feedbackInput = screen.getByPlaceholderText(/feedback/i);
      fireEvent.change(feedbackInput, { 
        target: { value: 'Please add more cardio exercises' } 
      });

      const submitRequestButton = screen.getByRole('button', { name: /submit request/i });
      fireEvent.click(submitRequestButton);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('exercise_programs');
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

      // Complete survey
      const exerciseCheckbox = screen.getByLabelText(/strength training/i);
      fireEvent.click(exerciseCheckbox);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalled();
      });

      // Navigate to assessment - user state should persist
      rerender(
        <TestWrapper>
          <AssessmentPage />
        </TestWrapper>
      );

      // User context should still be available
      await waitFor(() => {
        expect(screen.getByText(/assessment/i)).toBeInTheDocument();
      });
    });

    it('should handle loading states properly', async () => {
      render(
        <TestWrapper>
          <AssessmentPage />
        </TestWrapper>
      );

      // Should show loading state initially
      expect(screen.getByText(/loading/i)).toBeInTheDocument();

      // Should show content after loading
      await waitFor(() => {
        expect(screen.getByText(/assessment/i)).toBeInTheDocument();
      });
    });
  });
});
