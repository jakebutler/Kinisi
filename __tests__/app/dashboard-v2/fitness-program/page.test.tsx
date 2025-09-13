import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardPage from '@/app/dashboard-v2/fitness-program/page';
import { useUser } from '@/lib/v2/contexts/UserContext';
import { useUI } from '@/lib/v2/contexts/UIContext';
import { useDashboardData } from '@/lib/v2/hooks/useDashboardData';

// Mock dependencies
jest.mock('@/lib/v2/contexts/UserContext');
jest.mock('@/lib/v2/contexts/UIContext');
jest.mock('@/lib/v2/hooks/useDashboardData');
jest.mock('@/lib/v2/components/ProtectedRoute', () => {
  return function MockProtectedRoute({ children }: { children: React.ReactNode }) {
    return <div data-testid="protected-route">{children}</div>;
  };
});

const mockUseUser = useUser as jest.MockedFunction<typeof useUser>;
const mockUseUI = useUI as jest.MockedFunction<typeof useUI>;
const mockUseDashboardData = useDashboardData as jest.MockedFunction<typeof useDashboardData>;

describe('DashboardPage', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    username: 'testuser',
    status: 'active' as const
  };

  const mockProgram = {
    id: 'program-1',
    user_id: 'test-user-id',
    status: 'approved',
    program_json: [{ week: 1, sessions: [] }],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    last_scheduled_at: '2024-01-02T00:00:00Z'
  };

  const mockAssessment = {
    id: 'assessment-1',
    user_id: 'test-user-id',
    survey_response_id: 'survey-1',
    assessment: 'Test assessment content',
    approved: true,
    created_at: '2024-01-01T00:00:00Z'
  };

  const mockSurveyData = {
    id: 'survey-1',
    user_id: 'test-user-id',
    response_data: { primaryGoal: 'weight_loss' },
    created_at: '2024-01-01T00:00:00Z'
  };

  const mockAddNotification = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseUser.mockReturnValue({
      user: mockUser,
      userStatus: 'active',
      loading: false,
      setUser: jest.fn(),
      setUserStatus: jest.fn(),
      refreshUserStatus: jest.fn(),
      signOut: jest.fn()
    });

    mockUseUI.mockReturnValue({
      loading: false,
      error: null,
      notifications: [],
      setLoading: jest.fn(),
      setError: jest.fn(),
      addNotification: mockAddNotification,
      removeNotification: jest.fn(),
      clearNotifications: jest.fn()
    });

    mockUseDashboardData.mockReturnValue({
      program: mockProgram,
      assessment: mockAssessment,
      surveyData: mockSurveyData,
      loading: false,
      error: null,
      refreshData: jest.fn()
    });
  });

  it('renders welcome message with username', () => {
    render(<DashboardPage />);
    
    expect(screen.getByText('Welcome back, testuser!')).toBeInTheDocument();
  });

  it('renders welcome message with email when username not available', () => {
    mockUseUser.mockReturnValue({
      user: { ...mockUser, username: undefined, status: 'active' as const },
      userStatus: 'active',
      loading: false,
      setUser: jest.fn(),
      setUserStatus: jest.fn(),
      refreshUserStatus: jest.fn(),
      signOut: jest.fn()
    });

    render(<DashboardPage />);
    
    expect(screen.getByText('Welcome back, test!')).toBeInTheDocument();
  });

  it('renders navigation component', () => {
    render(<DashboardPage />);
    
    expect(screen.getByText('Fitness Program')).toBeInTheDocument();
    expect(screen.getByText('Assessment')).toBeInTheDocument();
    expect(screen.getByText('Survey')).toBeInTheDocument();
  });

  it('displays program tab content by default', () => {
    render(<DashboardPage />);
    
    expect(screen.getByText('Your Fitness Program')).toBeInTheDocument();
    expect(screen.getByText('Program Status: Approved ✅')).toBeInTheDocument();
    expect(screen.getByText('program-1')).toBeInTheDocument();
  });

  it('switches to assessment tab when clicked', () => {
    render(<DashboardPage />);
    
    const assessmentTab = screen.getByText('Assessment').closest('div');
    fireEvent.click(assessmentTab!);
    
    expect(screen.getByText('Your Assessment')).toBeInTheDocument();
    expect(screen.getByText('Assessment Status: Approved ✅')).toBeInTheDocument();
    expect(screen.getByText('Test assessment content')).toBeInTheDocument();
  });

  it('switches to survey tab when clicked', () => {
    render(<DashboardPage />);
    
    const surveyTab = screen.getByText('Survey').closest('div');
    fireEvent.click(surveyTab!);
    
    expect(screen.getByText('Your Survey Responses')).toBeInTheDocument();
    expect(screen.getByText('Survey Complete ✅')).toBeInTheDocument();
  });

  it('displays loading state when data is loading', () => {
    mockUseDashboardData.mockReturnValue({
      program: null,
      assessment: null,
      surveyData: null,
      loading: true,
      error: null,
      refreshData: jest.fn()
    });

    render(<DashboardPage />);
    
    expect(screen.getByText('Loading your data...')).toBeInTheDocument();
  });

  it('displays error state when there is an error', () => {
    mockUseDashboardData.mockReturnValue({
      program: null,
      assessment: null,
      surveyData: null,
      loading: false,
      error: 'Failed to load data',
      refreshData: jest.fn()
    });

    render(<DashboardPage />);
    
    expect(screen.getByText('Error Loading Data')).toBeInTheDocument();
    expect(screen.getByText('Failed to load data')).toBeInTheDocument();
  });

  it('displays empty state when no program data', () => {
    mockUseDashboardData.mockReturnValue({
      program: null,
      assessment: mockAssessment,
      surveyData: mockSurveyData,
      loading: false,
      error: null,
      refreshData: jest.fn()
    });

    render(<DashboardPage />);
    
    expect(screen.getByText('No Program Found')).toBeInTheDocument();
    expect(screen.getByText('Your fitness program will appear here once generated.')).toBeInTheDocument();
  });

  it('displays empty state when no assessment data', () => {
    mockUseDashboardData.mockReturnValue({
      program: mockProgram,
      assessment: null,
      surveyData: mockSurveyData,
      loading: false,
      error: null,
      refreshData: jest.fn()
    });

    render(<DashboardPage />);
    
    // Switch to assessment tab
    const assessmentTab = screen.getByText('Assessment').closest('div');
    fireEvent.click(assessmentTab!);
    
    expect(screen.getByText('No Assessment Found')).toBeInTheDocument();
    expect(screen.getByText('Your personalized assessment will appear here.')).toBeInTheDocument();
  });

  it('displays empty state when no survey data', () => {
    mockUseDashboardData.mockReturnValue({
      program: mockProgram,
      assessment: mockAssessment,
      surveyData: null,
      loading: false,
      error: null,
      refreshData: jest.fn()
    });

    render(<DashboardPage />);
    
    // Switch to survey tab
    const surveyTab = screen.getByText('Survey').closest('div');
    fireEvent.click(surveyTab!);
    
    expect(screen.getByText('No Survey Data Found')).toBeInTheDocument();
    expect(screen.getByText('Your survey responses will appear here.')).toBeInTheDocument();
  });

  it('displays formatted dates correctly', () => {
    render(<DashboardPage />);
    
    expect(screen.getByText('Created:')).toBeInTheDocument();
    expect(screen.getByText('Last Scheduled:')).toBeInTheDocument();
    
    // Check that dates are formatted (should contain numbers)
    const createdText = screen.getByText('Created:').parentElement;
    expect(createdText).toHaveTextContent('1/1/2024');
  });

  it('displays survey data as formatted JSON', () => {
    render(<DashboardPage />);
    
    // Switch to survey tab
    const surveyTab = screen.getByText('Survey').closest('div');
    fireEvent.click(surveyTab!);
    
    expect(screen.getByText('Survey Data:')).toBeInTheDocument();
    expect(screen.getByText(/"primaryGoal": "weight_loss"/)).toBeInTheDocument();
  });

  it('handles tab switching correctly', () => {
    render(<DashboardPage />);
    
    // Start with program tab
    expect(screen.getByText('Your Fitness Program')).toBeInTheDocument();
    
    // Switch to assessment
    const assessmentTab = screen.getByText('Assessment').closest('div');
    fireEvent.click(assessmentTab!);
    expect(screen.getByText('Your Assessment')).toBeInTheDocument();
    expect(screen.queryByText('Your Fitness Program')).not.toBeInTheDocument();
    
    // Switch to survey
    const surveyTab = screen.getByText('Survey').closest('div');
    fireEvent.click(surveyTab!);
    expect(screen.getByText('Your Survey Responses')).toBeInTheDocument();
    expect(screen.queryByText('Your Assessment')).not.toBeInTheDocument();
    
    // Switch back to program
    const programTab = screen.getByText('Fitness Program').closest('div');
    fireEvent.click(programTab!);
    expect(screen.getByText('Your Fitness Program')).toBeInTheDocument();
    expect(screen.queryByText('Your Survey Responses')).not.toBeInTheDocument();
  });

  it('is wrapped in ProtectedRoute component', () => {
    render(<DashboardPage />);
    
    expect(screen.getByTestId('protected-route')).toBeInTheDocument();
  });
});
