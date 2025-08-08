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

/**
 * Returns a prompt for the LLM to REVISE an existing exercise program based on user feedback.
 * Keeps the same JSON schema as buildProgramPrompt.
 * @param currentProgram - Current program JSON object
 * @param feedback - User feedback describing desired changes
 * @param availableExercises - Array of exercises to include (with IDs)
 * @param assessment - Optional assessment context to keep alignment with goals
 */
export function buildProgramRevisionPrompt(
  currentProgram: any,
  feedback: string,
  availableExercises: Exercise[],
  assessment?: string
): string {
  const exerciseList = availableExercises
    .map((ex) => `ID: ${ex.exercise_id} | Name: ${ex.name}`)
    .join("\n");

  const assessmentBlock = assessment
    ? `\nOPTIONAL USER ASSESSMENT (for context):\n${assessment}\n`
    : "";

  const currentProgramJson = JSON.stringify(currentProgram);

  return `
You are an expert fitness coach. Your task is to revise the user's existing multi-week exercise program according to their feedback.

${assessmentBlock}

CURRENT PROGRAM (JSON):
${currentProgramJson}

USER FEEDBACK:
${feedback}

AVAILABLE EXERCISES (use ONLY these by ID):
${exerciseList}

REVISION INSTRUCTIONS:
- Make targeted changes that address the user's feedback while preserving the overall structure when possible.
- You may modify weeks, sessions, exercises, sets/reps, and notes as needed.
- Use only exercises from the AVAILABLE EXERCISES list above (by ID). Do NOT invent exercise IDs.
- Output a valid JSON object with the exact schema below and nothing else:
{
  "weeks": [
    {
      "week": <number>,
      "sessions": [
        {
          "session": <number>,
          "goal": <string>,
          "exercises": [
            { "exercise_id": <string>, "sets": <number>, "reps": <number>, "notes": <string> }
          ]
        }
      ]
    }
  ]
}
- Be concise but specific in notes.
- Output ONLY the JSON, no extra commentary.
`;
}
