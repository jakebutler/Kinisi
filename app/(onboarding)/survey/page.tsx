'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import OnboardingProgress from '@/components/v2/onboarding/OnboardingProgress';
import IntakeSurvey from '@/components/v2/onboarding/IntakeSurvey';
import ProtectedRoute from '@/lib/v2/components/ProtectedRoute';
import { useOnboarding } from '@/lib/v2/contexts/OnboardingContext';
import { useAssessment } from '@/lib/v2/hooks/useAssessment';
import { useUI } from '@/lib/v2/contexts/UIContext';

export default function SurveyPage() {
  const router = useRouter();
  const { setCurrentStep, setSurveyData, setAssessment } = useOnboarding();
  const { generateAssessment, loading } = useAssessment();
  const { setLoading, addNotification } = useUI();

  const handleSurveyComplete = async (surveyData: any) => {
    try {
      setLoading(true);
      setSurveyData(surveyData);

      // Generate assessment from survey data
      const assessment = await generateAssessment(surveyData);
      
      if (assessment) {
        setAssessment(assessment);
        setCurrentStep(2);
        router.push('/assessment');
      } else {
        addNotification({
          type: 'error',
          message: 'Failed to generate assessment. Please try again.',
          duration: 5000
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'An error occurred while processing your survey.',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requireAuth requireOnboarding>
      <OnboardingProgress currentStep={1} />
      <div className="mt-4 bg-white rounded-lg shadow-md p-6">
        <IntakeSurvey onNext={handleSurveyComplete} submitting={loading} />
      </div>
    </ProtectedRoute>
  );
}
