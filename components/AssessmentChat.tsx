import React, { useState } from "react";
// No longer need useEffect if the initial message effect is removed
// import { useEffect } from "react";

interface AssessmentChatProps {
  initialAssessment: string;
  surveyResponses: Record<string, unknown>; // Keep if the API still needs it for context
  userId: string; // Keep if the API still needs it
  onAssessmentUpdate?: (newAssessment: string) => void; // Callback to update parent's assessment
}

// No longer needed as we don't display chat messages
// interface ChatMessage {
//   sender: "user" | "ai";
//   text: string;
// }

export default function AssessmentChat({
  initialAssessment,
  surveyResponses, // Kept as it's sent to the API
  userId,          // Kept as it's sent to the API
  onAssessmentUpdate
}: AssessmentChatProps) {

  // --- State Declarations ---
  // Remove the messages state as we don't display history
  // const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Keep currentAssessment state to send the latest version back to the API
  const [currentAssessment, setCurrentAssessment] = useState(initialAssessment);


  // Remove the useEffect that added the initial message to chat history
  // useEffect(() => {
  //   if (initialAssessment && messages.length === 0) {
  //     setMessages([{ sender: "ai", text: initialAssessment }]);
  //   }
  // }, [initialAssessment, messages.length]);


  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const feedback = input.trim();

    // --- Remove usage of setMessages ---
    // setMessages((msgs) => [...msgs, { sender: "user", text: feedback }]);

    setInput(""); // Clear input field after sending
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/assessment/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentAssessment, // Send the current version of the assessment
          feedback,          // Send the user's feedback
          surveyResponses,   // Send original survey context
          userId             // Send user ID
        })
      });

      if (!res.ok) {
         const errorData = await res.json().catch(() => ({})); // Attempt to parse error body
         throw new Error(errorData.error || `Failed to revise assessment: ${res.status}`); // Include status
      }

      const data = await res.json();
      const revisedAssessment = data.assessment; // Assuming the response contains { assessment: "..." }

      // --- Remove usage of setMessages ---
      // Add the AI response message
      // setMessages((msgs) => [...msgs, { sender: "ai", text: revisedAssessment }]);

      // Update the current assessment state within this component
      setCurrentAssessment(revisedAssessment);

      // Call the optional parent callback to update the assessment in the parent component
      onAssessmentUpdate?.(revisedAssessment);

      // Optional: Maybe provide a success message briefly?
      // console.log("Assessment updated successfully!");


    } catch (err: unknown) { // Catch error object to log it
       console.error("Assessment feedback failed:", err); // Log the error
       setError(`Failed to update assessment: ${err instanceof Error ? err.message : 'Unknown error'}`); // Display more info if available
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded bg-white p-4">
      <div className="mb-2 font-semibold">Assessment Feedback</div>
      {/* Show the current assessment text for user context */}
      <div className="mb-4 text-gray-800" data-testid="assessment-text">
        {currentAssessment}
      </div>
      {/* Error display */}
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          className="flex-1 border rounded px-2 py-1"
          placeholder={loading ? "Sending feedback..." : "Suggest a change or give feedback..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          className="btn-primary disabled:opacity-50"
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
}