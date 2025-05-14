"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSurveyResponse } from "@/utils/surveyResponses";
import intakeSurveySchema from "../intake-survey-questions.json";
import { useAuth } from "@/components/context/AuthContext";
import AssessmentChat from "@/components/AssessmentChat";

// Helper function remains outside the component
function formatAnswer(key: string, value: any, schema: any, parentResponse?: any): React.ReactNode {
  // Special handling for pain question
  if (key === "currentPain" && typeof value === "object" && value !== null) {
    const hasPain = value.hasPain;
    return (
      <div>
        {/* Only show response for hasPain, no label */}
        <div className="ml-2 text-gray-800 font-semibold">{hasPain ? "Yes" : "No"}</div>
        {/* Only show description if hasPain is true */}
        {hasPain && (
          <div className="mt-2">
            <span className="font-semibold">Description of pain:</span>{" "}
            {value.description && value.description.trim() !== "" ? value.description : <em>No answer provided</em>}
          </div>
        )}
      </div>
    );
  }

  // Special handling for otherActivityPreferences
  if (key === "otherActivityPreferences") {
    // Only show if 'Other' is selected in activityPreferences
    const parent = parentResponse?.activityPreferences;
    if (!Array.isArray(parent) || !parent.includes("Other")) return null;
    return (
      <div>
        {value && value.trim() !== ""
          ? value
          : <em>No answer provided</em>}
      </div>
    );
  }

  // Special handling for otherEquipmentAccess
  if (key === "otherEquipmentAccess") {
    const parent = parentResponse?.equipmentAccess;
    if (!Array.isArray(parent) || !parent.includes("Other")) return null;
    return (
      <div>
        {value && value.trim() !== ""
          ? value
          : <em>No answer provided</em>}
      </div>
    );
  }

  // Special handling for timeCommitment subfields
  if (key === "timeCommitment" && typeof value === "object" && value !== null) {
    return (
      <ul className="ml-4 list-disc">
        {value.daysPerWeek !== undefined && (
          <li><strong>Days per week:</strong> {value.daysPerWeek}</li>
        )}
        {value.minutesPerSession !== undefined && (
          <li><strong>Minutes per session:</strong> {value.minutesPerSession}</li>
        )}
        {value.preferredTimeOfDay !== undefined && (
          <li><strong>Preferred time of day:</strong> {value.preferredTimeOfDay}</li>
        )}
      </ul>
    );
  }

  // Handle nested objects, arrays, and enums
  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : <em>None</em>;
  }
  if (typeof value === "object" && value !== null) {
    return (
      <ul className="ml-4 list-disc">
        {Object.entries(value).map(([k, v]) => (
          <li key={k}>
            <strong>{schema?.properties?.[k]?.title || k}:</strong> {formatAnswer(k, v, schema?.properties?.[k] || {}, value)}
          </li>
        ))}
      </ul>
    );
  }
  if (value === undefined || value === "") return <em>None</em>;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return value;
}

