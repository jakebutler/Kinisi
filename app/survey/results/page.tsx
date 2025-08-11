"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSurveyResponse } from "../../../utils/surveyResponses";
import { getLatestAssessment, generateAndStoreAssessment } from "../../../utils/assessments";
import AssessmentChat from "../../../components/AssessmentChat";
import intakeSurveySchema from "../intake-survey-questions.json";

function formatAnswer(key: string, value: unknown, schema: Record<string, unknown>): React.ReactNode {
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
              return enumNames ? enumNames[idx] : v;
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

const SurveyResultsPage = () => {
  const [response, setResponse] = useState<Record<string, unknown> | null>(null);
  const [assessment, setAssessment] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await import("@/utils/supabaseClient").then(m => m.supabase.auth.getUser());
        
        if (!user) {
          router.replace("/login?redirectedFrom=survey");
          return;
        }
        
        setUser(user);
        
        <div>Can&apos;t find your survey data? Try refreshing the page or contact support.</div>
        setLoading(true);
        setError(null);
        
        if (!user) {
          return (
            <div className="flex items-center justify-center h-64">
              <span className="text-gray-500">User not found. Please log in again.</span>
            </div>
          );
        }
        
        try {
          // Fetch survey response
          const { data: surveyData, error: surveyError } = await getSurveyResponse(user.id);
          
          if (surveyError) throw surveyError;
          
          const surveyResponse = surveyData && surveyData.length > 0 ? surveyData[0] : null;
          setResponse(surveyResponse?.response || null);
          
          // Fetch or generate assessment
          if (surveyResponse) {
            const { data: assessmentData, error: assessmentError } = await getLatestAssessment(user.id);
            
            if (assessmentError || !assessmentData) {
              // If no assessment exists, generate one
                setIsGenerating(true);
              const { data: newAssessment } = await generateAndStoreAssessment(
                user.id, 
                surveyResponse.response
              );
              setAssessment(newAssessment?.assessment || null);
              setIsGenerating(false);
            } else {
              setAssessment(assessmentData.assessment);
            }
          }
        } catch (error) {
          console.error("Error fetching data:", error);
          setError("Failed to load survey data. Please try again.");
        }
      } catch (err) {
        console.error("Auth error:", err);
        setError("An authentication error occurred. Please log in again.");
        router.replace("/login?error=auth");
      } finally {
        setLoading(false);
      }
    };
    
    checkAuthAndFetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-gray-500">Loading...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      <h1 className="text-3xl font-bold">Your Survey Results</h1>
      
      {!response ? (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">No survey responses found.</p>
          <button
            className="btn-gradient text-white px-4 py-2 rounded"
            onClick={() => router.push('/survey')}
          >
            Take the Survey
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Survey Responses Section */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Your Responses</h2>
            <div className="space-y-4">
              {Object.entries(intakeSurveySchema.properties).map(([key, config]: [string, Record<string, unknown>]) => (
                <div key={key} className="border-b pb-2">
                  <span className="font-medium">{String(config.title)}:</span>{" "}
                  <span className="text-gray-700">
                    {formatAnswer(key, response[key] as unknown, intakeSurveySchema.properties)}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="mt-6">
              <button
                className="btn-gradient text-white px-4 py-2 text-sm rounded"
                onClick={() => router.push("/survey")}
              >
                Edit Survey
              </button>
            </div>
          </div>
          
          {/* Personalized Assessment Section */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Personalized Assessment</h2>
            {assessment ? (
              <div className="prose max-w-none">
                <div className="whitespace-pre-line mb-4">{assessment}</div>
                {isGenerating ? (
                  <div className="text-center py-4">
                    <p className="text-gray-600">Generating your assessment...</p>
                  </div>
                ) : user ? (
                  <AssessmentChat
                    initialAssessment={assessment}
                    surveyResponses={response}
                    userId={user.id}
                    onAssessmentUpdate={(newAssessment: string) => setAssessment(newAssessment)}
                  />
                ) : null}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">Generating your personalized assessment...</p>
              </div>
            )}
            {/* Approve Assessment Button - always outside assessment feedback box */}
            {user && assessment && (
              <div className="mt-6 flex justify-end">
                <button
                  className={`bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed`}
                  onClick={async () => {
                    setIsGenerating(true);
                    setError(null);
                    try {
                      const res = await fetch("/api/assessment/approve", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userId: user.id }),
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error || "Failed to approve assessment");
                      router.push("/dashboard");
                      // Redirect to dashboard after approval
                    } catch (err: unknown) {
                      if (err instanceof Error) {
                        setError(err.message || "Failed to approve assessment");
                      } else {
                        setError("Failed to approve assessment");
                      }
                    } finally {
                      setIsGenerating(false);
                    }
                  }}
                  disabled={isGenerating}
                >
                  {isGenerating ? "Approving..." : "Approve Assessment"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SurveyResultsPage;
