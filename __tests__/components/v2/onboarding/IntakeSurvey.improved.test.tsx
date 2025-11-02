import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IntakeSurvey from '../../../../components/v2/onboarding/IntakeSurvey';
import { SurveyResponseData } from '../../../types/survey';

const mockOnNext = jest.fn();

describe('IntakeSurvey - Improved React Testing', () => {
  beforeEach(() => {
    mockOnNext.mockClear();
    jest.clearAllMocks();
  });

  // Helper function to safely find and interact with radio buttons
  const findAndClickRadioOption = async (user: any, labelText: string) => {
    // Use more specific query strategy
    const radioOption = await screen.findByRole('radio', { name: labelText });
    await user.click(radioOption);
    return radioOption;
  };

  // Helper function to handle select dropdowns
  const handleSelectQuestion = async (user: any, optionText: string) => {
    const selectButton = await screen.findByRole('button', { name: /select/i });
    await user.click(selectButton);

    const option = await screen.findByRole('option', { name: optionText });
    await user.click(option);
  };

  // Helper function to handle number inputs
  const handleNumberQuestion = async (user: any, value: string) => {
    const numberInput = await screen.findByRole('spinbutton');
    await user.clear(numberInput);
    await user.type(numberInput, value);
  };

  // Helper function to handle navigation
  const clickNavigationButton = async (user: any, buttonText: 'Next' | 'Previous' | 'Submit Survey') => {
    const button = await screen.findByRole('button', { name: buttonText });
    expect(button).not.toBeDisabled();
    await user.click(button);
  };

  it('handles medical clearance question correctly', async () => {
    const user = userEvent.setup();
    render(<IntakeSurvey onNext={mockOnNext} />);

    // Verify initial state
    expect(screen.getByText('Question 1 of 15')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();

    // Answer medical clearance question
    await findAndClickRadioOption(user, 'No');

    // Verify button is enabled and navigate
    const nextButton = screen.getByRole('button', { name: 'Next' });
    expect(nextButton).not.toBeDisabled();
    await user.click(nextButton);

    // Verify navigation to next question
    expect(screen.getByText('Question 2 of 15')).toBeInTheDocument();
    expect(screen.getByText('Do you currently experience pain or injury that limits your physical activity?')).toBeInTheDocument();
  });

  it('handles conditional pain description question', async () => {
    const user = userEvent.setup();
    render(<IntakeSurvey onNext={mockOnNext} />);

    // Answer medical clearance
    await findAndClickRadioOption(user, 'No');
    await clickNavigationButton(user, 'Next');

    // Answer pain question with Yes to trigger conditional
    await findAndClickRadioOption(user, 'Yes');
    await clickNavigationButton(user, 'Next');

    // Should see conditional pain description question
    expect(screen.getByText('Please describe your pain or injury:')).toBeInTheDocument();
  });

  it('handles select questions properly', async () => {
    const user = userEvent.setup();
    render(<IntakeSurvey onNext={mockOnNext} />);

    // Navigate to activity frequency question (Q3)
    await findAndClickRadioOption(user, 'No'); // Q1
    await clickNavigationButton(user, 'Next');

    await findAndClickRadioOption(user, 'No'); // Q2 (avoid conditional)
    await clickNavigationButton(user, 'Next');

    // Should be at activity frequency question
    expect(screen.getByText('On average, how many days per week do you do 30+ minutes of moderate-to-vigorous physical activity?')).toBeInTheDocument();

    // Handle select question
    await handleSelectQuestion(user, '3-4');
    await clickNavigationButton(user, 'Next');

    // Should advance to next question
    expect(screen.getByText('Question 4 of 15')).toBeInTheDocument();
  });

  it('handles number input questions', async () => {
    const user = userEvent.setup();
    render(<IntakeSurvey onNext={mockOnNext} />);

    // Navigate to importance question (Q6)
    const quickAnswers = ['No', 'No', '3-4', 'Good', 'Yes'];
    for (const answer of quickAnswers) {
      if (['Yes', 'No'].includes(answer)) {
        await findAndClickRadioOption(user, answer);
      } else {
        await handleSelectQuestion(user, answer);
      }
      await clickNavigationButton(user, 'Next');
    }

    // Should be at importance question
    expect(screen.getByText('On a scale of 0–10, how important is it for you to become more physically active?')).toBeInTheDocument();

    await handleNumberQuestion(user, '8');
    await clickNavigationButton(user, 'Next');

    // Should advance to confidence question
    expect(screen.getByText('On a scale of 0–10, how confident are you in your ability to follow an exercise plan?')).toBeInTheDocument();
  });

  it('handles multiselect questions correctly', async () => {
    const user = userEvent.setup();
    render(<IntakeSurvey onNext={mockOnNext} />);

    // Navigate to activity preferences question (Q11)
    const answers = [
      'No', 'No', '3-4', 'Good', 'Yes', '8', '7', '7-8', 'No', 'Improve health'
    ];

    for (const answer of answers) {
      if (['Yes', 'No'].includes(answer)) {
        await findAndClickRadioOption(user, answer);
      } else if (['3-4', 'Good', '7-8', 'Improve health'].includes(answer)) {
        await handleSelectQuestion(user, answer);
      } else {
        await handleNumberQuestion(user, answer);
      }
      await clickNavigationButton(user, 'Next');
    }

    // Should be at multiselect question
    expect(screen.getByText('What types of physical activity do you enjoy or want to include in your routine? (Select all that apply)')).toBeInTheDocument();

    // Select multiple options
    await findAndClickRadioOption(user, 'Walking/hiking');
    await findAndClickRadioOption(user, 'Strength training');

    await clickNavigationButton(user, 'Next');

    // Should advance to next question
    expect(screen.getByText('What equipment or facilities do you have access to? (Select all that apply)')).toBeInTheDocument();
  });

  it('completes full survey with realistic data flow', async () => {
    const user = userEvent.setup();
    render(<IntakeSurvey onNext={mockOnNext} />);

    // Define realistic survey answers
    const surveyFlow = [
      { question: 'medicalClearance', type: 'radio', answer: 'No' },
      { question: 'currentPain', type: 'radio', answer: 'No' }, // Avoid conditional
      { question: 'activityFrequency', type: 'select', answer: '3-4' },
      { question: 'physicalFunction', type: 'select', answer: 'Good' },
      { question: 'intentToChange', type: 'radio', answer: 'Yes' },
      { question: 'importance', type: 'number', answer: '8' },
      { question: 'confidence', type: 'number', answer: '7' },
      { question: 'sleep', type: 'select', answer: '7-8' },
      { question: 'tobaccoUse', type: 'radio', answer: 'No' },
      { question: 'primaryGoal', type: 'select', answer: 'Improve health' }
    ];

    // Process each question based on type
    for (const { type, answer } of surveyFlow) {
      switch (type) {
        case 'radio':
          await findAndClickRadioOption(user, answer);
          break;
        case 'select':
          await handleSelectQuestion(user, answer);
          break;
        case 'number':
          await handleNumberQuestion(user, answer);
          break;
      }

      await clickNavigationButton(user, 'Next');
    }

    // Handle activity preferences (multiselect)
    await findAndClickRadioOption(user, 'Walking/hiking');
    await findAndClickRadioOption(user, 'Strength training');
    await clickNavigationButton(user, 'Next');

    // Handle equipment access (multiselect)
    await findAndClickRadioOption(user, 'Home workouts');
    await clickNavigationButton(user, 'Next');

    // Handle time commitment (group question)
    const daysInput = await screen.findByLabelText('Days per week');
    await user.clear(daysInput);
    await user.type(daysInput, '4');

    const minutesInput = await screen.findByLabelText('Minutes per session');
    await user.clear(minutesInput);
    await user.type(minutesInput, '30');

    await handleSelectQuestion(user, 'Morning');

    // Should show submit button on last question
    const submitButton = await screen.findByRole('button', { name: 'Submit Survey' });
    expect(submitButton).not.toBeDisabled();

    // Submit the survey
    await user.click(submitButton);

    // Verify callback was called
    await waitFor(() => {
      expect(mockOnNext).toHaveBeenCalledTimes(1);
      expect(mockOnNext).toHaveBeenCalledWith(
        expect.objectContaining({
          medicalClearance: 'No',
          currentPain: 'No',
          activityFrequency: '3-4',
          physicalFunction: 'Good',
          intentToChange: 'Yes',
          importance: 8,
          confidence: 7,
          sleep: '7-8',
          tobaccoUse: 'No',
          primaryGoal: 'Improve health',
          activityPreferences: expect.arrayContaining(['Walking/hiking', 'Strength training']),
          equipmentAccess: expect.arrayContaining(['Home workouts']),
          timeCommitment: expect.objectContaining({
            daysPerWeek: 4,
            minutesPerSession: 30,
            preferredTimeOfDay: 'Morning'
          })
        })
      );
    }, { timeout: 5000 });
  }, 30000); // 30 second timeout for full survey

  it('properly handles back navigation', async () => {
    const user = userEvent.setup();
    render(<IntakeSurvey onNext={mockOnNext} />);

    // Answer first question and navigate forward
    await findAndClickRadioOption(user, 'No');
    await clickNavigationButton(user, 'Next');

    // Should be on second question
    expect(screen.getByText('Question 2 of 15')).toBeInTheDocument();

    // Go back
    const backButton = screen.getByRole('button', { name: 'Previous' });
    await user.click(backButton);

    // Should be back to first question
    expect(screen.getByText('Question 1 of 15')).toBeInTheDocument();
    expect(screen.getByText('Have you ever been told by a doctor that you should not exercise because of a medical condition?')).toBeInTheDocument();
  });

  it('validates required questions properly', async () => {
    const user = userEvent.setup();
    render(<IntakeSurvey onNext={mockOnNext} />);

    // Next button should be disabled initially
    const nextButton = screen.getByRole('button', { name: 'Next' });
    expect(nextButton).toBeDisabled();

    // Answer the question
    await findAndClickRadioOption(user, 'Yes');

    // Next button should now be enabled
    expect(nextButton).not.toBeDisabled();
  });
});