export default function SurveyResultsPage() {
  // --- All Hooks called unconditionally at the top ---
  const { user, loading: authLoading } = useAuth(); // useContext (implicit)
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter(); // useContext (implicit)

  // Assessment state - MOVED HERE
  const [assessment, setAssessment] = useState<string | null>(null);
  const [assessmentLoading, setAssessmentLoading] = useState(false);
  const [assessmentError, setAssessmentError] = useState<string | null>(null);

  // Effect to fetch initial survey response
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await getSurveyResponse(user.id);
      if (error) setError("Failed to fetch survey response.");
      setResponse(data && data.length > 0 ? data[0].response : null);
      setLoading(false);
    };
    fetchData();
  }, [user, authLoading, router]);

  // Effect to fetch assessment - MOVED HERE
  useEffect(() => {
    // This effect should only run after the initial response is loaded and complete
    if (!response || !user) return; // Dependency on 'response' here is key
    // Check if response is complete only IF it has been loaded
    const isComplete = intakeSurveySchema.required.every((key: string) => response[key] !== undefined && response[key] !== "");
    if (!isComplete) return; // Don't fetch assessment if survey isn't complete yet

    // Add checks to prevent refetching if assessment is already loaded/failed
    if (assessment !== null || assessmentError !== null || assessmentLoading) return;


    const fetchAssessment = async () => {
      setAssessmentLoading(true);
      setAssessmentError(null);
      try {
        const res = await fetch("/api/assessment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ surveyResponses: response, userId: user.id }) // Use the fetched 'response' state
        });
        if (!res.ok) throw new Error("Failed to fetch assessment");
        const data = await res.json();
        setAssessment(data.assessment || null);
      } catch (err) {
        console.error("Failed to fetch assessment:", err); // Log the actual error for debugging
        setAssessmentError("Failed to generate assessment.");
      } finally {
        setAssessmentLoading(false);
      }
    };
    fetchAssessment();
    // Dependencies for this effect:
    // - response: Triggers when the initial survey response is fetched and set.
    // - user: Ensures we have the user ID.
    // - assessment, assessmentError, assessmentLoading: Added to the dependency array to make the conditional return checks inside the effect reliable.
  }, [response, user, assessment, assessmentError, assessmentLoading]); // Added assessment state vars to deps


  // Derived state - calculate isComplete AFTER response is loaded
  const isComplete = response &&
    intakeSurveySchema.required.every((key: string) => response[key] !== undefined && response[key] !== "");


  // --- Conditional Rendering / Early Returns (Now placed AFTER all Hooks) ---
  if (loading || authLoading) {
    return <div className="flex min-h-screen items-center justify-center text-gray-500">Loading...</div>;
  }
  if (error) {
    return <div className="text-red-600 p-4">{error}</div>;
  }

  // Check isComplete AFTER loading/error checks
  if (!isComplete) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">Intake Survey Results</h1>
        <div className="mb-6 text-gray-700">You have not completed the intake survey yet.</div>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={() => router.push("/survey")}
        >
          Start Survey
        </button>
      </div>
    );
  }

  // --- Main Render (Reached only if loading/error/not complete checks pass) ---
  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">Intake Survey Results</h1>
      <div className="mb-6 text-green-700 font-semibold">Survey Complete</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Raw Survey Responses */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Your Survey Answers</h2>
          <div className="space-y-4">
            {/* Pain question (Q2) special handling */}
            {/* Added null check for intakeSurveySchema.properties */}
            {intakeSurveySchema.properties?.currentPain && (
              <div className="border-b pb-3">
                <div className="font-semibold">{intakeSurveySchema.properties.currentPain.title}</div>
                {formatAnswer('currentPain', response?.currentPain, intakeSurveySchema.properties.currentPain)} {/* Added optional chaining */}
              </div>
            )}
             {/* Added null check for intakeSurveySchema.properties */}
            {intakeSurveySchema.properties && Object.entries(intakeSurveySchema.properties).map(([key, schema]: [string, any]) => {
              // Added optional chaining to response access within map
              if (key === 'currentPain') return null; // Already handled above
              if (key === 'otherActivityPreferences') {
                 // Added optional chaining
                if (!Array.isArray(response?.activityPreferences) || !response?.activityPreferences.includes('Other')) return null;
                return (
                  <div key={key} className="border-b pb-3">
                    <div className="font-semibold">{schema.title || key}</div>
                    <div className="ml-2 text-gray-800">{formatAnswer(key, response?.[key], schema, response)}</div> {/* Added optional chaining */}
                  </div>
                );
              }
              if (key === 'otherEquipmentAccess') {
                 // Added optional chaining
                if (!Array.isArray(response?.equipmentAccess) || !response?.equipmentAccess.includes('Other')) return null;
                return (
                  <div key={key} className="border-b pb-3">
                    <div className="font-semibold">{schema.title || key}</div>
                    <div className="ml-2 text-gray-800">{formatAnswer(key, response?.[key], schema, response)}</div> {/* Added optional chaining */}
                  </div>
                );
              }
              if (key === 'timeCommitment') {
                return (
                  <div key={key} className="border-b pb-3">
                    <div className="font-semibold">{schema.title || key}</div>
                    <div className="ml-2 text-gray-800">{formatAnswer(key, response?.[key], schema)}</div> {/* Added optional chaining */}
                  </div>
                );
              }
              // Default render for all other questions
              return (
                <div key={key} className="border-b pb-3">
                  <div className="font-semibold">{schema.title || key}</div>
                  <div className="ml-2 text-gray-800">{formatAnswer(key, response?.[key], schema, response)}</div> {/* Added optional chaining */}
                </div>
              );
            })}
          </div>
        </div>
        {/* AI-Generated Assessment */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Personalized Assessment <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">AI-generated</span></h2>
          <div className="min-h-[120px] p-4 border rounded bg-gray-50 mb-4">
            {assessmentLoading && <div className="text-gray-400">Generating assessment...</div>}
            {assessmentError && <div className="text-red-600">{assessmentError}</div>}
            {!assessmentLoading && !assessmentError && (
              <div className="whitespace-pre-line text-gray-900">{assessment || <em>No assessment available.</em>}</div>
            )}
          </div>
          {/* Assessment Feedback Chat */}
          {!assessmentLoading && !assessmentError && assessment && user && (
            <AssessmentChat
              initialAssessment={assessment}
              surveyResponses={response}
              userId={user.id}
              onAssessmentUpdate={setAssessment}
            />
          )}
        </div>
      </div>
      <div className="mt-8 flex justify-end">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={() => router.push("/survey")}
        >
          Edit Survey
        </button>
      </div>
    </div>
  );
}