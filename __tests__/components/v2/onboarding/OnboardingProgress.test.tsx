import React from 'react';
import { render, screen } from '@testing-library/react';
import OnboardingProgress from '@/components/v2/onboarding/OnboardingProgress';

describe('OnboardingProgress', () => {
  it('renders all 4 steps with correct labels', () => {
    render(<OnboardingProgress currentStep={1} />);
    
    expect(screen.getByText('Survey')).toBeInTheDocument();
    expect(screen.getByText('Assessment')).toBeInTheDocument();
    expect(screen.getByText('Program')).toBeInTheDocument();
    expect(screen.getByText('Schedule')).toBeInTheDocument();
  });

  it('highlights the current step', () => {
    render(<OnboardingProgress currentStep={2} />);
    
    const currentStepElement = screen.getByTestId('current-step');
    expect(currentStepElement).toHaveClass('bg-gradient-to-r');
  });

  it('shows completed steps with checkmarks', () => {
    render(<OnboardingProgress currentStep={3} />);
    
    // Steps 1 and 2 should be completed
    const completedSteps = screen.getAllByTestId('completed-step');
    expect(completedSteps).toHaveLength(2);
  });

  it('shows upcoming steps as inactive', () => {
    render(<OnboardingProgress currentStep={2} />);
    
    // Steps 3 and 4 should be inactive
    const inactiveSteps = screen.getAllByTestId('inactive-step');
    expect(inactiveSteps).toHaveLength(2);
  });

  it('handles edge case of step 1', () => {
    render(<OnboardingProgress currentStep={1} />);
    
    const currentStepElement = screen.getByTestId('current-step');
    expect(currentStepElement).toHaveClass('bg-gradient-to-r');
    
    // No completed steps
    expect(screen.queryByTestId('completed-step')).not.toBeInTheDocument();
  });

  it('handles edge case of final step', () => {
    render(<OnboardingProgress currentStep={4} />);
    
    const currentStepElement = screen.getByTestId('current-step');
    expect(currentStepElement).toHaveClass('bg-gradient-to-r');
    
    // Steps 1, 2, and 3 should be completed
    const completedSteps = screen.getAllByTestId('completed-step');
    expect(completedSteps).toHaveLength(3);
  });
});
