"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSurveyResponse } from "@/utils/surveyResponses";
import intakeSurveySchema from "../intake-survey-questions.json";

function formatAnswer(key: string, value: any, schema: any): React.ReactNode {
  if (!value) return <span className="text-gray-400">Not answered</span>;

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return <span>{value}</span>;
}

const SurveyResultsPage = () => {
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      setAuthLoading(true);
      const { data: { user } } = await import("@/utils/supabaseClient").then(m => m.supabase.auth.getUser());
      setUser(user);
      setAuthLoading(false);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    // Only redirect if we're sure the user is not logged in
    if (!user && !authLoading) {
      router.replace("/login");
      return;
    }
    
    // Don't fetch data until auth is loaded
    if (authLoading) return;
    
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

  const summary = generateSummary();

  const [feedback, setFeedback] = useState('');
  const [showExerciseProgram, setShowExerciseProgram] = useState(false);
  const [exerciseProgram, setExerciseProgram] = useState<string | null>(null);

  const handleFeedbackSubmit = async () => {
    // Here we would integrate with an AI agent to update the summary
    // For now, we'll just acknowledge the feedback
    alert('Thank you for your feedback! Our AI agent will analyze this to improve your personalized program.');
    setFeedback('');
  };

  const generateExerciseProgram = async () => {
    setShowExerciseProgram(true);
    // Here we would call the AI agent to generate a custom program
    // For now, we'll show a placeholder
    setExerciseProgram(
      'Based on your survey responses, here is your customized exercise program:\n\n' +
      '1. Warm-up (10 minutes)\n' +
      '2. Main workout (30 minutes)\n' +
      '3. Cool-down (5 minutes)\n\n' +
      'Please consult with your healthcare provider before starting this program.'
    );
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Survey Results</h1>
      
      {/* Personalized Summary */}
      {summary && summary.length > 0 && (
        <div className="bg-blue-50 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Your Profile Summary</h2>
          <div className="space-y-2">
            {summary.map((item, index) => (
              <p key={index} className="text-gray-700">{item}</p>
            ))}
          </div>
        </div>
      )}

      {!isComplete && (
        <div className="mb-4 p-4 bg-yellow-50 text-yellow-800 rounded">
          Your survey is incomplete. Some recommendations may be limited.
        </div>
      )}

      {/* Detailed Responses */}
      <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
        <h2 className="text-xl font-semibold mb-4">Your Detailed Responses</h2>
        {Object.entries(intakeSurveySchema.properties).map(([key, config]: [string, any]) => (
          <div key={key} className="py-2 border-b last:border-b-0">
            <div className="font-medium text-gray-700 mb-1">{config.title}</div>
            <div className="text-gray-600">
              {formatAnswer(key, response[key], intakeSurveySchema.properties)}
            </div>
          </div>
        ))}
      </div>

      {/* Feedback Section */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Provide Feedback</h2>
        <div className="space-y-4">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="How can we improve your personalized summary? What additional information would be helpful?"
            className="w-full h-32 p-3 border rounded focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleFeedbackSubmit}
            disabled={!feedback.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 disabled:opacity-50"
          >
            Submit Feedback
          </button>
        </div>
      </div>

      {/* Exercise Program Section */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Custom Exercise Program</h2>
        {!showExerciseProgram ? (
          <button
            onClick={generateExerciseProgram}
            className="bg-green-600 text-white px-6 py-2 rounded shadow hover:bg-green-700"
          >
            Generate Exercise Program
          </button>
        ) : (
          <div className="prose max-w-none">
            <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded">
              {exerciseProgram}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default SurveyResultsPage;