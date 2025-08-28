"use client";

import { useState } from "react";

export default function StartDateControl({ programId, initialDate }: { programId: string; initialDate?: string }) {
  const [date, setDate] = useState<string>(initialDate || "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const onChange = async (next: string) => {
    setDate(next);
    setStatus("saving");
    setMessage(null);
    try {
      const res = await fetch(`/api/program/${programId}/start-date`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate: next })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to update start date");
      setStatus("saved");
      setMessage("Start date updated.");
      // Keep local date in sync in case backend normalizes
      if (typeof data?.start_date === "string") {
        setDate(data.start_date);
      }
      setTimeout(() => setStatus("idle"), 1200);
    } catch (e: any) {
      setStatus("error");
      setMessage(e?.message || "Failed to update start date");
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-gray-700 mb-1 font-medium">Program Start Date</label>
      <input
        type="date"
        value={date}
        onChange={(e) => onChange(e.target.value)}
        className="border rounded px-2 py-1"
        aria-label="Program start date"
      />
      <p className="text-xs text-gray-500 mt-1">
        Changing your start date will shift your schedule. Make sure this won’t conflict with your weekly routine.
      </p>
      {message ? (
        <div className={`text-sm mt-1 ${status === "error" ? "text-red-600" : "text-gray-700"}`}>{message}</div>
      ) : null}
    </div>
  );
}
