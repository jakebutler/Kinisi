'use client';

import React, { useState } from 'react';

// Disable static generation for this page since it requires authentication
export const dynamic = 'force-dynamic';
import Navigation from '@/components/v2/dashboard/Navigation';
import { useDashboardData } from '@/lib/v2/hooks/useDashboardData';
import { useUser } from '@/lib/v2/contexts/UserContext';
import { useUI } from '@/lib/v2/contexts/UIContext';
import LoadingSpinner from '@/components/v2/ui/LoadingSpinner';
import EmptyState from '@/components/v2/ui/EmptyState';
import ErrorDisplay from '@/components/v2/ui/ErrorDisplay';
import ProtectedRoute from '@/lib/v2/components/ProtectedRoute';
import ExerciseProgram from '@/components/v2/onboarding/ExerciseProgram';
import PersonalizedAssessment from '@/components/v2/onboarding/PersonalizedAssessment';
import { Calendar, Activity, ClipboardList } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useUser();
  const { addNotification } = useUI();
  const { program, assessment, surveyData, loading, error } = useDashboardData();
  
  const [activeTab, setActiveTab] = useState('program');

  const handleProgramUpdate = async (feedback: string) => {
    addNotification({
      type: 'success',
      message: 'Program update request submitted.',
      duration: 3000
    });
  };

  const handleAssessmentUpdate = async (feedback: string) => {
    addNotification({
      type: 'success',
      message: 'Assessment update request submitted.',
      duration: 3000
    });
  };

  const handleSurveyUpdate = async (surveyData: any) => {
    addNotification({
      type: 'success',
      message: 'Survey updated successfully.',
      duration: 3000
    });
  };

  const renderActiveContent = () => {
    if (loading) {
      return <LoadingSpinner message="Loading your data..." />;
    }

    if (error) {
      return <ErrorDisplay message={error} onRetry={() => window.location.reload()} />;
    }

    switch (activeTab) {
      case 'program':
        return program ? (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Fitness Program</h2>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-800 mb-2">Program Status: Approved ✅</h3>
              <p className="text-gray-600 text-sm">
                Your personalized fitness program is ready. You can request updates if needed.
              </p>
            </div>
            <div className="space-y-4">
              <p className="text-gray-700">
                <strong>Program ID:</strong> {program.id}
              </p>
              <p className="text-gray-700">
                <strong>Created:</strong> {new Date(program.created_at).toLocaleDateString(undefined, { timeZone: 'UTC' })}
              </p>
              {program.last_scheduled_at && (
                <p className="text-gray-700">
                  <strong>Last Scheduled:</strong> {new Date(program.last_scheduled_at).toLocaleDateString(undefined, { timeZone: 'UTC' })}
                </p>
              )}
            </div>
          </div>
        ) : (
          <EmptyState
            icon={Calendar}
            title="No Program Found"
            description="Your fitness program will appear here once generated."
          />
        );

      case 'assessment':
        return assessment ? (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Assessment</h2>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-800 mb-2">Assessment Status: Approved ✅</h3>
              <p className="text-gray-600 text-sm">
                Your personalized assessment is complete. You can request updates if needed.
              </p>
            </div>
            <div className="space-y-4">
              <p className="text-gray-700">
                <strong>Assessment ID:</strong> {assessment.id}
              </p>
              <p className="text-gray-700">
                <strong>Created:</strong> {new Date(assessment.created_at).toLocaleDateString()}
              </p>
              {assessment.assessment && (
                <div className="bg-white rounded-lg p-4 border">
                  <h4 className="font-medium text-gray-800 mb-2">Assessment Content:</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{assessment.assessment}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <EmptyState
            icon={Activity}
            title="No Assessment Found"
            description="Your personalized assessment will appear here."
          />
        );

      case 'survey':
        return surveyData ? (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Survey Responses</h2>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-800 mb-2">Survey Complete ✅</h3>
              <p className="text-gray-600 text-sm">
                You can update your survey responses at any time to improve your program.
              </p>
            </div>
            <div className="space-y-4">
              <p className="text-gray-700">
                <strong>Last Updated:</strong> {new Date(surveyData.created_at).toLocaleDateString(undefined, { timeZone: 'UTC' })}
              </p>
              <div className="bg-white rounded-lg p-4 border">
                <h4 className="font-medium text-gray-800 mb-2">Survey Data:</h4>
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(surveyData.response_data, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={ClipboardList}
            title="No Survey Data Found"
            description="Your survey responses will appear here."
          />
        );

      default:
        return null;
    }
  };

  return (
    <ProtectedRoute requireActive>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome back, {user?.username || user?.email?.split('@')[0]}!
          </h1>
          <p className="text-gray-600">
            Manage your fitness journey and track your progress.
          </p>
        </div>

        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="bg-white rounded-lg shadow-md p-6">
          {renderActiveContent()}
        </div>
      </div>
    </ProtectedRoute>
  );
}
