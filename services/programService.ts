import { buildProgramPrompt } from '@/utils/programPromptTemplate';
import { Exercise, ExerciseProgramPayload } from '@/utils/types/programTypes';
import { getAvailableExercises, saveExerciseProgram } from '@/utils/programDataHelpers';
import { callLLMWithPrompt } from '@/utils/llm';
import { ProgramJson } from '@/types/fitness/Program';
import { SupabaseClient } from '@supabase/supabase-js';

export interface ProgramGenerationOptions {
  assessment: string;
  exerciseFilter: Record<string, unknown>;
  userId: string;
  client?: SupabaseClient;
}

export interface ProgramGenerationResult {
  program: ExerciseProgramPayload;
  savedProgram: any; // TODO: Add proper type from database
}

export class ProgramService {
  /**
   * Generates a new exercise program based on assessment
   */
  static async generateProgram(options: ProgramGenerationOptions): Promise<ProgramGenerationResult> {
    const { assessment, exerciseFilter, userId, client } = options;

    // Validate input
    if (!assessment || typeof assessment !== 'string') {
      throw new Error('Assessment is required and must be a string');
    }

    if (!exerciseFilter || typeof exerciseFilter !== 'object') {
      throw new Error('ExerciseFilter is required and must be an object');
    }

    // Fetch available exercises
    const exercises: Exercise[] = await getAvailableExercises(exerciseFilter, client);
    if (!Array.isArray(exercises) || exercises.length === 0) {
      throw new Error('No available exercises found for the given filter');
    }

    // Build LLM prompt
    const prompt = buildProgramPrompt(assessment, exercises);

    // Call LLM service
    const llmResponse: ExerciseProgramPayload = await callLLMWithPrompt(prompt);

    // Validate LLM output
    const { validateProgramOutput } = await import('@/utils/validateProgramOutput');
    const validation = validateProgramOutput(llmResponse);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid LLM output');
    }

    // Convert to ProgramJson format for database storage
    const programJson: ProgramJson = {
      weeks: llmResponse.weeks.map((week: any) => ({
        weekNumber: week.week,
        goal: week.sessions[0]?.goal || `Week ${week.week}`,
        sessions: week.sessions.map((session: any) => ({
          id: session.uid,
          name: session.session.toString(),
          goal: session.goal,
          exercises: session.exercises.map((exercise: any) => ({
            id: exercise.exercise_id,
            name: exercise.exercise_id,
            sets: exercise.sets,
            reps: exercise.reps?.toString(),
            targetMuscles: [],
            instructions: exercise.notes || ''
          }))
        }))
      }))
    };

    // Save to database
    const savedProgram = await saveExerciseProgram({
      user_id: userId,
      program_json: programJson,
      status: 'draft'
    }, client);

    return {
      program: llmResponse,
      savedProgram
    };
  }

  /**
   * Revises an existing program based on feedback
   */
  static async reviseProgram(
    programId: string,
    feedback: string,
    exerciseFilter: Record<string, unknown>,
    client: SupabaseClient,
    assessment?: string
  ): Promise<ExerciseProgramPayload> {
    // Validate input
    if (!feedback || typeof feedback !== 'string') {
      throw new Error('Feedback is required and must be a string');
    }

    // Load current program
    const { getProgramById } = await import('@/utils/programDataHelpers');
    const program = await getProgramById(programId, client);
    if (!program || !program.program_json) {
      throw new Error('Program not found');
    }

    // Fetch available exercises
    const exercises: Exercise[] = await getAvailableExercises(exerciseFilter, client);
    if (!Array.isArray(exercises) || exercises.length === 0) {
      throw new Error('No available exercises found for the given filter');
    }

    // Build revision prompt
    const { buildProgramRevisionPrompt } = await import('@/utils/programPromptTemplate');
    const prompt = buildProgramRevisionPrompt(program.program_json, feedback, exercises, assessment);

    // Call LLM
    const revised: ExerciseProgramPayload = await callLLMWithPrompt(prompt);

    // Validate output
    const { validateProgramOutput } = await import('@/utils/validateProgramOutput');
    const validation = validateProgramOutput(revised);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid LLM output');
    }

    return revised;
  }

  /**
   * Converts ExerciseProgramPayload to ProgramJson format
   */
  static convertToProgramJson(payload: ExerciseProgramPayload): ProgramJson {
    return {
      weeks: payload.weeks.map((week: any) => ({
        weekNumber: week.week,
        goal: week.sessions[0]?.goal || `Week ${week.week}`,
        sessions: week.sessions.map((session: any) => ({
          id: session.uid,
          name: session.session.toString(),
          goal: session.goal,
          exercises: session.exercises.map((exercise: any) => ({
            id: exercise.exercise_id,
            name: exercise.exercise_id,
            sets: exercise.sets,
            reps: exercise.reps?.toString(),
            targetMuscles: [],
            instructions: exercise.notes || ''
          }))
        }))
      }))
    };
  }
}