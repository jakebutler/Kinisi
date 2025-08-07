// utils/validateProgramOutput.ts
import { ExerciseProgramPayload } from "./types/programTypes";

/**
 * Validates that the LLM output matches the ExerciseProgramPayload schema.
 * Returns { valid: boolean, error?: string }
 */
export function validateProgramOutput(output: any): { valid: boolean; error?: string } {
  if (!output || typeof output !== "object" || !Array.isArray(output.weeks)) {
    return { valid: false, error: "Missing or invalid 'weeks' array" };
  }
  for (const week of output.weeks) {
    if (typeof week.week !== "number" || !Array.isArray(week.sessions)) {
      return { valid: false, error: "Each week must have a number 'week' and array 'sessions'" };
    }
    for (const session of week.sessions) {
      if (typeof session.session !== "number" || typeof session.goal !== "string" || !Array.isArray(session.exercises)) {
        return { valid: false, error: "Each session must have a number 'session', string 'goal', and array 'exercises'" };
      }
      for (const ex of session.exercises) {
        if (
          typeof ex.exercise_id !== "string" ||
          typeof ex.sets !== "number" ||
          typeof ex.reps !== "number" ||
          (ex.notes && typeof ex.notes !== "string")
        ) {
          return { valid: false, error: "Each exercise must have string 'exercise_id', number 'sets', number 'reps', and optional string 'notes'" };
        }
      }
    }
  }
  return { valid: true };
}
