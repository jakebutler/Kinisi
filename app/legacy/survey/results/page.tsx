"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSurveyResponse } from "../../../../utils/surveyResponses";
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
        /* cleaned: removed extraneous JSX message and redundant user check */
        
        try {
          // Fetch survey response
          const { data: surveyData, error: surveyError } = await getSurveyResponse(user.id);
          if (surveyError) throw surveyError;
          const surveyResponse = surveyData && surveyData.length > 0 ? surveyData[0] : null;
          setResponse(surveyResponse?.response || null);
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
          <button className="btn-primary" onClick={() => router.push('/survey')}>
            Take the Survey
          </button>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Your Responses</h2>
          <div className="space-y-4">
            {Object.entries(intakeSurveySchema.properties).map(([key, config]: [string, Record<string, unknown>]) => (
              <div key={key} className="border-b pb-2">
                <span className="font-medium">{String(config.title)}:</span>{" "}
                <span className="text-gray-700">{formatAnswer(key, response[key] as unknown, config)}</span>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <button className="btn-primary" onClick={() => router.push('/survey')}>
              Update Responses
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SurveyResultsPage;
