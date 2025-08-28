'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import OnboardingProgress from '@/components/v2/onboarding/OnboardingProgress';
import PersonalizedAssessment from '@/components/v2/onboarding/PersonalizedAssessment';
import ProtectedRoute from '@/lib/v2/components/ProtectedRoute';
import { useOnboarding } from '@/lib/v2/contexts/OnboardingContext';
import { useAssessment } from '@/lib/v2/hooks/useAssessment';
import { useUI } from '@/lib/v2/contexts/UIContext';

export default function AssessmentPage() {
  const router = useRouter();
  const { assessment, setCurrentStep, setAssessment } = useOnboarding();
  const { approveAssessment, requestAssessmentUpdate, loading } = useAssessment();
  const { setLoading, addNotification } = useUI();

  const handleApprove = async () => {
    if (!assessment?.id) return;

    try {
      setLoading(true);
      const success = await approveAssessment(assessment.id);
      
      if (success) {
        setAssessment({ ...assessment, approved: true });
        setCurrentStep(3);
        addNotification({
          type: 'success',
          message: 'Assessment approved! Moving to program generation.',
          duration: 3000
        });
        router.push('/program');
      } else {
        addNotification({
          type: 'error',
          message: 'Failed to approve assessment. Please try again.',
          duration: 5000
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'An error occurred while approving your assessment.',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestUpdate = async (feedback: string) => {
    if (!assessment?.id) return;

    try {
      setLoading(true);
      const updatedAssessment = await requestAssessmentUpdate(assessment.id, feedback);
      
      if (updatedAssessment) {
        setAssessment(updatedAssessment);
        addNotification({
          type: 'success',
          message: 'Assessment updated based on your feedback.',
          duration: 3000
        });
      } else {
        addNotification({
          type: 'error',
          message: 'Failed to update assessment. Please try again.',
          duration: 5000
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'An error occurred while updating your assessment.',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  if (!assessment) {
    return (
      <ProtectedRoute requireAuth requireOnboarding>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No Assessment Found</h2>
            <p className="text-gray-600 mb-4">Please complete the survey first.</p>
            <button
              onClick={() => router.push('/survey')}
              className="btn-gradient px-6 py-2 rounded-lg text-white font-medium"
            >
              Go to Survey
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAuth requireOnboarding>
      <OnboardingProgress currentStep={2} />
      <div className="mt-4 bg-white rounded-lg shadow-md p-6">
        <PersonalizedAssessment
          assessment={assessment}
          onApprove={handleApprove}
          onRequestUpdate={handleRequestUpdate}
          loading={loading}
        />
      </div>
    </ProtectedRoute>
  );
}
