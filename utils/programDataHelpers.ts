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

// Fetch a program by ID
export async function getProgramById(id: string) {
  const { data, error } = await supabase.from("exercise_programs").select("*, sessions(*, session_exercises(*))").eq("id", id).single();
  // Supabase returns error with code 'PGRST116' for not found
  if (error && error.code === 'PGRST116') return null;
  if (error) throw new Error(error.message);
  return data;
}

// Save feedback for a program or session
export async function saveProgramFeedback({
  program_id,
  session_id,
  user_id,
  feedback
}: {
  program_id: string;
  session_id?: string;
  user_id: string;
  feedback: string;
}) {
  const { data, error } = await supabase.from("program_feedback").insert([
    { program_id, session_id, user_id, feedback }
  ]);
  if (error) throw new Error(error.message);
  return data?.[0];
}

// Approve a program (set status to 'approved')
export async function approveProgram(id: string) {
  const { data, error } = await supabase.from("exercise_programs").update({ status: "approved" }).eq("id", id).select();
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
  return data as Exercise[];
}
