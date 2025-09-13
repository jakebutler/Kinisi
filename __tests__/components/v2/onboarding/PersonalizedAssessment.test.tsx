import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PersonalizedAssessment from '@/components/v2/onboarding/PersonalizedAssessment';
import { Assessment } from '@/lib/v2/types';

const mockAssessment: Assessment = {
  id: 'test-assessment-id',
  userId: 'test-user-id',
  content: 'Based on your survey responses, here is your personalized fitness assessment...',
  approved: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockOnApprove = jest.fn();
const mockOnRequestUpdate = jest.fn();

describe('PersonalizedAssessment', () => {
  beforeEach(() => {
    mockOnApprove.mockClear();
    mockOnRequestUpdate.mockClear();
  });

  it('renders assessment content', () => {
    render(
      <PersonalizedAssessment
        assessment={mockAssessment}
        onApprove={mockOnApprove}
        onRequestUpdate={mockOnRequestUpdate}
        loading={false}
      />
    );
    
    expect(screen.getByText('Your Personalized Assessment')).toBeInTheDocument();
    expect(screen.getByText(mockAssessment.content)).toBeInTheDocument();
  });

  it('shows approve and request update buttons when not approved', () => {
    render(
      <PersonalizedAssessment
        assessment={mockAssessment}
        onApprove={mockOnApprove}
        onRequestUpdate={mockOnRequestUpdate}
        loading={false}
      />
    );
    
    expect(screen.getByText('Approve Assessment')).toBeInTheDocument();
    expect(screen.getByText('Request Updates')).toBeInTheDocument();
  });

  it('shows approved state when assessment is approved', () => {
    const approvedAssessment = { ...mockAssessment, approved: true };
    
    render(
      <PersonalizedAssessment
        assessment={approvedAssessment}
        onApprove={mockOnApprove}
        onRequestUpdate={mockOnRequestUpdate}
        loading={false}
      />
    );
    
    expect(screen.getByText('✓ Assessment Approved')).toBeInTheDocument();
    expect(screen.queryByText('Approve Assessment')).not.toBeInTheDocument();
    expect(screen.queryByText('Request Updates')).not.toBeInTheDocument();
  });

  it('calls onApprove when approve button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PersonalizedAssessment
        assessment={mockAssessment}
        onApprove={mockOnApprove}
        onRequestUpdate={mockOnRequestUpdate}
        loading={false}
      />
    );
    
    const approveButton = screen.getByText('Approve Assessment');
    await user.click(approveButton);
    
    expect(mockOnApprove).toHaveBeenCalledTimes(1);
  });

  it('shows request update form when Request Updates is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PersonalizedAssessment
        assessment={mockAssessment}
        onApprove={mockOnApprove}
        onRequestUpdate={mockOnRequestUpdate}
        loading={false}
      />
    );
    
    const requestUpdateButton = screen.getByText('Request Updates');
    await user.click(requestUpdateButton);
    
    expect(screen.getByText('What would you like to change about your assessment?')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Please describe what you\'d like to change...')).toBeInTheDocument();
  });

  it('calls onRequestUpdate with feedback when form is submitted', async () => {
    const user = userEvent.setup();
    render(
      <PersonalizedAssessment
        assessment={mockAssessment}
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
    await user.type(textarea, 'Please make the program more challenging');
    
    // Submit form
    const submitButton = screen.getByText('Submit Request');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnRequestUpdate).toHaveBeenCalledWith('Please make the program more challenging');
    });
  });

  it('cancels request update form when Cancel is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PersonalizedAssessment
        assessment={mockAssessment}
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
    expect(screen.queryByText('What would you like to change about your assessment?')).not.toBeInTheDocument();
    expect(screen.getByText('Approve Assessment')).toBeInTheDocument();
  });

  it('disables buttons when loading', () => {
    render(
      <PersonalizedAssessment
        assessment={mockAssessment}
        onApprove={mockOnApprove}
        onRequestUpdate={mockOnRequestUpdate}
        loading={true}
      />
    );
    
    const approveButton = screen.getByText('Approve Assessment');
    const requestUpdateButton = screen.getByText('Request Updates');
    
    expect(approveButton).toBeDisabled();
    expect(requestUpdateButton).toBeDisabled();
  });

  it('requires feedback text before allowing form submission', async () => {
    const user = userEvent.setup();
    render(
      <PersonalizedAssessment
        assessment={mockAssessment}
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
