"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../../components/ui/ProtectedRoute';
import { hasCompletedSurvey } from '../../utils/userFlow';

import { getSurveyResponse } from '../../utils/surveyResponses';
import { getLatestAssessment, generateAndStoreAssessment } from '../../utils/assessments';
import intakeSurveySchema from '../legacy/survey/intake-survey-questions.json';
import { useAuth } from "@/components/context/AuthContext";
import ProgramSection from "@/components/dashboard/ProgramSection";
import { ExerciseProgramPayload } from "@/utils/types/programTypes";
import { getProgramByUserId, approveProgram } from "@/utils/programDataHelpers";
import { supabase } from "@/utils/supabaseClient";
import OnboardingProgress from "@/components/dashboard/OnboardingProgress";
import Navigation from "@/components/dashboard/Navigation";
import ProgramCalendar from "@/components/program/ProgramCalendar";
import { isScheduleComplete } from "@/utils/onboarding";
import AssessmentReview from "@/components/dashboard/AssessmentReview";

// Helper function to format survey answers for display
function formatAnswer(key: string, value: unknown, schema: unknown): React.ReactNode {
  // Handle time commitment object
  if (key === 'timeCommitment' && value && typeof value === 'object' && value !== null &&
      'daysPerWeek' in value && 'minutesPerSession' in value && 'preferredTimeOfDay' in value) {
    const tc = value as { daysPerWeek: number; minutesPerSession: number; preferredTimeOfDay: string };
    return (
      <span>
        {tc.daysPerWeek} days/week, {tc.minutesPerSession} min/session, Preferred: {tc.preferredTimeOfDay}
      </span>
    );
  }
  
  // Handle array values (like multiselect)
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : 'None';
  }
  
  // Handle enums (single and multiple choice)
  // Handle enums (single and multiple choice)
  if (
    schema &&
    typeof schema === 'object' &&
    'enum' in schema &&
    Array.isArray((schema as { enum: unknown }).enum)
  ) {
    const enumArray = (schema as { enum: unknown[] }).enum;
    const enumNames = 'enumNames' in schema && Array.isArray((schema as { enumNames: unknown[] }).enumNames)
      ? (schema as { enumNames: string[] }).enumNames
      : undefined;
    if (Array.isArray(value)) {
      return (
        <span>
          {value
            .map((v: string) => {
              const idx = enumArray.indexOf(v);
              return enumNames ? String(enumNames[idx]) : String(v);
            })
            .join(', ')}
        </span>
      );
    } else {
      const idx = enumArray.indexOf(value);
      return <span>{enumNames ? String(enumNames[idx]) : String(value)}</span>;
    }
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
  const [surveyResponse, setSurveyResponse] = useState<Record<string, unknown> | null>(null);
  const [assessment, setAssessment] = useState<string | null>(null);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [assessmentApproved, setAssessmentApproved] = useState(false);
  const [isGeneratingAssessment, setIsGeneratingAssessment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [isRequestingChanges, setIsRequestingChanges] = useState(false);
  const [feedback, setFeedback] = useState("");

  // Fitness program state
  const [program, setProgram] = useState<ExerciseProgramPayload | null>(null);
  const [isGeneratingProgram, setIsGeneratingProgram] = useState(false);
  const [programError, setProgramError] = useState<string | null>(null);
  const [programApproved, setProgramApproved] = useState(false);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [programId, setProgramId] = useState<string | null>(null);
  const [lastScheduledAt, setLastScheduledAt] = useState<string | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleMessage, setScheduleMessage] = useState<string | null>(null);
  // Removed RAG preview UI and related state

  // Fetch program after assessment is approved
  useEffect(() => {
    const fetchProgram = async () => {
      if (!user || !assessmentApproved) return;
      setIsGeneratingProgram(true);
      setProgramError(null);
      try {
        // Fetch the user's latest program
        const programData = await getProgramByUserId(user.id, supabase);
        if (programData && programData.program_json) {
          setProgram(programData.program_json);
          setProgramApproved(programData.status === "approved");
          setStartDate(programData.start_date || null);
          setProgramId(programData.id || null);
          setLastScheduledAt(programData.last_scheduled_at || null);
        } else {
          // No program exists yet - this is expected for new users
          setProgram(null);
          setProgramApproved(false);
          setStartDate(null);
          setProgramId(null);
          setLastScheduledAt(null);
        }
      } catch {
        setProgramError("We're having trouble creating your program right now. Please try back later.");
      } finally {
        setIsGeneratingProgram(false);
      }
    };
    fetchProgram();
    // Only run when assessment is approved and user is present
  }, [user, assessmentApproved]);

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
              setAssessmentId(newAssessment?.id || null);
            } catch (genError) {
              console.error('Error generating assessment:', genError);
              setError('Failed to generate assessment');
            } finally {
              setIsGeneratingAssessment(false);
            }
          }
        } else {
          setAssessment(assessmentData.assessment);
          setAssessmentId(assessmentData.id);
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

  // RAG preview removed per UX simplification

  // Reusable handlers for Program actions
  const handleApproveProgram = async () => {
    if (!user || !program || !programId) return;
    try {
      setIsGeneratingProgram(true);
      await approveProgram(programId, supabase);
      setProgramApproved(true);
    } catch {
      setProgramError("Failed to approve program. Please try again.");
    } finally {
      setIsGeneratingProgram(false);
    }
  };

  const handleGenerateProgram = async () => {
    if (!user || !assessmentApproved) return;
    if (!assessment) {
      setProgramError("Assessment content not found. Please refresh and try again.");
      return;
    }
    try {
      setIsGeneratingProgram(true);
      setProgramError(null);
      const res = await fetch('/api/program/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessment,
          exerciseFilter: {},
          userId: user.id,
        }),
      });
      if (!res.ok) {
        let errMsg = 'Failed to generate program';
        try {
          const j = await res.json();
          if (j?.error) errMsg = j.error;
        } catch {}
        throw new Error(errMsg);
      }
      const saved = await res.json();
      setProgram(saved?.program_json || null);
      setProgramApproved(saved?.status === 'approved');
      setStartDate(saved?.start_date || null);
      setProgramId(saved?.id || null);
    } catch {
      setProgramError("Failed to generate program. Please try again.");
    } finally {
      setIsGeneratingProgram(false);
    }
  };

  const handleGenerateSchedule = async () => {
    if (!user || !programId) return;
    setIsScheduling(true);
    setScheduleMessage(null);
    try {
      const res = await fetch(`/api/program/${programId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to schedule program');
      if (data?.program_json) setProgram(data.program_json);
      if (data?.last_scheduled_at) setLastScheduledAt(data.last_scheduled_at);
      setScheduleMessage('Schedule generated.');
    } catch (e: any) {
      setScheduleMessage(e?.message || 'Failed to generate schedule');
    } finally {
      setIsScheduling(false);
    }
  };

  // Auto-generate program right after assessment approval if none exists
  useEffect(() => {
    if (!user || !assessmentApproved || !assessment) return;
    if (isGeneratingProgram) return;
    if (!program && !programId && !programError) {
      void handleGenerateProgram();
    }
  }, [user, assessmentApproved, assessment, program, programId, programError, isGeneratingProgram]);

  const handleApproveAssessment = async () => {
    if (!user || !assessment) return;
    setIsWorking(true);
    setError(null);
    try {
      const response = await fetch('/api/assessment/approve', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to approve assessment');
      }
      setAssessmentApproved(true);
    } catch (err) {
      console.error('Error approving assessment:', err);
      setError('Failed to approve assessment. Please try again.');
    } finally {
      setIsWorking(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!assessment || !surveyResponse || !feedback.trim()) return;
    setIsWorking(true);
    setError(null);
    try {
      // Attach access token for server-side user lookup and include revision id for exact survey linkage
      const { data: sess } = await supabase.auth.getSession();
      const accessToken = sess?.session?.access_token;
      const res = await fetch('/api/assessment/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          currentAssessment: assessment,
          feedback,
          surveyResponses: surveyResponse,
          revisionOfAssessmentId: assessmentId || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to submit feedback');
      if (data?.assessment) {
        setAssessment(data.assessment);
        if (data?.assessmentId) setAssessmentId(data.assessmentId);
      }
      setFeedback("");
      setIsRequestingChanges(false);
    } catch (e: any) {
      setError(e?.message || 'Failed to submit feedback');
    } finally {
      setIsWorking(false);
    }
  };

  if (isCheckingSurvey || loading) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen items-center justify-center">
          <div className="bg-white p-8 rounded shadow w-full max-w-md text-center" role="status" aria-live="polite">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-puce)] mx-auto mb-4" aria-hidden="true"></div>
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
        <div className="flex min-h-screen items-center justify-center">
          <div className="bg-white p-8 rounded shadow w-full max-w-md text-center">
            <h1 className="text-2xl font-bold mb-4 text-red-600">Error</h1>
            <p className="text-gray-700 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="btn-primary"
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
      <div className="min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8 text-center">Your Dashboard</h1>
          {/* Onboarding Progress or Navigation when complete */}
          {programApproved && isScheduleComplete(program, lastScheduledAt) ? (
            <Navigation programId={programId} />
          ) : (
            <OnboardingProgress
              currentStep={!surveyCompleted ? 1 : !assessmentApproved ? 2 : !programApproved ? 3 : 4}
            />
          )}

          {/* Assessment Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mt-8">
            <h2 className="text-2xl font-semibold mb-4">Your Personalized Assessment</h2>
            {!assessmentApproved ? (
              <AssessmentReview
                surveyResponse={surveyResponse}
                assessment={assessment}
                loading={isGeneratingAssessment}
                error={null}
                working={isWorking}
                onApprove={handleApproveAssessment}
                onSubmitFeedback={async (fb: string) => {
                  setFeedback(fb);
                  await handleSubmitFeedback();
                }}
              />
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-800 font-medium">Assessment Approved!</span>
                </div>
                <p className="text-green-700 mt-2">You&apos;re ready to begin your personalized fitness journey.</p>
              </div>
            )}
          </div>
        </div>

        {/* Fitness Program Section */}
        {assessmentApproved && (
          <ProgramSection
            assessmentApproved={assessmentApproved}
            program={program}
            programApproved={programApproved}
            isGeneratingProgram={isGeneratingProgram}
            programError={programError}
            onSeeProgram={() => {
              if (programId) {
                router.push(`/program/${programId}`);
              }
            }}
            onGiveFeedback={() => {
              if (programId) {
                router.push(`/program/${programId}#feedback`);
              }
            }}
            onApproveProgram={handleApproveProgram}
            onGenerateProgram={handleGenerateProgram}
            onStartDateChange={async (date: string) => {
              setStartDate(date);
              if (!user || !program || !programId) return;
              try {
                const res = await fetch(`/api/program/${programId}/start-date`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ startDate: date })
                });
                if (!res.ok) {
                  throw new Error("Failed to update start date");
                }
                try {
                  const updated = await res.json();
                  if (updated?.start_date) setStartDate(updated.start_date);
                } catch {}
              } catch {
                setProgramError("Failed to update start date. Please try again.");
              }
            }}
            startDate={startDate}
          />
        )}

        {assessmentApproved && programApproved && programId && program ? (
          <div className="bg-white rounded-lg shadow-md p-6 mt-8">
            {isScheduleComplete(program, lastScheduledAt) ? (
              <>
                <h2 className="text-2xl font-semibold mb-2">Your Schedule</h2>
                <ProgramCalendar program={program} programId={programId} />
              </>
            ) : (
              <>
                <h2 className="text-2xl font-semibold mb-2">Schedule Your Sessions</h2>
                <p className="text-gray-700 mb-4">Generate start times for each session to add them to your calendar.</p>
                <button onClick={handleGenerateSchedule} disabled={isScheduling} className="btn-primary">
                  {isScheduling ? 'Scheduling…' : 'Generate Schedule'}
                </button>
                {scheduleMessage ? <div className="mt-2 text-sm text-gray-700">{scheduleMessage}</div> : null}
              </>
            )}
          </div>
        ) : null}
      </div>
    </ProtectedRoute>
  );
}
