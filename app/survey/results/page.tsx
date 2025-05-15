"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSurveyResponse } from "../../../utils/surveyResponses";
import { getLatestAssessment, generateAndStoreAssessment } from "../../../utils/assessments";
import AssessmentChat from "../../../components/AssessmentChat";
import intakeSurveySchema from "../intake-survey-questions.json";
import { supabase } from "../../../utils/supabaseClient";

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

const SurveyResultsPage = () => {
  const [response, setResponse] = useState<any>(null);
  const [assessment, setAssessment] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      setAuthLoading(true);
      try {
        const { data: { user } } = await import("@/utils/supabaseClient").then(m => m.supabase.auth.getUser());
        
        if (!user) {
          router.replace("/login?redirectedFrom=survey");
          return;
        }
        
        setUser(user);
        
        // Only fetch survey data if we have a valid user
        setLoading(true);
        setError(null);
        
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
        setAuthLoading(false);
      }
    };
    
    checkAuthAndFetchData();
  }, [router]);

  const isComplete = response &&
    intakeSurveySchema.required.every((key: string) => response[key] !== undefined && response[key] !== "");

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading your results...</div>
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
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
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
              {Object.entries(intakeSurveySchema.properties).map(([key, config]: [string, any]) => (
                <div key={key} className="border-b pb-2">
                  <span className="font-medium">{config.title}:</span>{" "}
                  <span className="text-gray-700">
                    {formatAnswer(key, response[key], intakeSurveySchema.properties)}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="mt-6">
              <button
                className="bg-blue-600 text-white px-4 py-2 text-sm rounded hover:bg-blue-700"
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
                ) : (
                  <AssessmentChat 
                    initialAssessment={assessment} 
                    surveyResponses={response} 
                    userId={user.id}
                    onAssessmentUpdate={(newAssessment: string) => setAssessment(newAssessment)}
                  />
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">Generating your personalized assessment...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SurveyResultsPage;
