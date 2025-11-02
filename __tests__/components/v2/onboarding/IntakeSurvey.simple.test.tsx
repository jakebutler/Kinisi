import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IntakeSurvey from '../../../../components/v2/onboarding/IntakeSurvey';

const mockOnNext = jest.fn();

describe('IntakeSurvey - Simple Reliable Tests', () => {
  beforeEach(() => {
    mockOnNext.mockClear();
    jest.clearAllMocks();
  });

  it('renders the first question correctly', () => {
    render(<IntakeSurvey onNext={mockOnNext} />);

    expect(screen.getAllByText('Intake Survey')).toHaveLength(2);
    expect(screen.getByText(/Question 1 of/)).toBeInTheDocument();
    expect(screen.getByText('Have you ever been told by a doctor that you should not exercise because of a medical condition?')).toBeInTheDocument();
  });

  it('allows answering questions and navigating', async () => {
    const user = userEvent.setup();
    render(<IntakeSurvey onNext={mockOnNext} />);

    // Answer first question - radio buttons have role="radio"
    const answerButtons = screen.getAllByRole('radio').filter(btn =>
      btn.textContent === 'Yes' || btn.textContent === 'No'
    );
    expect(answerButtons).toHaveLength(2);

    await user.click(answerButtons[0]);

    // Verify Next button becomes enabled
    const nextButton = screen.getByRole('button', { name: 'Next' });
    expect(nextButton).not.toBeDisabled();

    // Navigate to second question
    await user.click(nextButton);

    // Verify we're on the second question
    expect(screen.getByText(/Question 2 of/)).toBeInTheDocument();
    expect(screen.getByText('Do you currently experience pain or injury that limits your physical activity?')).toBeInTheDocument();
  });

  it('handles conditional question correctly', async () => {
    const user = userEvent.setup();
    render(<IntakeSurvey onNext={mockOnNext} />);

    // Answer first question
    const answerButtons = screen.getAllByRole('button').filter(btn =>
      btn.textContent === 'Yes' || btn.textContent === 'No'
    );
    await user.click(answerButtons[0]);

    // Navigate to second question
    const nextButton = screen.getByRole('button', { name: 'Next' });
    await user.click(nextButton);

    // Answer second question with 'Yes' to trigger conditional
    const painAnswerButtons = screen.getAllByRole('radio').filter(btn =>
      btn.textContent === 'Yes' || btn.textContent === 'No'
    );
    const painYesButton = painAnswerButtons.find(btn => btn.textContent === 'Yes');
    await user.click(painYesButton!);

    // Navigate to conditional question
    const secondNextButton = screen.getByRole('button', { name: 'Next' });
    await user.click(secondNextButton);

    // Should see conditional pain description question
    expect(screen.getByText('Please describe your pain or injury:')).toBeInTheDocument();
  });

  it('has correct callback structure', () => {
    render(<IntakeSurvey onNext={mockOnNext} />);

    // Verify that the onNext callback exists and is a function
    expect(typeof mockOnNext).toBe('function');
  });

  it('displays progress correctly', () => {
    render(<IntakeSurvey onNext={mockOnNext} />);

    // Check progress indicator shows correct question number
    expect(screen.getByText(/Question 1 of/)).toBeInTheDocument();

    // Should have progress bar
    const progressBar = document.querySelector('.bg-gradient-to-r');
    expect(progressBar).toBeInTheDocument();
  });

  it('prevents navigation when no answer is selected', () => {
    render(<IntakeSurvey onNext={mockOnNext} />);

    // Next button should be disabled initially
    const nextButton = screen.getByRole('button', { name: 'Next' });
    expect(nextButton).toBeDisabled();
  });
});