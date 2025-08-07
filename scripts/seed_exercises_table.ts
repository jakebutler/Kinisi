import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

// Configure these with your Supabase project info
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const exercisesPath = path.resolve(process.cwd(), 'exercises-data', 'exercises.json');

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const raw = await fs.readFile(exercisesPath, 'utf-8');
  const exercises = JSON.parse(raw);

  // Transform and insert all exercises
  for (const ex of exercises) {
    const transformed = {
      exercise_id: ex.exerciseId,
      name: ex.name,
      image_url: ex.gifUrl || null,
      equipments: ex.equipments || [],
      body_parts: ex.bodyParts || [],
      exercise_type: ex.exerciseType || null,
      target_muscles: ex.targetMuscles || [],
      secondary_muscles: ex.secondaryMuscles || [],
      video_url: ex.videoUrl || null,
      keywords: ex.keywords || [],
      overview: ex.overview || null,
      instructions: ex.instructions || [],
      exercise_tips: ex.exerciseTips || [],
      variations: ex.variations || [],
      related_exercise_ids: ex.relatedExerciseIds || []
    };
    const response = await supabase
      .from('exercises')
      .upsert([transformed], { onConflict: 'exercise_id' });
    if (response.error) {
      console.error(`Error inserting ${transformed.exercise_id}:`, response);
    } else {
      console.log(`Inserted/updated ${transformed.exercise_id}`);
    }
  }

}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
