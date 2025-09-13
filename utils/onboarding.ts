// utils/onboarding.ts
import type { ExerciseProgramPayload } from "./types/programTypes";

/**
 * A program is considered scheduled when BOTH are true:
 * 1) A top-level start_date has been selected and saved (passed in as startDate)
 * 2) Every session in the program has a concrete datetime (start_at) scheduled
 */
export function isProgramScheduled(
  program?: ExerciseProgramPayload | null,
  startDate?: string | null
): boolean {
  if (!program || !Array.isArray(program.weeks)) return false;
  if (!startDate || typeof startDate !== "string" || startDate.trim().length === 0) return false;

  let totalSessions = 0;
  let sessionsWithStart = 0;

  for (const w of program.weeks) {
    if (!w || !Array.isArray(w.sessions)) continue;
    for (const s of w.sessions) {
      if (!s) continue;
      totalSessions += 1;
      if (typeof s.start_at === "string" && s.start_at.trim().length > 0) {
        sessionsWithStart += 1;
      }
    }
  }

  // If there are no sessions, consider not scheduled
  if (totalSessions === 0) return false;
  // All sessions must have a start_at
  return sessionsWithStart === totalSessions;
}

/**
 * Compute the current onboarding step for the minimal progress UI.
 * Steps:
 * 1 = complete intake survey
 * 2 = approve assessment
 * 3 = approve program
 * 4 = schedule sessions (or done displaying when onboardingComplete elsewhere)
 */
export function computeCurrentOnboardingStep(
  surveyCompleted: boolean,
  assessmentApproved: boolean,
  programApproved: boolean
): 1 | 2 | 3 | 4 {
  if (!surveyCompleted) return 1;
  if (!assessmentApproved) return 2;
  if (!programApproved) return 3;
  return 4;
}

/**
 * Relaxed schedule completion used for onboarding completion:
 * - Completed if ANY session in program_json has a non-empty start_at (preferred),
 *   otherwise if last_scheduled_at is set.
 * - start_date alone is NOT sufficient.
 */
export function isScheduleComplete(
  program?: ExerciseProgramPayload | null,
  lastScheduledAt?: string | null
): boolean {
  if (program && Array.isArray(program.weeks)) {
    for (const w of program.weeks) {
      if (!w || !Array.isArray(w.sessions)) continue;
      for (const s of w.sessions) {
        if (s && typeof s.start_at === "string" && s.start_at.trim().length > 0) {
          return true;
        }
      }
    }
  }
  return !!(lastScheduledAt && typeof lastScheduledAt === "string" && lastScheduledAt.trim().length > 0);
}

