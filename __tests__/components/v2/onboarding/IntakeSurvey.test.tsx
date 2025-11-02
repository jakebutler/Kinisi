import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IntakeSurvey from '../../../../components/v2/onboarding/IntakeSurvey';
import { SurveyResponseData } from '../../../types/survey';

// Jest automatically mocks supabaseClient based on the jest.config.cjs module name mapper

const mockOnNext = jest.fn();

describe('IntakeSurvey', () => {
  beforeEach(() => {
    mockOnNext.mockClear();
    jest.clearAllMocks();
  });

  it('renders the first question', () => {
    render(<IntakeSurvey onNext={mockOnNext} />);

    expect(screen.getByText('Have you ever been told by a doctor that you should not exercise because of a medical condition?')).toBeInTheDocument();
    expect(screen.getByText('Question 1 of 15')).toBeInTheDocument();
  });

  it('shows progress bar with correct initial progress', () => {
    render(<IntakeSurvey onNext={mockOnNext} />);

    // Check progress indicator shows 1 of 15
    expect(screen.getByText('Question 1 of 15')).toBeInTheDocument();

    // Check progress bar width (~6.67% for first question: 1/15 * 100)
    const progressBarFill = document.querySelector('.bg-gradient-to-r');
    expect(progressBarFill).toHaveStyle('width: 6.666666666666667%');
  });

  it('allows selecting medical clearance answer', async () => {
    const user = userEvent.setup();
    render(<IntakeSurvey onNext={mockOnNext} />);

    const noOption = screen.getByText('No');
    const yesOption = screen.getByText('Yes');

    await user.click(yesOption);

    // Should be able to change selection
    await user.click(noOption);
  });

  it('enables Continue button when question is answered', async () => {
    const user = userEvent.setup();
    render(<IntakeSurvey onNext={mockOnNext} />);

    const continueButton = screen.getByText('Next');
    expect(continueButton).toBeDisabled();

    const noOption = screen.getByText('No');
    await user.click(noOption);

    expect(continueButton).not.toBeDisabled();
  });

  it('navigates to next question when Continue is clicked', async () => {
    const user = userEvent.setup();
    render(<IntakeSurvey onNext={mockOnNext} />);

    // Answer first question
    const noOption = screen.getByText('No');
    await user.click(noOption);

    const continueButton = screen.getByText('Next');
    await user.click(continueButton);

    expect(screen.getByText('Question 2 of 15')).toBeInTheDocument();
    expect(screen.getByText('Do you currently experience pain or injury that limits your physical activity?')).toBeInTheDocument();
  });

  it('shows Back button on questions after the first', async () => {
    const user = userEvent.setup();
    render(<IntakeSurvey onNext={mockOnNext} />);

    // Q1: Answer medical clearance question correctly
    await user.click(screen.getByText('No'));
    await user.click(screen.getByText('Next'));

    // Should now be on Q2 (pain question) and have an enabled Back button
    expect(screen.getByText('Do you currently experience pain or injury that limits your physical activity?')).toBeInTheDocument();

    const backButton = screen.getByText('Previous');
    expect(backButton).not.toBeDisabled();
  });

  it('navigates back to previous question when Back is clicked', async () => {
    const user = userEvent.setup();
    render(<IntakeSurvey onNext={mockOnNext} />);

    // Navigate to second question - first answer the medical clearance question
    const noOption = screen.getByText('No');
    await user.click(noOption);
    await user.click(screen.getByText('Next'));

    // Now we should be on the pain question
    expect(screen.getByText('Do you currently experience pain or injury that limits your physical activity?')).toBeInTheDocument();

    // Go back
    await user.click(screen.getByText('Previous'));

    // Should be back to the first question
    expect(screen.getByText('Have you ever been told by a doctor that you should not exercise because of a medical condition?')).toBeInTheDocument();
  });

  it('handles conditional pain description', async () => {
    const user = userEvent.setup();
    render(<IntakeSurvey onNext={mockOnNext} />);

    // Q1: Medical clearance - answer No
    await user.click(screen.getByText('No'));
    await user.click(screen.getByText('Next'));

    // Q2: Current pain - should show Yes/No options
    expect(screen.getByText('Do you currently experience pain or injury that limits your physical activity?')).toBeInTheDocument();

    // Select Yes - should show conditional textarea in the next question
    await user.click(screen.getByText('Yes'));

    // The conditional question should appear as the next question
    await user.click(screen.getByText('Next'));

    // Check for the conditional pain description question
    expect(screen.getByText('Please describe your pain or injury:')).toBeInTheDocument();
  });

  it('calls onNext when survey is completed', async () => {
    const user = userEvent.setup();
    render(<IntakeSurvey onNext={mockOnNext} />);

    // Complete the survey systematically by answering all required questions
    let maxQuestions = 20; // Prevent infinite loop
    let questionsAnswered = 0;

    // Navigate through the survey until we can submit it
    while (questionsAnswered < maxQuestions) {
      try {
        // Wait for the current question to load
        await waitFor(() => {
          expect(screen.getByRole('button', { name: /Next|Submit Survey/ })).toBeInTheDocument();
        }, { timeout: 2000 });

        // Look for any answer buttons (excluding navigation buttons)
        const buttons = screen.getAllByRole('button');
        const answerButtons = buttons.filter(btn =>
          btn.textContent &&
          !btn.textContent.includes('Next') &&
          !btn.textContent.includes('Previous') &&
          !btn.textContent.includes('Submit Survey') &&
          !btn.textContent.includes('Complete') &&
          !btn.disabled
        );

        // If we find answer buttons, click the first valid one
        if (answerButtons.length > 0) {
          await user.click(answerButtons[0]);
        }

        // Look for the action button (Next or Submit Survey)
        const actionButton = screen.getByRole('button', { name: /Next|Submit Survey/ });

        // Check if this is the submit button (last question)
        if (actionButton.textContent?.includes('Submit Survey')) {
          // This is the final question - submit the survey
          expect(actionButton).not.toBeDisabled();
          await user.click(actionButton);
          break;
        } else if (!actionButton.disabled) {
          // This is a regular Next button - continue to next question
          await user.click(actionButton);
          questionsAnswered++;
        } else {
          // Next button is disabled, we might need to answer more questions
          // Try clicking any available answer option
          if (answerButtons.length > 0) {
            await user.click(answerButtons[0]);
            questionsAnswered++;
          } else {
            // No options available, break to prevent infinite loop
            break;
          }
        }

        // Brief pause to let the component update
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        // If we can't find elements, we might be at the end or an error state
        console.log('Survey navigation error:', error);
        break;
      }
    }

    // Final attempt to submit if we haven't yet
    try {
      const submitButton = screen.getByRole('button', { name: 'Submit Survey' });
      if (!submitButton.disabled) {
        await user.click(submitButton);
      }
    } catch (error) {
      // Submit button not found, that's okay - we might have already submitted
    }

    // Verify that onNext was called with the survey data
    await waitFor(() => {
      expect(mockOnNext).toHaveBeenCalledWith(
        expect.any(Object)
      );
    }, {
      timeout: 20000, // Increased timeout for complex survey interaction
      interval: 200   // Check more frequently
    });
  }, 15000); // 15 second timeout for the entire test
});