'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import OnboardingProgress from '@/components/v2/onboarding/OnboardingProgress';
import CalendarView from '@/components/v2/onboarding/CalendarView';
import ProtectedRoute from '@/lib/v2/components/ProtectedRoute';
import { useOnboarding } from '@/lib/v2/contexts/OnboardingContext';
import { useProgram } from '@/lib/v2/hooks/useProgram';
import { useUI } from '@/lib/v2/contexts/UIContext';
import { useUser } from '@/lib/v2/contexts/UserContext';

export default function SchedulePage() {
  const router = useRouter();
  const { exerciseProgram, setCurrentStep } = useOnboarding();
  const { scheduleProgram, loading } = useProgram();
  const { setLoading, addNotification } = useUI();
  const { refreshUserStatus } = useUser();

  const handleComplete = async (startDate: string) => {
    if (!exerciseProgram?.id) return;

    try {
      setLoading(true);
      const success = await scheduleProgram(exerciseProgram.id, startDate);
      
      if (success) {
        setCurrentStep(4);
        // Refresh user status to mark onboarding as complete
        await refreshUserStatus();
        addNotification({
          type: 'success',
          message: 'Your fitness program has been scheduled successfully!',
          duration: 3000
        });
        // Redirect to dashboard after successful scheduling
        router.push('/dashboard');
      } else {
        addNotification({
          type: 'error',
          message: 'Failed to schedule program. Please try again.',
          duration: 5000
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'An error occurred while scheduling your program.',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/program');
  };

  if (!exerciseProgram?.approved) {
    return (
      <ProtectedRoute requireAuth requireOnboarding>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Program Approval Required</h2>
            <p className="text-gray-600 mb-4">Please approve your exercise program first.</p>
            <button
              onClick={() => router.push('/program')}
              className="btn-gradient px-6 py-2 rounded-lg text-white font-medium"
            >
              Go to Program
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAuth requireOnboarding>
      <OnboardingProgress currentStep={4} />
      <div className="mt-4 bg-white rounded-lg shadow-md p-6">
        <CalendarView
          program={exerciseProgram}
          onComplete={handleComplete}
          onBack={handleBack}
          loading={loading}
        />
      </div>
    </ProtectedRoute>
  );
}
