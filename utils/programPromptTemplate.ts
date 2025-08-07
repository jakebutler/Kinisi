// utils/programPromptTemplate.ts
// PromptLayer-compatible template and types for exercise program generation

import { Exercise, ExerciseProgramPayload } from "./types/programTypes";

/**
 * Returns a prompt for the LLM to generate a personalized exercise program.
 * @param assessment - User assessment/context string
 * @param availableExercises - Array of exercises to include (with IDs)
 */
export function buildProgramPrompt(
  assessment: string,
  availableExercises: Exercise[]
): string {
  // Show only relevant fields to keep prompt concise
  const exerciseList = availableExercises
    .map(
      (ex) =>
        `ID: ${ex.exercise_id} | Name: ${ex.name} | Muscles: ${ex.primary_muscles?.join(", ")} | Equipment: ${ex.equipment?.join(", ")}`
    )
    .join("\n");

  return `
You are an expert fitness coach. Your task is to generate a personalized multi-week exercise program for the user below.

USER ASSESSMENT:
${assessment}

AVAILABLE EXERCISES:
${exerciseList}

INSTRUCTIONS:
- Only use exercises from the AVAILABLE EXERCISES list above (by ID).
- Output a valid JSON object matching this schema:
{
  "weeks": [
    {
      "week": <number>,
      "sessions": [
        {
          "session": <number>,
          "goal": <string>,
          "exercises": [
            {
              "exercise_id": <string>,
              "sets": <number>,
              "reps": <number>,
              "notes": <string>
            }
          ]
        }
      ]
    }
  ]
}
- Each week should have 2-5 sessions, each with 2-6 exercises.
- Do NOT invent or hallucinate exercise IDs or fields.
- Be concise but specific in notes.
- Output ONLY the JSON, no extra text.
- If user data is insufficient, return a JSON error: {"error": "<reason>"}
`;
}
