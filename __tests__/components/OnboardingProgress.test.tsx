import React from 'react';
import { render, screen } from '@testing-library/react';
import OnboardingProgress from '@/components/dashboard/OnboardingProgress';

describe('OnboardingProgress minimal UI', () => {
  it('marks step 1 as current when currentStep=1', () => {
    render(<OnboardingProgress currentStep={1} />);
    expect(screen.getByLabelText('Step 1 current')).toBeInTheDocument();
    expect(screen.getByLabelText('Step 2')).toBeInTheDocument();
    expect(screen.getByLabelText('Step 3')).toBeInTheDocument();
    expect(screen.getByLabelText('Step 4')).toBeInTheDocument();
  });

  it('marks step 1-2 completed and step 3 current when currentStep=3', () => {
    render(<OnboardingProgress currentStep={3} />);
    expect(screen.getByLabelText('Step 1 completed')).toBeInTheDocument();
    expect(screen.getByLabelText('Step 2 completed')).toBeInTheDocument();
    expect(screen.getByLabelText('Step 3 current')).toBeInTheDocument();
    expect(screen.getByLabelText('Step 4')).toBeInTheDocument();
  });
});
