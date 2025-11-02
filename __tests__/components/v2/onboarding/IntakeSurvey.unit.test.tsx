import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IntakeSurvey from '../../../../components/v2/onboarding/IntakeSurvey';
import { SurveyResponseData } from '../../../types/survey';

// Mock the survey components to isolate testing logic
jest.mock('@/components/survey/SurveyContainer', () => {
  return function MockSurveyContainer({ onSubmit, questions }: any) {
    const [isSubmitted, setIsSubmitted] = React.useState(false);

    const handleSubmit = () => {
      // Create mock survey responses
      const mockResponses: SurveyResponseData = {
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
        activityPreferences: ['Walking/hiking'],
        equipmentAccess: ['Home workouts'],
        timeCommitment: {
          daysPerWeek: 3,
          minutesPerSession: 30,
          preferredTimeOfDay: 'Morning'
        }
      };

      setIsSubmitted(true);
      onSubmit(mockResponses);
    };

    return (
      <div data-testid="survey-container">
        <div data-testid="survey-title">Intake Survey</div>
        <div data-testid="question-count">Question 1 of {questions.length}</div>
        <div data-testid="survey-question">
          Have you ever been told by a doctor that you should not exercise because of a medical condition?
        </div>

        {!isSubmitted ? (
          <button data-testid="submit-button" onClick={handleSubmit}>
            Submit Survey
          </button>
        ) : (
          <div data-testid="survey-completed">Survey completed successfully</div>
        )}
      </div>
    );
  };
});

const mockOnNext = jest.fn();

describe('IntakeSurvey Unit Tests', () => {
  beforeEach(() => {
    mockOnNext.mockClear();
    jest.clearAllMocks();
  });

  it('renders survey container with correct props', () => {
    render(<IntakeSurvey onNext={mockOnNext} />);

    expect(screen.getByTestId('survey-container')).toBeInTheDocument();
    expect(screen.getByTestId('survey-title')).toHaveTextContent('Intake Survey');
    expect(screen.getByTestId('survey-question')).toBeInTheDocument();
  });

  it('calls onNext when survey is submitted', async () => {
    const user = userEvent.setup();
    render(<IntakeSurvey onNext={mockOnNext} />);

    const submitButton = screen.getByTestId('submit-button');
    expect(submitButton).toBeInTheDocument();

    await user.click(submitButton);

    // Verify that onNext was called with survey data
    await waitFor(() => {
      expect(mockOnNext).toHaveBeenCalledTimes(1);
      expect(mockOnNext).toHaveBeenCalledWith(
        expect.objectContaining({
          medicalClearance: 'No',
          currentPain: 'No',
          activityFrequency: '3-4',
          importance: expect.any(Number),
          confidence: expect.any(Number),
          timeCommitment: expect.objectContaining({
            daysPerWeek: expect.any(Number),
            minutesPerSession: expect.any(Number),
            preferredTimeOfDay: expect.any(String)
          })
        })
      );
    });
  });

  it('shows completion state after submission', async () => {
    const user = userEvent.setup();
    render(<IntakeSurvey onNext={mockOnNext} />);

    const submitButton = screen.getByTestId('submit-button');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('survey-completed')).toBeInTheDocument();
      expect(screen.getByText('Survey completed successfully')).toBeInTheDocument();
    });
  });

  it('passes correct question count to survey container', () => {
    render(<IntakeSurvey onNext={mockOnNext} />);

    const questionCount = screen.getByTestId('question-count');
    expect(questionCount).toHaveTextContent('Question 1 of 15');
  });

  it('handles submitting prop correctly', () => {
    render(<IntakeSurvey onNext={mockOnNext} submitting={true} />);

    const surveyContainer = screen.getByTestId('survey-container');
    expect(surveyContainer).toBeInTheDocument();
  });
});