import { useState, useCallback, useEffect } from 'react';
import { SurveyQuestion, SurveyResponseData, SurveyProgress } from '@/types/survey';
import { validateQuestion } from '@/utils/survey/validation';

export const useSurveyState = (questions: SurveyQuestion[], initialData: SurveyResponseData = {}) => {
  const [responses, setResponses] = useState<SurveyResponseData>(initialData);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [visibleQuestions, setVisibleQuestions] = useState<SurveyQuestion[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Filter questions based on follow-up logic
  const getVisibleQuestions = useCallback((currentResponses: SurveyResponseData): SurveyQuestion[] => {
    const filtered: SurveyQuestion[] = [];

    questions.forEach(question => {
      // Skip follow-up questions, we'll handle them separately
      if (question.isFollowUp) return;

      filtered.push(question);

      // Check if this question has a follow-up that should be shown
      if (question.showFollowUp && question.followUp) {
        const response = currentResponses[question.key];
        if (question.showFollowUp(response)) {
          filtered.push({
            ...question.followUp,
            isFollowUp: true,
            key: `${question.key}_${question.followUp.key}`
          });
        }
      }
    });

    return filtered;
  }, [questions]);

  // Update visible questions when responses change
  useEffect(() => {
    const newVisibleQuestions = getVisibleQuestions(responses);
    setVisibleQuestions(newVisibleQuestions);

    // Adjust current index if necessary
    if (currentQuestionIndex >= newVisibleQuestions.length) {
      setCurrentQuestionIndex(Math.max(0, newVisibleQuestions.length - 1));
    }
  }, [responses, getVisibleQuestions, currentQuestionIndex]);

  // Set response for a question
  const setResponse = useCallback((key: string, value: unknown) => {
    setResponses(prev => {
      const newResponses = { ...prev, [key]: value };

      // Clear any existing error for this question
      setErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        delete newErrors[key];
        return newErrors;
      });

      return newResponses;
    });
  }, []);

  // Set response for a group field
  const setGroupResponse = useCallback((groupKey: string, fieldKey: string, value: unknown) => {
    setResponses(prev => ({
      ...prev,
      [groupKey]: {
        ...(prev[groupKey] as Record<string, unknown> || {}),
        [fieldKey]: value
      }
    }));

    // Clear any existing error for this group field
    setErrors(prevErrors => {
      const newErrors = { ...prevErrors };
      delete newErrors[`${groupKey}_${fieldKey}`];
      return newErrors;
    });
  }, []);

  // Validate current question
  const validateCurrentQuestion = useCallback(() => {
    if (visibleQuestions.length === 0) return true;

    const currentQuestion = visibleQuestions[currentQuestionIndex];
    if (!currentQuestion) return true;

    const result = validateQuestion(currentQuestion, responses[currentQuestion.key]);

    if (!result.isValid) {
      setErrors(prev => ({
        ...prev,
        [currentQuestion.key]: result.errorMessage || 'Invalid response'
      }));
      return false;
    }

    return true;
  }, [visibleQuestions, currentQuestionIndex, responses]);

  // Navigate to next question
  const goToNextQuestion = useCallback(() => {
    if (!validateCurrentQuestion()) return false;

    if (currentQuestionIndex < visibleQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      return true;
    }
    return false;
  }, [currentQuestionIndex, visibleQuestions.length, validateCurrentQuestion]);

  // Navigate to previous question
  const goToPreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      return true;
    }
    return false;
  }, [currentQuestionIndex]);

  // Navigate to specific question
  const goToQuestion = useCallback((index: number) => {
    if (index >= 0 && index < visibleQuestions.length) {
      setCurrentQuestionIndex(index);
      return true;
    }
    return false;
  }, [visibleQuestions.length]);

  // Check if a question is answered
  const isQuestionAnswered = useCallback((question: SurveyQuestion): boolean => {
    const value = responses[question.key];
    const result = validateQuestion(question, value);
    return result.isValid;
  }, [responses]);

  // Get current question
  const currentQuestion = visibleQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === visibleQuestions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  // Calculate progress
  const progress: SurveyProgress = {
    currentQuestionIndex,
    totalQuestions: visibleQuestions.length,
    isCompleted: visibleQuestions.length > 0 && currentQuestionIndex === visibleQuestions.length - 1
  };

  // Check if survey can be submitted
  const canSubmit = visibleQuestions.every(question => isQuestionAnswered(question));

  return {
    // State
    responses,
    currentQuestion,
    currentQuestionIndex,
    visibleQuestions,
    errors,
    progress,
    isLastQuestion,
    isFirstQuestion,
    canSubmit,

    // Actions
    setResponse,
    setGroupResponse,
    goToNextQuestion,
    goToPreviousQuestion,
    goToQuestion,
    validateCurrentQuestion,

    // Utilities
    isQuestionAnswered
  };
};