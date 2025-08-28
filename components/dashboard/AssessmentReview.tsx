"use client";
import React, { useState } from "react";

interface AssessmentReviewProps {
  surveyResponse: Record<string, unknown> | null;
  assessment: string | null;
  loading: boolean;
  error?: string | null;
  onApprove: () => Promise<void> | void;
  onSubmitFeedback: (feedback: string) => Promise<void> | void;
  working?: boolean;
}

const AssessmentReview: React.FC<AssessmentReviewProps> = ({
  surveyResponse,
  assessment,
  loading,
  error,
  onApprove,
  onSubmitFeedback,
  working = false,
}) => {
  const [isRequestingChanges, setIsRequestingChanges] = useState(false);
  const [feedback, setFeedback] = useState("");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8" role="status" aria-live="polite">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-puce)]" aria-hidden="true"></div>
        <span className="ml-3 text-gray-600">Generating your personalized assessment...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">{error}</div>
    );
  }

  if (!surveyResponse) {
    return (
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
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {assessment ? (
        <>
          <div className="whitespace-pre-line text-gray-900">{assessment}</div>
          <div className="mt-6 flex flex-wrap gap-2">
            <button className="btn-primary" onClick={() => onApprove()} disabled={!!working}>
              {working ? "Approving…" : "Approve"}
            </button>
            <button
              className="btn-secondary"
              onClick={() => setIsRequestingChanges(true)}
              disabled={!!working}
            >
              Request Changes
            </button>
          </div>
          {isRequestingChanges && (
            <div className="mt-6">
              <label className="block text-sm font-medium mb-1">Describe what you'd like changed</label>
              <textarea
                className="w-full border rounded p-2 text-sm"
                rows={4}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Tell us what to adjust…"
              />
              <div className="mt-2 flex gap-2">
                <button
                  className="btn-primary"
                  onClick={() => feedback.trim() && onSubmitFeedback(feedback)}
                  disabled={!!working || !feedback.trim()}
                >
                  {working ? "Submitting…" : "Submit Request"}
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setIsRequestingChanges(false);
                    setFeedback("");
                  }}
                  disabled={!!working}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-gray-600">Generating your assessment…</div>
      )}
    </div>
  );
};

export default AssessmentReview;
