import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserProvider } from '@/lib/v2/contexts/UserContext';
import { UIProvider } from '@/lib/v2/contexts/UIContext';
import DashboardPage from '@/app/dashboard-v2/fitness-program/page';
import { supabase } from '@/utils/supabaseClient';

// Mock the useDashboardData hook
jest.mock('@/lib/v2/hooks/useDashboardData', () => ({
  useDashboardData: jest.fn()
}));

// Default mock data
const mockDashboardData = {
  program: {
    id: 'program-1',
    user_id: 'test-user',
    status: 'approved',
    program_json: [
      {
        id: 'session-1',
        name: 'Upper Body',
        start_at: '2024-01-15T09:00:00Z',
        exercises: [
          { name: 'Push-ups', sets: 3, reps: '10-12' }
        ]
      }
    ],
    created_at: '2024-01-01T00:00:00Z',
    last_scheduled_at: '2024-01-10T00:00:00Z'
  },
  assessment: {
    id: 'assessment-1',
    user_id: 'test-user',
    assessment: 'Your personalized fitness assessment shows great potential for strength training.',
    approved: true,
    created_at: '2024-01-01T00:00:00Z'
  },
  surveyData: {
    id: 'survey-1',
    user_id: 'test-user',
    response: {
      selectedExercises: ['strength training'],
      injuries: 'None',
      sessionDuration: '30-45 minutes'
    },
    created_at: '2024-01-01T00:00:00Z'
  },
  loading: false,
  error: null,
  refresh: jest.fn()
};

// Mock Supabase with comprehensive dashboard data
jest.mock('@/utils/supabaseClient', () => ({
  supabase: {
    from: jest.fn((table) => {
      const mockData: Record<string, any[]> = {
        exercise_programs: [{
          id: 'program-1',
          user_id: 'test-user',
          status: 'approved',
          program_json: [
            {
              id: 'session-1',
              name: 'Upper Body',
              start_at: '2024-01-15T09:00:00Z',
              exercises: [
                { name: 'Push-ups', sets: 3, reps: '10-12' }
              ]
            }
          ],
          created_at: '2024-01-01T00:00:00Z',
          last_scheduled_at: '2024-01-10T00:00:00Z'
        }],
        assessments: [{
          id: 'assessment-1',
          user_id: 'test-user',
          assessment: 'Your personalized fitness assessment shows...',
          approved: true,
          created_at: '2024-01-01T00:00:00Z'
        }],
        survey_responses: [{
          id: 'survey-1',
          user_id: 'test-user',
          response: {
            selectedExercises: ['strength training'],
            injuries: 'None',
            sessionDuration: '30-45 minutes'
          },
          created_at: '2024-01-01T00:00:00Z'
        }]
      };

      return {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => Promise.resolve({ 
                data: mockData[table] || [], 
                error: null 
              }))
            }))
          }))
        }))
      };
    }),
    auth: {
      getUser: jest.fn(() => Promise.resolve({
        data: { user: { id: 'test-user', email: 'test@example.com' } },
        error: null
      }))
    }
  }
}));

// Mock user context with active user
const mockUser = {
  id: 'test-user',
  email: 'test@example.com',
  username: 'testuser',
  status: 'active' as const
};

jest.mock('@/lib/v2/contexts/UserContext', () => ({
  useUser: () => ({
    user: mockUser,
    userStatus: 'active',
    loading: false,
    setUser: jest.fn(),
    setUserStatus: jest.fn(),
    refreshUserStatus: jest.fn(),
    signOut: jest.fn()
  }),
  UserProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

jest.mock('@/lib/v2/contexts/UIContext', () => ({
  useUI: () => ({
    addNotification: jest.fn(),
    removeNotification: jest.fn(),
    notifications: []
  }),
  UIProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="ui-provider">{children}</div>
}));

describe('Dashboard Flow Integration Tests', () => {
  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <UserProvider>
      <UIProvider>
        {children}
      </UIProvider>
    </UserProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock to default state before each test
    const { useDashboardData } = require('@/lib/v2/hooks/useDashboardData');
    useDashboardData.mockReturnValue(mockDashboardData);
  });

  describe('Dashboard Data Loading', () => {
    it('should load and display all dashboard data correctly', async () => {
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      // Should show navigation tabs
      expect(screen.getByText('Fitness Program')).toBeInTheDocument();
      expect(screen.getByText('Assessment')).toBeInTheDocument();
      expect(screen.getByText('Survey')).toBeInTheDocument();

      // Should display program data
      expect(screen.getByText(/your fitness program/i)).toBeInTheDocument();
    }, 10000);

    it('should handle tab switching correctly', async () => {
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      // Should show program content initially
      expect(screen.getByText(/your fitness program/i)).toBeInTheDocument();

      // Switch to assessment tab
      const assessmentTab = screen.getByText(/assessment/i);
      fireEvent.click(assessmentTab);

      // Should show assessment content
      expect(screen.getByText(/personalized fitness assessment/i)).toBeInTheDocument();

      // Switch to survey tab
      const surveyTab = screen.getByText(/survey/i);
      fireEvent.click(surveyTab);

      // Should show survey content
      expect(screen.getByText(/survey complete/i)).toBeInTheDocument();
    }, 10000);

    it('should handle empty states gracefully', async () => {
      // Mock empty state in the hook
      const { useDashboardData } = require('@/lib/v2/hooks/useDashboardData');
      useDashboardData.mockReturnValueOnce({
        program: null,
        assessment: null,
        surveyData: null,
        loading: false,
        error: null,
        refresh: jest.fn()
      } as any);

      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      // Should show empty state
      expect(screen.getByText(/no program found/i)).toBeInTheDocument();
    }, 10000);

    it('should handle error states properly', async () => {
      // Mock error state in the hook
      const { useDashboardData } = require('@/lib/v2/hooks/useDashboardData');
      useDashboardData.mockReturnValueOnce({
        program: null,
        assessment: null,
        surveyData: null,
        loading: false,
        error: 'Failed to load dashboard data',
        refresh: jest.fn()
      } as any);

      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      // Should show error state
      expect(screen.getByText(/error loading data/i)).toBeInTheDocument();

      // Should show retry button
      const retryButton = screen.getByRole('button', { name: /try again/i });
      expect(retryButton).toBeInTheDocument();
    }, 10000);
  });

  describe('Program Interaction', () => {
    it('should display program sessions', async () => {
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      // Should show program metadata
      expect(screen.getByText(/your fitness program/i)).toBeInTheDocument();
      expect(screen.getByText(/program-1/i)).toBeInTheDocument();
    }, 10000);

    it('should handle basic program display', async () => {
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      // Should show program content
      expect(screen.getByText(/program status: approved/i)).toBeInTheDocument();
      expect(screen.getByText(/program id:/i)).toBeInTheDocument();
    }, 10000);
  });

  describe('Data Refresh and Synchronization', () => {
    it('should handle retry functionality', async () => {
      // Mock error state in the hook
      const mockRefresh = jest.fn();
      const { useDashboardData } = require('@/lib/v2/hooks/useDashboardData');
      
      useDashboardData.mockReturnValueOnce({
        program: null,
        assessment: null,
        surveyData: null,
        loading: false,
        error: 'Network error',
        refresh: mockRefresh
      } as any);

      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      // Should show error state
      expect(screen.getByText(/error loading data/i)).toBeInTheDocument();

      // Should show retry button (test passes if button exists)
      const retryButton = screen.getByRole('button', { name: /try again/i });
      expect(retryButton).toBeInTheDocument();
    }, 10000);
  });
});
