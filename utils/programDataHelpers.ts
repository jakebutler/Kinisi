// utils/programDataHelpers.ts
import { supabase } from "./supabaseClient";
import { Exercise } from "./types/programTypes";

// Save a new program to Supabase
type NewProgram = {
  user_id: string;
  program_json: any;
  status?: string;
};
export async function saveExerciseProgram(program: NewProgram) {
  const { data, error } = await supabase.from("exercise_programs").insert([program]).select();
  if (error) throw new Error(error.message);
  return data?.[0];
}

// Fetch a program by user ID (gets the latest program for a user)
export async function getProgramByUserId(userId: string) {
  const { data: program, error: programError } = await supabase
    .from("exercise_programs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  
  if (programError && programError.code === 'PGRST116') return null;
  if (programError) throw new Error(programError.message);
  if (!program) return null;

  return await getProgramById(program.id);
}

// Fetch a program by ID
export async function getProgramById(id: string) {
  // 1. Fetch the program
  const { data: program, error: programError } = await supabase
    .from("exercise_programs")
    .select("*")
    .eq("id", id)
    .single();
  
  if (programError && programError.code === 'PGRST116') return null;
  if (programError) throw new Error(programError.message);
  if (!program) return null;

  // 2. Fetch all sessions for this program
  const { data: sessions, error: sessionsError } = await supabase
    .from("sessions")
    .select("*")
    .eq("program_id", id);
  if (sessionsError) throw new Error(sessionsError.message);

  // 3. Fetch all session_exercises for these sessions
  const sessionIds = sessions.map((s: any) => s.id);
  let sessionExercises: any[] = [];
  if (sessionIds.length > 0) {
    const { data: exercises, error: exercisesError } = await supabase
      .from("session_exercises")
      .select("*")
      .in("session_id", sessionIds);
    if (exercisesError) throw new Error(exercisesError.message);
    sessionExercises = exercises;
  }

  // 4. Attach session_exercises to their sessions
  const sessionsWithExercises = sessions.map((session: any) => ({
    ...session,
    session_exercises: sessionExercises.filter(se => se.session_id === session.id)
  }));

  // 5. Return a combined object
  return {
    ...program,
    sessions: sessionsWithExercises
  };
}

// Save feedback for a program or session
export async function saveProgramFeedback({
  program_id,
  session_id,
  user_id,
  feedback,
  revision
}: {
  program_id: string;
  session_id?: string;
  user_id: string;
  feedback: string;
  revision?: number;
}) {
  const payload: Record<string, any> = {
    program_id,
    session_id,
    user_id,
    feedback,
    revision: typeof revision === 'number' ? revision : 1,
  };
  const { data, error } = await supabase
    .from("program_feedback")
    .insert([payload])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Approve a program (set status to 'approved')
export async function approveProgram(id: string) {
  const { data, error } = await supabase.from("exercise_programs").update({ status: "approved" }).eq("id", id).select();
  if (error) throw new Error(error.message);
  return data?.[0];
}

// Update a program's JSON (and optionally status)
export async function updateProgramJson(id: string, program_json: any, status?: string) {
  const update: Record<string, any> = { program_json };
  if (status) update.status = status;
  const { data, error } = await supabase
    .from("exercise_programs")
    .update(update)
    .eq("id", id)
    .select();
  if (error) throw new Error(error.message);
  return data?.[0];
}


/**
 * Fetch all exercises, or filter by muscle/equipment/etc.
 * @param filter Optional filter object (muscles, equipment, etc.)
 */
export async function getAvailableExercises(filter?: {
  primary_muscles?: string[];
  equipment?: string[];
}): Promise<Exercise[]> {
  let query = supabase.from("exercises").select("exercise_id, name, target_muscles, equipments");
  if (filter?.primary_muscles && filter.primary_muscles.length > 0) {
    // For backward compatibility, map primary_muscles to target_muscles
    query = query.in("target_muscles", filter.primary_muscles);
  }
  if (filter?.equipment && filter.equipment.length > 0) {
    query = query.overlaps("equipments", filter.equipment);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  // Normalize DB fields (target_muscles/equipments) to unified Exercise shape
  const normalized: Exercise[] = (data || []).map((row: any) => ({
    exercise_id: row.exercise_id,
    name: row.name,
    primary_muscles: row.target_muscles,
    equipment: row.equipments,
  }));
  return normalized;
}

/**
 * Fetch exercise names for a set of exercise IDs.
 * Returns a map of exercise_id -> name.
 */
export async function getExerciseNamesByIds(ids: string[]): Promise<Record<string, string>> {
  const unique = Array.from(new Set((ids || []).filter(Boolean)));
  if (unique.length === 0) return {};
  const { data, error } = await supabase
    .from("exercises")
    .select("exercise_id, name")
    .in("exercise_id", unique);
  if (error) throw new Error(error.message);
  const map: Record<string, string> = {};
  for (const row of data || []) {
    map[row.exercise_id] = row.name;
  }
  return map;
}
