"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSurveyResponse } from "@/utils/surveyResponses";
import intakeSurveySchema from "../intake-survey-questions.json";

function formatAnswer(key: string, value: any, schema: any): React.ReactNode {
  if (schema[key]?.enum) {
    const label = schema[key].enumNames?.[schema[key].enum.indexOf(value)] ?? value;
    return <span>{label}</span>;
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
