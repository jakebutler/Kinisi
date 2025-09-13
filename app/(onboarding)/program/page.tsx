'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import OnboardingProgress from '@/components/v2/onboarding/OnboardingProgress';
import ExerciseProgram from '@/components/v2/onboarding/ExerciseProgram';
import ProtectedRoute from '@/lib/v2/components/ProtectedRoute';
import { useOnboarding } from '@/lib/v2/contexts/OnboardingContext';
import { useProgram } from '@/lib/v2/hooks/useProgram';
import { useUI } from '@/lib/v2/contexts/UIContext';

export default function ProgramPage() {
  const router = useRouter();
  const { assessment, exerciseProgram, setCurrentStep, setExerciseProgram } = useOnboarding();
  const { generateProgram, approveProgram, requestProgramUpdate, loading } = useProgram();
  const { setLoading, addNotification } = useUI();
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Generate program if we have an approved assessment but no program
    if (assessment?.approved && !exerciseProgram) {
      handleGenerateProgram();
    }
  }, [assessment, exerciseProgram]);

  const handleGenerateProgram = async () => {
    if (!assessment?.id) return;

    try {
      setIsGenerating(true);
      setLoading(true);
      
      const program = await generateProgram(assessment.id, {});
      
      if (program) {
        setExerciseProgram(program);
        addNotification({
          type: 'success',
          message: 'Your personalized exercise program has been generated!',
          duration: 3000
        });
      } else {
        addNotification({
          type: 'error',
          message: 'Failed to generate program. Please try again.',
          duration: 5000
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'An error occurred while generating your program.',
        duration: 5000
      });
    } finally {
      setIsGenerating(false);
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!exerciseProgram?.id) return;

    try {
      setLoading(true);
      const success = await approveProgram(exerciseProgram.id);
      
      if (success) {
        setExerciseProgram({ ...exerciseProgram, approved: true });
        setCurrentStep(4);
        addNotification({
          type: 'success',
          message: 'Program approved! Moving to scheduling.',
          duration: 3000
        });
        router.push('/schedule');
      } else {
        addNotification({
          type: 'error',
          message: 'Failed to approve program. Please try again.',
          duration: 5000
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'An error occurred while approving your program.',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestUpdate = async (feedback: string) => {
    if (!exerciseProgram?.id) return;

    try {
      setLoading(true);
      const updatedProgram = await requestProgramUpdate(exerciseProgram.id, feedback);
      
      if (updatedProgram) {
        setExerciseProgram(updatedProgram);
        addNotification({
          type: 'success',
          message: 'Program updated based on your feedback.',
          duration: 3000
        });
      } else {
        addNotification({
          type: 'error',
          message: 'Failed to update program. Please try again.',
          duration: 5000
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'An error occurred while updating your program.',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  if (!assessment?.approved) {
    return (
      <ProtectedRoute requireAuth requireOnboarding>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Assessment Required</h2>
            <p className="text-gray-600 mb-4">Please complete and approve your assessment first.</p>
            <button
              onClick={() => router.push('/assessment')}
              className="btn-gradient px-6 py-2 rounded-lg text-white font-medium"
            >
              Go to Assessment
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (isGenerating || !exerciseProgram) {
    return (
      <ProtectedRoute requireAuth requireOnboarding>
        <OnboardingProgress currentStep={3} />
        <div className="mt-4 bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-puce)] mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Generating Your Program
              </h2>
              <p className="text-gray-600">
                Creating a personalized exercise program based on your assessment...
              </p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAuth requireOnboarding>
      <OnboardingProgress currentStep={3} />
      <div className="mt-4 bg-white rounded-lg shadow-md p-6">
        <ExerciseProgram
          program={exerciseProgram}
          onApprove={handleApprove}
          onRequestUpdate={handleRequestUpdate}
          loading={loading}
        />
      </div>
    </ProtectedRoute>
  );
}
