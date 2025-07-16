"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../../components/ui/ProtectedRoute';
import { hasCompletedSurvey } from '../../utils/userFlow';

import { getSurveyResponse } from '../../utils/surveyResponses';
import { getLatestAssessment, generateAndStoreAssessment } from '../../utils/assessments';
import intakeSurveySchema from '../survey/intake-survey-questions.json';
import { useAuth } from "@/components/context/AuthContext";

// Helper function to format survey answers for display
function formatAnswer(key: string, value: any, schema: any): React.ReactNode {
  // Handle time commitment object
  if (key === 'timeCommitment' && value && typeof value === 'object') {
    return (
      <div className="ml-4 space-y-1">
        <div>Days per week: {value.daysPerWeek || 'Not specified'}</div>
        <div>Minutes per session: {value.minutesPerSession || 'Not specified'}</div>
        <div>Preferred time: {value.preferredTimeOfDay || 'Not specified'}</div>
      </div>
    );
  }
  
  // Handle array values (like multiselect)
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : 'None';
  }
  
  // Handle enum values
  if (schema[key]?.enum) {
    const label = schema[key].enumNames?.[schema[key].enum.indexOf(value)] ?? value;
    return <span>{label || 'Not specified'}</span>;
  }
  
  // Handle boolean values
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  // Default case
  return <span>{value !== undefined && value !== null ? value.toString() : 'Not specified'}</span>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isCheckingSurvey, setIsCheckingSurvey] = useState(true);
  const [surveyCompleted, setSurveyCompleted] = useState(false);
  const [surveyResponse, setSurveyResponse] = useState<any>(null);
  const [assessment, setAssessment] = useState<string | null>(null);
  const [assessmentApproved, setAssessmentApproved] = useState(false);
  const [isGeneratingAssessment, setIsGeneratingAssessment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;

      try {
        // Check survey completion
        const completed = await hasCompletedSurvey(user.id);
        if (!completed) {
          router.push('/survey');
          return;
        }
        setSurveyCompleted(true);

        // Load survey response
        const { data: responseData, error: responseError } = await getSurveyResponse(user.id);
        if (responseError) {
          console.error('Error fetching survey response:', responseError);
          setError('Failed to load survey data');
        } else if (responseData && responseData.length > 0) {
          setSurveyResponse(responseData[0].response);
        }

        // Load or generate assessment
        const { data: assessmentData, error: assessmentError } = await getLatestAssessment(user.id);
        
        if (assessmentError || !assessmentData) {
          // Generate assessment if none exists
          if (responseData && responseData.length > 0 && responseData[0].response) {
            setIsGeneratingAssessment(true);
            try {
              const { data: newAssessment } = await generateAndStoreAssessment(user.id, responseData[0].response);
              setAssessment(newAssessment?.assessment || null);
            } catch (genError) {
              console.error('Error generating assessment:', genError);
              setError('Failed to generate assessment');
            } finally {
              setIsGeneratingAssessment(false);
            }
          }
        } else {
          setAssessment(assessmentData.assessment);
          // Check if assessment has been approved (we'll add this field to the database)
          setAssessmentApproved(assessmentData.approved || false);
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('Failed to load dashboard data');
        setSurveyCompleted(true); // Allow access on error
      } finally {
        setIsCheckingSurvey(false);
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user, router]);

  const handleApproveAssessment = async () => {
    if (!user || !assessment) return;

    try {
      const response = await fetch('/api/assessment/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve assessment');
      }

      setAssessmentApproved(true);
    } catch (err) {
      console.error('Error approving assessment:', err);
      alert('Failed to approve assessment. Please try again.');
    }
  };

  if (isCheckingSurvey || loading) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="bg-white p-8 rounded shadow w-full max-w-md text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-700">Loading your dashboard...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!surveyCompleted) {
    return null;
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="bg-white p-8 rounded shadow w-full max-w-md text-center">
            <h1 className="text-2xl font-bold mb-4 text-red-600">Error</h1>
            <p className="text-gray-700 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8 text-center">Your Dashboard</h1>
          
          {/* Survey Results Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Your Survey Results</h2>
            {surveyResponse ? (
              <div className="max-h-96 overflow-y-auto pr-2">
                <div className="space-y-4">
                  {Object.entries(surveyResponse).map(([key, value]) => {
                    const questionProperty = (intakeSurveySchema.properties as any)?.[key];
                    const questionTitle = questionProperty?.title || key;
                    
                    return (
                      <div key={key} className="border-b border-gray-200 pb-3">
                        <h3 className="font-medium text-gray-900 mb-1">{questionTitle}</h3>
                        <div className="text-gray-700">
                          {formatAnswer(key, value, intakeSurveySchema.properties || {})}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <div className="mb-4">
                  <svg className="mx-auto h-12 w-12 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-blue-900 mb-2">Complete Your Intake Survey</h3>
                <p className="text-blue-700 mb-4">
                  To get started with your personalized fitness journey, please complete your intake survey first.
                </p>
                <button
                  onClick={() => router.push('/survey')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start Survey
                </button>
              </div>
            )}
          </div>

          {/* Assessment Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">Your Personalized Assessment</h2>
            
            {!surveyResponse ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <div className="mb-4">
                  <svg className="mx-auto h-12 w-12 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-yellow-900 mb-2">Complete Your Intake Survey First</h3>
                <p className="text-yellow-700">
                  Your personalized assessment will be generated after you complete the intake survey.
                </p>
              </div>
            ) : isGeneratingAssessment ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Generating your personalized assessment...</span>
              </div>
            ) : assessment ? (
              <div>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="whitespace-pre-wrap text-gray-800">{assessment}</div>
                </div>
                
                {!assessmentApproved ? (
                  <div className="flex space-x-4">
                    <button
                      onClick={handleApproveAssessment}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Approve Assessment
                    </button>
                    <button
                      onClick={() => router.push('/survey/results')}
                      className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Request Changes
                    </button>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-green-800 font-medium">Assessment Approved!</span>
                    </div>
                    <p className="text-green-700 mt-2">You're ready to begin your personalized fitness journey.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No assessment available</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Generate Assessment
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
