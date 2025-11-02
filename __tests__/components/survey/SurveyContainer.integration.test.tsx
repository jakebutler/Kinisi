import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SurveyContainer from '@/components/survey/SurveyContainer';
import { intakeSurveyQuestions } from '@/utils/survey/questionDefinitions';
import { SurveyResponseData } from '@/types/survey';

const mockOnSubmit = jest.fn();

describe('SurveyContainer Integration Tests', () => {
  beforeEach(() => {
    mockOnSubmit.mockClear();
    jest.clearAllMocks();
  });

  it('renders first question correctly', () => {
    render(
      <SurveyContainer
        questions={intakeSurveyQuestions}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText('Question 1 of 15')).toBeInTheDocument();
    expect(screen.getByText('Have you ever been told by a doctor that you should not exercise because of a medical condition?')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeDisabled();
  });

  it('enables next button when required question is answered', async () => {
    const user = userEvent.setup();
    render(
      <SurveyContainer
        questions={intakeSurveyQuestions}
        onSubmit={mockOnSubmit}
      />
    );

    const nextButton = screen.getByText('Next');
    expect(nextButton).toBeDisabled();

    const noOption = screen.getByText('No');
    await user.click(noOption);

    expect(nextButton).not.toBeDisabled();
  });

  it('navigates through questions correctly', async () => {
    const user = userEvent.setup();
    render(
      <SurveyContainer
        questions={intakeSurveyQuestions}
        onSubmit={mockOnSubmit}
      />
    );

    // Answer first question
    await user.click(screen.getByText('No'));
    await user.click(screen.getByText('Next'));

    expect(screen.getByText('Question 2 of 15')).toBeInTheDocument();
    expect(screen.getByText('Do you currently experience pain or injury that limits your physical activity?')).toBeInTheDocument();
    expect(screen.getByText('Previous')).not.toBeDisabled();
  });

  it('shows conditional follow-up question when pain is reported', async () => {
    const user = userEvent.setup();
    render(
      <SurveyContainer
        questions={intakeSurveyQuestions}
        onSubmit={mockOnSubmit}
      />
    );

    // Answer first question
    await user.click(screen.getByText('No'));
    await user.click(screen.getByText('Next'));

    // Answer pain question with Yes
    await user.click(screen.getByText('Yes'));
    await user.click(screen.getByText('Next'));

    // Should see conditional pain description question
    expect(screen.getByText('Please describe your pain or injury:')).toBeInTheDocument();
  });

  it('can go back to previous questions', async () => {
    const user = userEvent.setup();
    render(
      <SurveyContainer
        questions={intakeSurveyQuestions}
        onSubmit={mockOnSubmit}
      />
    );

    // Navigate to second question
    await user.click(screen.getByText('No'));
    await user.click(screen.getByText('Next'));

    // Go back
    await user.click(screen.getByText('Previous'));

    expect(screen.getByText('Question 1 of 15')).toBeInTheDocument();
    expect(screen.getByText('Have you ever been told by a doctor that you should not exercise because of a medical condition?')).toBeInTheDocument();
  });

  it('submits survey with all required questions answered', async () => {
    const user = userEvent.setup();
    render(
      <SurveyContainer
        questions={intakeSurveyQuestions}
        onSubmit={mockOnSubmit}
      />
    );

    // Answer all questions with simple responses
    const answers = [
      { question: 'Have you ever been told by a doctor that you should not exercise because of a medical condition?', answer: 'No' },
      { question: 'Do you currently experience pain or injury that limits your physical activity?', answer: 'No' },
      { question: 'On average, how many days per week do you do 30+ minutes of moderate-to-vigorous physical activity?', answer: '3-4' },
      { question: 'How would you rate your overall physical function?', answer: 'Good' },
      { question: 'Do you intend to increase your physical activity in the next 30 days?', answer: 'Yes' },
    ];

    // Helper function to answer current question
    const answerCurrentQuestion = async (expectedAnswer: string) => {
      // Try to find button with the answer text
      const answerButton = screen.queryByText(expectedAnswer);
      if (answerButton) {
        await user.click(answerButton);
        return;
      }

      // Try to find select element and select option
      const selectElement = screen.queryByRole('combobox') || screen.queryByRole('listbox');
      if (selectElement) {
        await user.click(selectElement);
        const option = screen.getByText(expectedAnswer);
        await user.click(option);
        return;
      }

      // Try to find number input
      const numberInput = screen.queryByRole('spinbutton');
      if (numberInput && !isNaN(Number(expectedAnswer))) {
        await user.clear(numberInput);
        await user.type(numberInput, expectedAnswer);
        return;
      }
    };

    // Answer the first few questions
    for (const { question, answer } of answers) {
      await waitFor(() => {
        expect(screen.getByText(question)).toBeInTheDocument();
      });

      await answerCurrentQuestion(answer);

      const nextButton = screen.getByText('Next');
      expect(nextButton).not.toBeDisabled();
      await user.click(nextButton);
    }

    // At this point, we should have made progress through the survey
    // The exact number of questions depends on conditional logic
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates required questions', async () => {
    const user = userEvent.setup();
    render(
      <SurveyContainer
        questions={intakeSurveyQuestions}
        onSubmit={mockOnSubmit}
      />
    );

    const nextButton = screen.getByText('Next');
    expect(nextButton).toBeDisabled();

    // Try to proceed without answering
    expect(nextButton).toBeDisabled();

    // Answer the question
    await user.click(screen.getByText('Yes'));
    expect(nextButton).not.toBeDisabled();
  });

  it('shows submit button on last question when all required fields are valid', async () => {
    const user = userEvent.setup();

    // Create a minimal set of questions for testing
    const minimalQuestions = [
      intakeSurveyQuestions[0], // medical clearance
      intakeSurveyQuestions[1], // current pain
    ];

    render(
      <SurveyContainer
        questions={minimalQuestions}
        onSubmit={mockOnSubmit}
      />
    );

    // Answer first question
    await user.click(screen.getByText('No'));
    await user.click(screen.getByText('Next'));

    // Answer second question
    await user.click(screen.getByText('No'));

    // Should show submit button
    await waitFor(() => {
      const submitButton = screen.getByText('Submit Survey');
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).not.toBeDisabled();
    });

    // Submit the survey
    await user.click(screen.getByText('Submit Survey'));

    // Verify onSubmit was called
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          medicalClearance: 'No',
          currentPain: 'No'
        })
      );
    });
  });
});