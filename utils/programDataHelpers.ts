// utils/programDataHelpers.ts
import { supabase } from "./supabaseClient";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Exercise } from "./types/programTypes";

// Save a new program to Supabase
type NewProgram = {
  user_id: string;
  program_json: any;
  status?: string;
};
export async function saveExerciseProgram(program: NewProgram, client?: SupabaseClient) {
  const c = client ?? supabase;
  const { data, error } = await c.from("exercise_programs").insert([program]).select();
  if (error) throw new Error(error.message);
  return data?.[0];
}

// Fetch a program by user ID (gets the latest program for a user)
export async function getProgramByUserId(userId: string, client?: SupabaseClient) {
  const c = client ?? supabase;
  const { data: program, error: programError } = await c
    .from("exercise_programs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  
  if (programError && programError.code === 'PGRST116') return null;
  if (programError) throw new Error(programError.message);
  if (!program) return null;

  return await getProgramById(program.id, c);
}

// Fetch a program by ID
export async function getProgramById(id: string, client?: SupabaseClient) {
  const c = client ?? supabase;
  // 1. Fetch the program
  const { data: program, error: programError } = await c
    .from("exercise_programs")
    .select("*")
    .eq("id", id)
    .single();
  
  if (programError && programError.code === 'PGRST116') return null;
  if (programError) throw new Error(programError.message);
  if (!program) return null;

  // 2. Fetch all sessions for this program
  const { data: sessions, error: sessionsError } = await c
    .from("sessions")
    .select("*")
    .eq("program_id", id);
  if (sessionsError) throw new Error(sessionsError.message);

  // 3. Fetch all session_exercises for these sessions
  const sessionIds = sessions.map((s: any) => s.id);
  let sessionExercises: any[] = [];
  if (sessionIds.length > 0) {
    const { data: exercises, error: exercisesError } = await c
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
}, client?: SupabaseClient) {
  const c = client ?? supabase;
  const payload: Record<string, any> = {
    program_id,
    session_id,
    user_id,
    feedback,
    revision: typeof revision === 'number' ? revision : 1,
  };
  const { data, error } = await c
    .from("program_feedback")
    .insert([payload])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Approve a program (set status to 'approved')
export async function approveProgram(id: string, client?: SupabaseClient) {
  const c = client ?? supabase;
  const { data, error } = await c.from("exercise_programs").update({ status: "approved" }).eq("id", id).select();
  if (error) throw new Error(error.message);
  return data?.[0];
}

// Update a program's JSON (and optionally status)
export async function updateProgramJson(id: string, program_json: any, status?: string, client?: SupabaseClient) {
  const c = client ?? supabase;
  const update: Record<string, any> = { program_json };
  if (status) update.status = status;
  const { data, error } = await c
    .from("exercise_programs")
    .update(update)
    .eq("id", id)
    .select();
  if (error) throw new Error(error.message);
  return data?.[0];
}

// Update program fields including scheduling metadata
export async function updateProgramFields(
  id: string,
  fields: {
    program_json?: any;
    scheduling_preferences?: any;
    last_scheduled_at?: string; // ISO string
    status?: string;
  },
  client?: SupabaseClient
) {
  const c = client ?? supabase;
  const update: Record<string, any> = {};
  if (typeof fields.program_json !== 'undefined') update.program_json = fields.program_json;
  if (typeof fields.scheduling_preferences !== 'undefined') update.scheduling_preferences = fields.scheduling_preferences;
  if (typeof fields.last_scheduled_at !== 'undefined') update.last_scheduled_at = fields.last_scheduled_at;
  if (typeof fields.status !== 'undefined') update.status = fields.status;
  const { data, error } = await c
    .from("exercise_programs")
    .update(update)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}


/**
 * Fetch all exercises, or filter by muscle/equipment/etc.
 * @param filter Optional filter object (muscles, equipment, etc.)
 */
export async function getAvailableExercises(filter?: {
  primary_muscles?: string[];
  equipment?: string[];
}, client?: SupabaseClient): Promise<Exercise[]> {
  const c = client ?? supabase;
  let query = c.from("exercises").select("exercise_id, name, target_muscles, equipments");
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
export async function getExerciseNamesByIds(ids: string[], client?: SupabaseClient): Promise<Record<string, string>> {
  const c = client ?? supabase;
  const unique = Array.from(new Set((ids || []).filter(Boolean)));
  if (unique.length === 0) return {};
  const { data, error } = await c
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
