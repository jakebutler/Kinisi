import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExerciseProgram from '@/components/v2/onboarding/ExerciseProgram';
import { ExerciseProgram as ExerciseProgramType } from '@/lib/v2/types';

const mockProgram: ExerciseProgramType = {
  id: 'test-program-id',
  userId: 'test-user-id',
  approved: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  weeks: [
    {
      weekNumber: 1,
      goal: 'Build foundational strength',
      sessions: [
        {
          id: 'w1s1',
          name: 'Session 1',
          goal: 'Upper body focus',
          exercises: [
            {
              id: 'w1s1e1',
              name: 'Push-ups',
              sets: 3,
              reps: '8-10',
              targetMuscles: ['Chest', 'Shoulders'],
              secondaryMuscles: ['Triceps'],
              instructions: 'Start in plank position...'
            }
          ]
        }
      ]
    }
  ]
};

const mockOnApprove = jest.fn();
const mockOnRequestUpdate = jest.fn();

describe('ExerciseProgram', () => {
  beforeEach(() => {
    mockOnApprove.mockClear();
    mockOnRequestUpdate.mockClear();
  });

  it('renders program title correctly for draft program', () => {
    render(
      <ExerciseProgram
        program={mockProgram}
        onApprove={mockOnApprove}
        onRequestUpdate={mockOnRequestUpdate}
        loading={false}
      />
    );
    
    expect(screen.getByText('Your Exercise Program (Draft)')).toBeInTheDocument();
  });

  it('renders program title correctly for approved program', () => {
    const approvedProgram = { ...mockProgram, approved: true };
    
    render(
      <ExerciseProgram
        program={approvedProgram}
        onApprove={mockOnApprove}
        onRequestUpdate={mockOnRequestUpdate}
        loading={false}
      />
    );
    
    expect(screen.getByText('Your Exercise Program')).toBeInTheDocument();
  });

  it('displays week information', () => {
    render(
      <ExerciseProgram
        program={mockProgram}
        onApprove={mockOnApprove}
        onRequestUpdate={mockOnRequestUpdate}
        loading={false}
      />
    );
    
    expect(screen.getByText('Week 1')).toBeInTheDocument();
    expect(screen.getByText('Build foundational strength')).toBeInTheDocument();
  });

  it('expands session when clicked', async () => {
    const user = userEvent.setup();
    render(
      <ExerciseProgram
        program={mockProgram}
        onApprove={mockOnApprove}
        onRequestUpdate={mockOnRequestUpdate}
        loading={false}
      />
    );
    
    const sessionHeader = screen.getByText('Session 1');
    await user.click(sessionHeader);
    
    expect(screen.getByText('Push-ups')).toBeInTheDocument();
    expect(screen.getByText('3 sets × 8-10')).toBeInTheDocument();
  });

  it('expands exercise details when clicked', async () => {
    const user = userEvent.setup();
    render(
      <ExerciseProgram
        program={mockProgram}
        onApprove={mockOnApprove}
        onRequestUpdate={mockOnRequestUpdate}
        loading={false}
      />
    );
    
    // First expand the session
    const sessionHeader = screen.getByText('Session 1');
    await user.click(sessionHeader);
    
    // Then expand exercise details
    const detailsButton = screen.getByText('Full Details');
    await user.click(detailsButton);
    
    expect(screen.getByText('Target muscles:')).toBeInTheDocument();
    expect(screen.getByText('Chest, Shoulders')).toBeInTheDocument();
    expect(screen.getByText('Secondary muscles:')).toBeInTheDocument();
    expect(screen.getByText('Triceps')).toBeInTheDocument();
    expect(screen.getByText('Instructions:')).toBeInTheDocument();
    expect(screen.getByText('Start in plank position...')).toBeInTheDocument();
  });

  it('shows approve and request update buttons for draft program', () => {
    render(
      <ExerciseProgram
        program={mockProgram}
        onApprove={mockOnApprove}
        onRequestUpdate={mockOnRequestUpdate}
        loading={false}
      />
    );
    
    expect(screen.getByText('Approve Program')).toBeInTheDocument();
    expect(screen.getByText('Request Updates')).toBeInTheDocument();
  });

  it('shows approved state for approved program', () => {
    const approvedProgram = { ...mockProgram, approved: true };
    
    render(
      <ExerciseProgram
        program={approvedProgram}
        onApprove={mockOnApprove}
        onRequestUpdate={mockOnRequestUpdate}
        loading={false}
      />
    );
    
    expect(screen.getByText('✓ Program Approved')).toBeInTheDocument();
    expect(screen.queryByText('Approve Program')).not.toBeInTheDocument();
  });

  it('calls onApprove when approve button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ExerciseProgram
        program={mockProgram}
        onApprove={mockOnApprove}
        onRequestUpdate={mockOnRequestUpdate}
        loading={false}
      />
    );
    
    const approveButton = screen.getByText('Approve Program');
    await user.click(approveButton);
    
    expect(mockOnApprove).toHaveBeenCalledTimes(1);
  });

  it('shows request update form when Request Updates is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ExerciseProgram
        program={mockProgram}
        onApprove={mockOnApprove}
        onRequestUpdate={mockOnRequestUpdate}
        loading={false}
      />
    );
    
    const requestUpdateButton = screen.getByText('Request Updates');
    await user.click(requestUpdateButton);
    
    expect(screen.getByText('What would you like to change about your program?')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Please describe what you\'d like to change...')).toBeInTheDocument();
  });

  it('calls onRequestUpdate with feedback when form is submitted', async () => {
    const user = userEvent.setup();
    render(
      <ExerciseProgram
        program={mockProgram}
        onApprove={mockOnApprove}
        onRequestUpdate={mockOnRequestUpdate}
        loading={false}
      />
    );
    
    // Open request update form
    const requestUpdateButton = screen.getByText('Request Updates');
    await user.click(requestUpdateButton);
    
    // Fill in feedback
    const textarea = screen.getByPlaceholderText('Please describe what you\'d like to change...');
    await user.type(textarea, 'Please add more cardio exercises');
    
    // Submit form
    const submitButton = screen.getByText('Submit Request');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnRequestUpdate).toHaveBeenCalledWith('Please add more cardio exercises');
    });
  });

  it('cancels request update form when Cancel is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ExerciseProgram
        program={mockProgram}
        onApprove={mockOnApprove}
        onRequestUpdate={mockOnRequestUpdate}
        loading={false}
      />
    );
    
    // Open request update form
    const requestUpdateButton = screen.getByText('Request Updates');
    await user.click(requestUpdateButton);
    
    // Cancel form
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);
    
    // Form should be hidden
    expect(screen.queryByText('What would you like to change about your program?')).not.toBeInTheDocument();
    expect(screen.getByText('Approve Program')).toBeInTheDocument();
  });

  it('disables buttons when loading', () => {
    render(
      <ExerciseProgram
        program={mockProgram}
        onApprove={mockOnApprove}
        onRequestUpdate={mockOnRequestUpdate}
        loading={true}
      />
    );
    
    const approveButton = screen.getByText('Approve Program');
    const requestUpdateButton = screen.getByText('Request Updates');
    
    expect(approveButton).toBeDisabled();
    expect(requestUpdateButton).toBeDisabled();
  });

  it('requires feedback text before allowing form submission', async () => {
    const user = userEvent.setup();
    render(
      <ExerciseProgram
        program={mockProgram}
        onApprove={mockOnApprove}
        onRequestUpdate={mockOnRequestUpdate}
        loading={false}
      />
    );
    
    // Open request update form
    const requestUpdateButton = screen.getByText('Request Updates');
    await user.click(requestUpdateButton);
    
    // Submit button should be disabled initially
    const submitButton = screen.getByText('Submit Request');
    expect(submitButton).toBeDisabled();
    
    // Add some text
    const textarea = screen.getByPlaceholderText('Please describe what you\'d like to change...');
    await user.type(textarea, 'Some feedback');
    
    // Submit button should now be enabled
    expect(submitButton).not.toBeDisabled();
  });
});
