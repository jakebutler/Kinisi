'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { SurveyData, Assessment, ExerciseProgram } from '../types';

interface OnboardingContextType {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  surveyData: SurveyData | null;
  setSurveyData: (data: SurveyData | null) => void;
  assessment: Assessment | null;
  setAssessment: (assessment: Assessment | null) => void;
  exerciseProgram: ExerciseProgram | null;
  setExerciseProgram: (program: ExerciseProgram | null) => void;
  resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [program, setProgram] = useState<ExerciseProgram | null>(null);

  const resetOnboarding = () => {
    setCurrentStep(1);
    setSurveyData(null);
    setAssessment(null);
    setProgram(null);
  };

  return (
    <OnboardingContext.Provider value={{
      currentStep,
      surveyData,
      assessment,
      exerciseProgram: program,
      setCurrentStep,
      setSurveyData,
      setAssessment,
      setExerciseProgram: setProgram,
      resetOnboarding
    }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
