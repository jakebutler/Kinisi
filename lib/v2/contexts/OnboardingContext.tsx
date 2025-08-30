'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SurveyData, Assessment, ExerciseProgram } from '../types';
import { supabase } from '@/utils/supabaseClient';

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
  loading: boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [program, setProgram] = useState<ExerciseProgram | null>(null);
  const [loading, setLoading] = useState(true);

  // Load existing onboarding data on mount
  useEffect(() => {
    const loadOnboardingData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Load survey data
        const { data: surveyResponse } = await supabase
          .from('survey_responses')
          .select('response')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (surveyResponse) {
          setSurveyData(surveyResponse.response);
          setCurrentStep(2);
        }

        // Load latest assessment
        const { data: assessmentData } = await supabase
          .from('assessments')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (assessmentData) {
          setAssessment(assessmentData);
          setCurrentStep(assessmentData.approved ? 3 : 2);
        }

        // Load latest program
        const { data: programData } = await supabase
          .from('exercise_programs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (programData) {
          setProgram(programData);
          if (programData.status === 'approved') {
            // Check if scheduled
            const hasScheduledSessions = programData.program_json && 
              Array.isArray(programData.program_json) &&
              programData.program_json.some((session: any) => session.start_at);
            
            setCurrentStep(hasScheduledSessions || programData.last_scheduled_at ? 5 : 4);
          } else {
            setCurrentStep(3);
          }
        }
      } catch (error) {
        console.error('Error loading onboarding data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOnboardingData();
  }, []);

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
      resetOnboarding,
      loading
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
