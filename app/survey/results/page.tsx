"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSurveyResponse } from "@/utils/surveyResponses";
import intakeSurveySchema from "../intake-survey-questions.json";

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
        const { data, error } = await getSurveyResponse(user.id);
        
        if (error) {
          console.error("Error fetching survey response:", error);
          setError("Failed to fetch survey response. Please try again.");
        } else {
          setResponse(data && data.length > 0 ? data[0].response : null);
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
    return <div className="flex min-h-screen items-center justify-center text-gray-500">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!response) {
    return <div className="text-gray-500">No survey response found.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Survey Results</h1>
      {!isComplete && (
        <div className="mb-4 text-yellow-600">Survey is incomplete.</div>
      )}
      <div className="space-y-4">
        {Object.entries(intakeSurveySchema.properties).map(([key, config]: [string, any]) => (
          <div key={key}>
            <span className="font-medium">{config.title}:</span>{" "}
            {formatAnswer(key, response[key], intakeSurveySchema.properties)}
          </div>
        ))}
      </div>
      <div className="mt-8">
        <button
          className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700"
          onClick={() => router.push("/survey")}
        >
          Edit Survey
        </button>
      </div>
    </div>
  );
};

export default SurveyResultsPage;
