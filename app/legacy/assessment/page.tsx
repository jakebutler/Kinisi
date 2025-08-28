"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";
import { getSurveyResponse } from "@/utils/surveyResponses";
import { getLatestAssessment, generateAndStoreAssessment } from "@/utils/assessments";
import AssessmentReview from "@/components/dashboard/AssessmentReview";

export default function AssessmentPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [surveyResponse, setSurveyResponse] = useState<Record<string, unknown> | null>(null);
  const [assessment, setAssessment] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isRequestingChanges, setIsRequestingChanges] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace("/login?redirectedFrom=assessment");
          return;
        }
        setUserId(user.id);

        // Load survey
        const { data: surveyData, error: surveyErr } = await getSurveyResponse(user.id);
        if (surveyErr) throw surveyErr;
        const sr = surveyData && surveyData.length > 0 ? surveyData[0]?.response : null;
        setSurveyResponse(sr || null);

        if (!sr) {
          setLoading(false);
          return;
        }

        // Load or generate assessment
        const { data: latest, error: latestErr } = await getLatestAssessment(user.id);
        if (latestErr || !latest) {
          const { data: gen, error: genErr } = await generateAndStoreAssessment(user.id, sr as any);
          if (genErr) throw genErr;
          setAssessment(gen?.assessment || null);
        } else {
          setAssessment(latest.assessment);
        }
      } catch (e) {
        console.error(e);
        setError("Failed to load assessment. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [router]);

  const handleApprove = async () => {
    if (!userId) return;
    setIsWorking(true);
    setError(null);
    try {
      const res = await fetch("/api/assessment/approve", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to approve assessment");
      router.push("/dashboard");
    } catch (e: any) {
      setError(e?.message || "Failed to approve assessment");
    } finally {
      setIsWorking(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!assessment || !surveyResponse || !feedback.trim()) return;
    setIsWorking(true);
    setError(null);
    try {
      const res = await fetch('/api/assessment/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentAssessment: assessment, feedback, surveyResponses: surveyResponse }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to submit feedback');
      if (data?.assessment) {
        setAssessment(data.assessment);
      }
      setFeedback("");
      setIsRequestingChanges(false);
    } catch (e: any) {
      setError(e?.message || 'Failed to submit feedback');
    } finally {
      setIsWorking(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow p-6">Loading…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">Personalized Assessment</h1>
      {!surveyResponse ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-6 text-center">
          <p className="text-yellow-800 mb-4">Complete your intake survey to view your assessment.</p>
          <button className="btn-primary" onClick={() => router.push('/survey')}>Go to Survey</button>
        </div>
      ) : (
        <AssessmentReview
          surveyResponse={surveyResponse}
          assessment={assessment}
          loading={loading}
          error={error}
          working={isWorking}
          onApprove={handleApprove}
          onSubmitFeedback={() => handleSubmitFeedback()}
        />
      )}
    </div>
  );
}
