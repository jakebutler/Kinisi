import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IntakeSurvey from '@/components/v2/onboarding/IntakeSurvey';

const mockOnNext = jest.fn();

describe('IntakeSurvey', () => {
  beforeEach(() => {
    mockOnNext.mockClear();
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

    // Check that button is selected (should have brand-puce styling)
    expect(yesOption.closest('button')).toHaveClass('border-[var(--brand-puce)]');

    // Should be able to change selection
    await user.click(noOption);
    expect(noOption.closest('button')).toHaveClass('border-[var(--brand-puce)]');
    expect(yesOption.closest('button')).not.toHaveClass('border-[var(--brand-puce)]');
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
    
    // Navigate to second question
    const improveHealthOption = screen.getByText('Improve health');
    await user.click(improveHealthOption);
    await user.click(screen.getByText('Continue'));
    
    expect(screen.getByText('Back')).toBeInTheDocument();
  });

  it('navigates back to previous question when Back is clicked', async () => {
    const user = userEvent.setup();
    render(<IntakeSurvey onNext={mockOnNext} />);
    
    // Navigate to second question
    const improveHealthOption = screen.getByText('Improve health');
    await user.click(improveHealthOption);
    await user.click(screen.getByText('Continue'));
    
    // Go back
    await user.click(screen.getByText('Back'));
    
    expect(screen.getByText('1/13')).toBeInTheDocument();
    expect(screen.getByText('What is your top goal for being physically active?')).toBeInTheDocument();
  });

  it('handles conditional pain description', async () => {
    const user = userEvent.setup();
    render(<IntakeSurvey onNext={mockOnNext} />);

    // Q1: Medical clearance - answer No
    await user.click(screen.getByText('No'));
    await user.click(screen.getByText('Next'));

    // Q2: Current pain - should show Yes/No options
    expect(screen.getByText('Do you currently experience pain or injury that limits your physical activity?')).toBeInTheDocument();

    // Select Yes - should show textarea in the same question
    await user.click(screen.getByText('Yes'));
    // Wait a moment for conditional field to appear
    await user.click(screen.getByText('Next'));

    // The conditional textarea should appear as a separate question
    expect(screen.getByPlaceholderText('Please describe your pain or injury:')).toBeInTheDocument();
  });

  it('handles activity preferences with conditional other field', async () => {
    const user = userEvent.setup();
    render(<IntakeSurvey onNext={mockOnNext} />);
    
    // Navigate through questions to reach activity preferences (question 11)
    const questions = [
      { answer: 'Improve health' }, // Q1: Primary goal
      { answer: 'No' }, // Q2: Medical clearance  
      { answer: 'No' }, // Q3: Current pain
      { answer: '0 days' }, // Q4: Activity frequency
      { answer: 'Good' }, // Q5: Physical function
      { answer: 'Yes' }, // Q6: Intent to change
      { button: '5' }, // Q7: Importance (0-10 scale)
      { button: '7' }, // Q8: Confidence (0-10 scale)
      { answer: '7–8 hours' }, // Q9: Sleep
      { answer: 'No' }, // Q10: Tobacco use
    ];

    for (const q of questions) {
      if (q.button) {
        await user.click(screen.getByText(q.button));
      } else if (q.answer) {
        await user.click(screen.getByText(q.answer));
      }
      await user.click(screen.getByText('Continue'));
    }

    // Q11: Activity preferences - should allow multiple selections
    expect(screen.getByText('What types of physical activity do you enjoy or want to include in your routine?')).toBeInTheDocument();
    
    // Select multiple options including "Other"
    await user.click(screen.getByText('Walking/hiking'));
    await user.click(screen.getByText('Other'));
    
    // Should show textarea for "Other"
    expect(screen.getByPlaceholderText('Please specify other activities...')).toBeInTheDocument();
  });

  it('completes full survey and calls onNext with comprehensive data', async () => {
    const user = userEvent.setup();
    render(<IntakeSurvey onNext={mockOnNext} />);
    
    // Complete all 13 questions
    const surveyFlow = [
      { answer: 'Improve health' }, // Q1
      { answer: 'No' }, // Q2
      { answer: 'No' }, // Q3
      { answer: '1–2 days' }, // Q4
      { answer: 'Good' }, // Q5
      { answer: 'Yes' }, // Q6
      { button: '8' }, // Q7
      { button: '7' }, // Q8
      { answer: '7–8 hours' }, // Q9
      { answer: 'No' }, // Q10
      { multiSelect: ['Walking/hiking', 'Strength training'] }, // Q11
      { multiSelect: ['None / Bodyweight only'] }, // Q12
      { timeCommitment: { days: 3, minutes: '30', time: 'Morning' } } // Q13
    ];

    for (let i = 0; i < surveyFlow.length; i++) {
      const q = surveyFlow[i];
      
      if (q.button) {
        await user.click(screen.getByText(q.button));
      } else if (q.answer) {
        await user.click(screen.getByText(q.answer));
      } else if (q.multiSelect) {
        for (const option of q.multiSelect) {
          await user.click(screen.getByText(option));
        }
      } else if (q.timeCommitment) {
        // Handle time commitment question (Q13)
        await user.click(screen.getByText(q.timeCommitment.days.toString()));
        
        const minutesInput = screen.getByPlaceholderText('Enter minutes (5-180)');
        fireEvent.change(minutesInput, { target: { value: q.timeCommitment.minutes } });
        
        await user.click(screen.getByText(q.timeCommitment.time));
      }
      
      const continueButton = screen.getByText(i === surveyFlow.length - 1 ? 'Complete' : 'Continue');
      await user.click(continueButton);
    }

    await waitFor(() => {
      expect(mockOnNext).toHaveBeenCalledWith(expect.objectContaining({
        primaryGoal: 'Improve health',
        medicalClearance: 'No',
        currentPain: { hasPain: false, description: '' },
        activityFrequency: '1–2',
        physicalFunction: 'Good',
        intentToChange: 'Yes',
        importance: 8,
        confidence: 7,
        sleep: '7–8',
        tobaccoUse: 'No',
        activityPreferences: ['Walking/hiking', 'Strength training'],
        equipmentAccess: ['None / Bodyweight only'],
        timeCommitment: {
          daysPerWeek: 3,
          minutesPerSession: '30',
          preferredTimeOfDay: 'Morning'
        }
      }));
    });
  });

  it('updates progress bar as user progresses', async () => {
    const user = userEvent.setup();
    render(<IntakeSurvey onNext={mockOnNext} />);
    
    // Answer first question and move to second
    await user.click(screen.getByText('Improve health'));
    await user.click(screen.getByText('Continue'));
    
    // Check progress indicator shows 2/13
    expect(screen.getByText('2/13')).toBeInTheDocument();
    
    // Check progress bar width (~15.4% for second question)
    const progressBarFill = document.querySelector('.bg-gradient-to-r');
    expect(progressBarFill).toHaveStyle('width: 15.384615384615385%');
  });
});
