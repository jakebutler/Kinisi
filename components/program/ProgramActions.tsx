/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function ProgramActions({ programId, status }: { programId: string; status?: string }) {
  const router = useRouter();
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState<"idle" | "feedback" | "revise" | "approve" | "schedule">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // If navigated with #feedback, ensure the section is scrolled into view
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#feedback') {
      const el = document.getElementById('feedback');
      if (el) {
        // Delay to ensure layout is ready
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
      }
    }
  }, []);

  async function postJson(url: string, body: any, method: string = "POST") {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {})
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error || `Request failed (${res.status})`);
    }
    return data;
  }

  const onSubmitFeedback = async () => {
    setMessage(null);
    setLoading("feedback");
    try {
      if (!feedback.trim()) throw new Error("Please enter feedback first.");
      await postJson(`/api/program/${programId}/feedback`, { feedback });
      setMessage("Feedback submitted. Thank you!");
      setFeedback("");
    } catch (e: any) {
      setMessage(e.message || "Failed to submit feedback");
    } finally {
      setLoading("idle");
    }
  };

  const onRevise = async () => {
    setMessage(null);
    setLoading("revise");
    try {
      if (!feedback.trim()) throw new Error("Please enter feedback to guide the revision.");
      await postJson(`/api/program/${programId}/revise`, { feedback });
      setMessage("Program revised. Reloading...");
      startTransition(() => router.refresh());
    } catch (e: any) {
      setMessage(e.message || "Failed to revise program");
    } finally {
      setLoading("idle");
    }
  };

  const onApprove = async () => {
    setMessage(null);
    setLoading("approve");
    try {
      await postJson(`/api/program/${programId}/approve`, {});
      setMessage("Program approved.");
      startTransition(() => router.refresh());
    } catch (e: any) {
      setMessage(e.message || "Failed to approve program");
    } finally {
      setLoading("idle");
    }
  };

  const onGenerateSchedule = async () => {
    setMessage(null);
    setLoading("schedule");
    try {
      await postJson(`/api/program/${programId}/schedule`, {});
      setMessage("Schedule generated.");
      startTransition(() => router.refresh());
    } catch (e: any) {
      setMessage(e.message || "Failed to generate schedule");
    } finally {
      setLoading("idle");
    }
  };

  const onViewCalendar = () => {
    startTransition(() => router.push(`/program/${programId}/calendar`));
  };

  const disabled = loading !== "idle" || isPending;

  return (
    <div id="feedback" className="mt-6 border-t pt-4">
      <h2 className="text-lg font-semibold mb-3">Program Feedback & Actions</h2>
      <div className="space-y-3">
        <textarea
          className="w-full border rounded p-2 text-sm"
          rows={4}
          placeholder="Share feedback about the program (e.g., swap certain exercises, adjust volume, target areas, schedule constraints)"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onGenerateSchedule}
            disabled={disabled}
            className={`px-4 py-2 rounded text-white disabled:opacity-50 ${disabled ? "bg-gray-400" : "btn-gradient"}`}
            title="Generate a schedule with start times for each session"
          >
            {loading === "schedule" ? "Scheduling..." : "Generate Schedule"}
          </button>
          <button
            onClick={onViewCalendar}
            disabled={isPending}
            className={`px-4 py-2 rounded text-white disabled:opacity-50 ${isPending ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"}`}
            title="View your scheduled sessions on the calendar"
          >
            View Calendar
          </button>
          <button
            onClick={onSubmitFeedback}
            disabled={disabled}
            className={`px-4 py-2 rounded text-white disabled:opacity-50 ${disabled ? "bg-gray-400" : "btn-gradient"}`}
          >
            {loading === "feedback" ? "Submitting..." : "Submit Feedback"}
          </button>
          <button
            onClick={onRevise}
            disabled={disabled}
            className={`px-4 py-2 rounded text-white disabled:opacity-50 ${disabled ? "bg-gray-400" : "btn-gradient"}`}
          >
            {loading === "revise" ? "Revising..." : "Revise Program"}
          </button>
          <button
            onClick={onApprove}
            disabled={disabled || status === "approved"}
            className={`px-4 py-2 rounded text-white disabled:opacity-50 ${disabled || status === "approved" ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"}`}
            title={status === "approved" ? "Already approved" : "Approve the current program"}
          >
            {loading === "approve" ? "Approving..." : status === "approved" ? "Approved" : "Approve"}
          </button>
        </div>
        {message ? <div className="text-sm text-gray-700">{message}</div> : null}
      </div>
    </div>
  );
}
