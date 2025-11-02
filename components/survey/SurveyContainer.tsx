import React from 'react';
import { SurveyConfig, SurveyProgress, SurveyResponseData } from '@/types/survey';
import { useSurveyState } from '@/hooks/utils/survey/useSurveyState';
import SurveyQuestion from './SurveyQuestion';

interface SurveyContainerProps extends SurveyConfig {
  className?: string;
  showProgressBar?: boolean;
  progressBarColor?: string;
  questionWrapperClassName?: string;
  initialData?: SurveyResponseData;
}

const SurveyContainer: React.FC<SurveyContainerProps> = ({
  questions,
  onSubmit,
  onProgress,
  allowNavigation = true,
  showProgress = true,
  className = '',
  showProgressBar = true,
  progressBarColor = 'bg-[var(--brand-puce)]',
  questionWrapperClassName = 'bg-white p-6 rounded-lg shadow-md',
  initialData = {}
}) => {
  const {
    responses,
    currentQuestion,
    currentQuestionIndex,
    visibleQuestions,
    errors,
    progress,
    isLastQuestion,
    isFirstQuestion,
    canSubmit,
    setResponse,
    setGroupResponse,
    goToNextQuestion,
    goToPreviousQuestion,
    validateCurrentQuestion,
    isQuestionAnswered
  } = useSurveyState(questions, initialData);

  const [submitting, setSubmitting] = React.useState(false);

  // Notify parent of progress changes
  React.useEffect(() => {
    if (onProgress) {
      onProgress(progress);
    }
  }, [progress, onProgress]);

  const handleNext = async () => {
    if (!validateCurrentQuestion()) return;

    if (isLastQuestion) {
      await handleSubmit();
    } else {
      goToNextQuestion();
    }
  };

  const handlePrevious = () => {
    goToPreviousQuestion();
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      await onSubmit(responses);
    } catch (error) {
      console.error('Survey submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuestionChange = (value: unknown) => {
    if (!currentQuestion) return;
    setResponse(currentQuestion.key, value);
  };

  const handleGroupQuestionChange = (groupKey: string, fieldKey: string, value: unknown) => {
    setGroupResponse(groupKey, fieldKey, value);
  };

  const getProgressPercentage = () => {
    if (visibleQuestions.length === 0) return 0;
    return ((currentQuestionIndex + 1) / visibleQuestions.length) * 100;
  };

  if (!currentQuestion) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-500" role="status" aria-live="polite">
        Loading survey...
      </div>
    );
  }

  const isCurrentQuestionValid = isQuestionAnswered(currentQuestion);
  const canProceed = !currentQuestion.required || isCurrentQuestionValid;
  const canSubmitThisStep = isLastQuestion ? canSubmit : canProceed;

  return (
    <div className={`survey-container ${className}`}>
      {/* Progress Section */}
      {showProgress && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-2xl font-bold">Intake Survey</h1>
            <span className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1} of {visibleQuestions.length}
            </span>
          </div>

          {showProgressBar && (
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className={`${progressBarColor} h-2.5 rounded-full transition-all duration-300`}
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Question Section */}
      <div className={questionWrapperClassName}>
        <h2 className="text-xl font-semibold mb-6">{currentQuestion.title}</h2>

        <div className="mb-8">
          <SurveyQuestion
            question={currentQuestion}
            value={responses[currentQuestion.key]}
            onChange={handleQuestionChange}
            error={errors[currentQuestion.key]}
            disabled={submitting}
          />
        </div>

        {/* Navigation */}
        {allowNavigation && (
          <div className="flex justify-between">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={isFirstQuestion || submitting}
              className={`px-4 py-2 rounded transition ${
                isFirstQuestion || submitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Previous
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={!canSubmitThisStep || submitting}
              className={`btn-primary transition ${
                (!canSubmitThisStep || submitting) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {submitting ? (
                'Submitting...'
              ) : isLastQuestion ? (
                'Submit Survey'
              ) : (
                'Next'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SurveyContainer;