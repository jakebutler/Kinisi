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

    // Complete the survey with realistic answers
    const surveyAnswers = {
      medicalClearance: 'No',
      currentPain: 'No', // This avoids the conditional pain description
      activityFrequency: '3-4',
      physicalFunction: 'Good',
      intentToChange: 'Yes',
      importance: 8,
      confidence: 7,
      sleep: '7-8',
      tobaccoUse: 'No',
      primaryGoal: 'Improve health',
      activityPreferences: ['Walking/hiking', 'Strength training'],
      equipmentAccess: ['Dumbbells or resistance bands', 'Home workouts'],
      timeCommitment: {
        daysPerWeek: 4,
        minutesPerSession: 30,
        preferredTimeOfDay: 'Morning'
      }
    };

    // Helper function to answer current question
    const answerCurrentQuestion = async () => {
      // Get current question title
      const questionTitle = screen.queryByText(/Question \d+ of \d+/);
      expect(questionTitle).toBeInTheDocument();

      // Wait a bit for the question to render
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
      }, { timeout: 2000 });

      const buttons = screen.getAllByRole('button');

      // Filter for answer buttons (excluding navigation buttons)
      const answerButtons = buttons.filter(btn => {
        const text = btn.textContent;
        return text &&
               !text.includes('Next') &&
               !text.includes('Previous') &&
               !text.includes('Submit Survey') &&
               !text.includes('Complete') &&
               !btn.disabled;
      });

      // Find the action button (Next or Submit)
      const actionButton = buttons.find(btn =>
        btn.textContent?.includes('Next') || btn.textContent?.includes('Submit Survey')
      );

      return { answerButtons, actionButton };
    };

    // Q1: Medical clearance
    let { answerButtons, actionButton } = await answerCurrentQuestion();
    const medicalClearanceBtn = answerButtons.find(btn => btn.textContent === surveyAnswers.medicalClearance);
    expect(medicalClearanceBtn).toBeInTheDocument();
    await user.click(medicalClearanceBtn!);
    expect(actionButton).not.toBeDisabled();
    await user.click(actionButton!);

    // Q2: Current pain (answer No to avoid conditional question)
    await waitFor(() => {
      expect(screen.getByText('Do you currently experience pain or injury that limits your physical activity?')).toBeInTheDocument();
    });
    ({ answerButtons, actionButton } = await answerCurrentQuestion());
    const painBtn = answerButtons.find(btn => btn.textContent === surveyAnswers.currentPain);
    expect(painBtn).toBeInTheDocument();
    await user.click(painBtn!);
    await user.click(actionButton!);

    // Q3: Activity frequency
    await waitFor(() => {
      expect(screen.getByText('On average, how many days per week do you do 30+ minutes of moderate-to-vigorous physical activity?')).toBeInTheDocument();
    });

    // For select questions, we need to click the select and then the option
    const selectElement = screen.getByRole('combobox') || screen.getByRole('listbox');
    await user.click(selectElement);
    const frequencyOption = screen.getByText(surveyAnswers.activityFrequency);
    await user.click(frequencyOption);
    await user.click(actionButton!);

    // Q4: Physical function
    await waitFor(() => {
      expect(screen.getByText('How would you rate your overall physical function?')).toBeInTheDocument();
    });
    const functionSelect = screen.getByRole('combobox') || screen.getByRole('listbox');
    await user.click(functionSelect);
    const functionOption = screen.getByText(surveyAnswers.physicalFunction);
    await user.click(functionOption);
    await user.click(actionButton!);

    // Q5: Intent to change
    await waitFor(() => {
      expect(screen.getByText('Do you intend to increase your physical activity in the next 30 days?')).toBeInTheDocument();
    });
    ({ answerButtons, actionButton } = await answerCurrentQuestion());
    const intentBtn = answerButtons.find(btn => btn.textContent === surveyAnswers.intentToChange);
    expect(intentBtn).toBeInTheDocument();
    await user.click(intentBtn!);
    await user.click(actionButton!);

    // Q6: Importance (number input)
    await waitFor(() => {
      expect(screen.getByText('On a scale of 0–10, how important is it for you to become more physically active?')).toBeInTheDocument();
    });
    const importanceInput = screen.getByRole('spinbutton');
    await user.clear(importanceInput);
    await user.type(importanceInput, surveyAnswers.importance.toString());
    await user.click(actionButton!);

    // Q7: Confidence (number input)
    await waitFor(() => {
      expect(screen.getByText('On a scale of 0–10, how confident are you in your ability to follow an exercise plan?')).toBeInTheDocument();
    });
    const confidenceInput = screen.getByRole('spinbutton');
    await user.clear(confidenceInput);
    await user.type(confidenceInput, surveyAnswers.confidence.toString());
    await user.click(actionButton!);

    // Q8: Sleep
    await waitFor(() => {
      expect(screen.getByText('How many hours of sleep do you usually get per night?')).toBeInTheDocument();
    });
    const sleepSelect = screen.getByRole('combobox') || screen.getByRole('listbox');
    await user.click(sleepSelect);
    const sleepOption = screen.getByText(surveyAnswers.sleep);
    await user.click(sleepOption);
    await user.click(actionButton!);

    // Q9: Tobacco use
    await waitFor(() => {
      expect(screen.getByText('Do you currently smoke or use tobacco?')).toBeInTheDocument();
    });
    ({ answerButtons, actionButton } = await answerCurrentQuestion());
    const tobaccoBtn = answerButtons.find(btn => btn.textContent === surveyAnswers.tobaccoUse);
    expect(tobaccoBtn).toBeInTheDocument();
    await user.click(tobaccoBtn!);
    await user.click(actionButton!);

    // Q10: Primary goal
    await waitFor(() => {
      expect(screen.getByText('What is your top goal for being physically active?')).toBeInTheDocument();
    });
    const goalSelect = screen.getByRole('combobox') || screen.getByRole('listbox');
    await user.click(goalSelect);
    const goalOption = screen.getByText(surveyAnswers.primaryGoal);
    await user.click(goalOption);
    await user.click(actionButton!);

    // Q11: Activity preferences (multiselect)
    await waitFor(() => {
      expect(screen.getByText('What types of physical activity do you enjoy or want to include in your routine? (Select all that apply)')).toBeInTheDocument();
    });
    // For multiselect, click multiple options
    for (const preference of surveyAnswers.activityPreferences) {
      const prefOption = screen.getByText(preference);
      await user.click(prefOption);
    }
    await user.click(actionButton!);

    // Q12: Equipment access (multiselect)
    await waitFor(() => {
      expect(screen.getByText('What equipment or facilities do you have access to? (Select all that apply)')).toBeInTheDocument();
    });
    // For multiselect, click multiple options
    for (const equipment of surveyAnswers.equipmentAccess) {
      const equipOption = screen.getByText(equipment);
      await user.click(equipOption);
    }
    await user.click(actionButton!);

    // Q13: Time commitment (group question)
    await waitFor(() => {
      expect(screen.getByText('How much time can you realistically commit to physical activity each week?')).toBeInTheDocument();
    });

    // Fill in group question fields
    const daysInput = screen.getByLabelText('Days per week');
    await user.clear(daysInput);
    await user.type(daysInput, surveyAnswers.timeCommitment.daysPerWeek.toString());

    const minutesInput = screen.getByLabelText('Minutes per session');
    await user.clear(minutesInput);
    await user.type(minutesInput, surveyAnswers.timeCommitment.minutesPerSession.toString());

    const timeSelect = screen.getByLabelText('Preferred time of day');
    await user.click(timeSelect);
    const timeOption = screen.getByText(surveyAnswers.timeCommitment.preferredTimeOfDay);
    await user.click(timeOption);

    // This should be the last question, so we should see Submit Survey
    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: 'Submit Survey' });
      expect(submitButton).not.toBeDisabled();
    }, { timeout: 5000 });

    const submitButton = screen.getByRole('button', { name: 'Submit Survey' });
    await user.click(submitButton);

    // Verify that onNext was called with the survey data
    await waitFor(() => {
      expect(mockOnNext).toHaveBeenCalledWith(
        expect.objectContaining({
          medicalClearance: surveyAnswers.medicalClearance,
          currentPain: surveyAnswers.currentPain,
          activityFrequency: surveyAnswers.activityFrequency,
          physicalFunction: surveyAnswers.physicalFunction,
          intentToChange: surveyAnswers.intentToChange,
          importance: surveyAnswers.importance,
          confidence: surveyAnswers.confidence,
          sleep: surveyAnswers.sleep,
          tobaccoUse: surveyAnswers.tobaccoUse,
          primaryGoal: surveyAnswers.primaryGoal,
          activityPreferences: expect.arrayContaining(surveyAnswers.activityPreferences),
          equipmentAccess: expect.arrayContaining(surveyAnswers.equipmentAccess),
          timeCommitment: expect.objectContaining(surveyAnswers.timeCommitment)
        })
      );
    }, {
      timeout: 10000,
      interval: 200
    });
  }, 20000); // 20 second timeout for comprehensive test

  it('calls onNext when survey is completed - minimal test', async () => {
    const user = userEvent.setup();
    render(<IntakeSurvey onNext={mockOnNext} />);

    // Simple answers to complete the survey quickly
    const simpleAnswers = [
      'No',  // medicalClearance
      'No',  // currentPain (avoid conditional)
      '3-4', // activityFrequency
      'Good', // physicalFunction
      'Yes', // intentToChange
      '5',   // importance
      '5',   // confidence
      '7-8', // sleep
      'No',  // tobaccoUse
      'Improve health', // primaryGoal
    ];

    // Answer first 10 questions with simple selections
    for (let i = 0; i < 10; i++) {
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
      }, { timeout: 3000 });

      const buttons = screen.getAllByRole('button');
      const actionButton = buttons.find(btn =>
        btn.textContent?.includes('Next') || btn.textContent?.includes('Submit Survey')
      );

      // Try to find and click an answer option
      const answerButtons = buttons.filter(btn => {
        const text = btn.textContent;
        return text &&
               !text.includes('Next') &&
               !text.includes('Previous') &&
               !text.includes('Submit Survey') &&
               !text.includes('Complete') &&
               !btn.disabled;
      });

      if (answerButtons.length > 0) {
        // For radio/select questions, click the first available option
        await user.click(answerButtons[0]);
      } else {
        // For number inputs, find and fill them
        const numberInput = screen.queryByRole('spinbutton');
        if (numberInput) {
          await user.clear(numberInput);
          await user.type(numberInput, '5');
        } else {
          // For select dropdowns, find and select an option
          const selectElement = screen.queryByRole('combobox') || screen.queryByRole('listbox');
          if (selectElement) {
            await user.click(selectElement);
            const firstOption = screen.queryAllByRole('option')[0];
            if (firstOption) {
              await user.click(firstOption);
            }
          }
        }
      }

      // Click next/submit button
      if (actionButton && !actionButton.disabled) {
        await user.click(actionButton);

        // If this was submit, we're done
        if (actionButton.textContent?.includes('Submit Survey')) {
          break;
        }
      }

      // Small delay to let the component update
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Handle multiselect questions
    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      const actionButton = buttons.find(btn =>
        btn.textContent?.includes('Next') || btn.textContent?.includes('Submit Survey')
      );
      expect(actionButton).toBeInTheDocument();
    }, { timeout: 5000 });

    // Answer multiselect questions
    const buttons = screen.getAllByRole('button');
    const answerButtons = buttons.filter(btn => {
      const text = btn.textContent;
      return text &&
             !text.includes('Next') &&
             !text.includes('Previous') &&
             !text.includes('Submit Survey') &&
             !text.includes('Complete') &&
             !btn.disabled;
    });

    // Click a few multiselect options
    for (let i = 0; i < Math.min(3, answerButtons.length); i++) {
      await user.click(answerButtons[i]);
    }

    const actionButton = buttons.find(btn =>
      btn.textContent?.includes('Next') || btn.textContent?.includes('Submit Survey')
    );
    if (actionButton && !actionButton.disabled) {
      await user.click(actionButton);
    }

    // Final submission
    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: 'Submit Survey' });
      expect(submitButton).not.toBeDisabled();
    }, { timeout: 5000 });

    const submitButton = screen.getByRole('button', { name: 'Submit Survey' });
    await user.click(submitButton);

    // Verify that onNext was called
    await waitFor(() => {
      expect(mockOnNext).toHaveBeenCalledWith(
        expect.any(Object)
      );
    }, {
      timeout: 10000
    });
  }, 15000); // 15 second timeout
});