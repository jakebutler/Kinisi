// scripts/extract_persona_exercises.ts
// Script to extract relevant exercises for each persona based on their equipment and goals

import fs from 'fs';
import path from 'path';

interface Exercise {
  exerciseId: string;
  name: string;
  equipments: string[];
  bodyParts: string[];
  targetMuscles: string[];
  primaryMuscles?: string[];
}

interface PersonaExerciseSet {
  [personaName: string]: Exercise[];
}

// Define equipment filters for each persona
const personaEquipmentFilters: Record<string, string[]> = {
  "Jordan Lee": ["body weight"],
  "Taylor Nguyen": ["band", "dumbbell", "body weight"],
  "Samira Patel": ["barbell", "dumbbell", "cable", "leverage machine", "body weight", "band", "kettlebell"],
  "Carlos Ramirez": ["body weight"]
};

// Define exercise type preferences for each persona (based on body parts and target muscles)
const personaExercisePreferences: Record<string, string[]> = {
  "Jordan Lee": ["stretching", "mobility", "core", "bodyweight", "rehabilitation"],
  "Taylor Nguyen": ["strength", "bodyweight", "resistance", "full body"],
  "Samira Patel": ["strength", "cardio", "olympic", "powerlifting", "functional", "yoga"],
  "Carlos Ramirez": ["stretching", "mobility", "rehabilitation", "bodyweight", "yoga"]
};

// Define body part focus for each persona
const personaBodyPartFocus: Record<string, string[]> = {
  "Jordan Lee": ["lower back", "core", "glutes", "hamstrings", "posture"],
  "Taylor Nguyen": ["upper legs", "lower legs", "chest", "back", "shoulders", "arms", "core", "glutes"],
  "Samira Patel": ["upper legs", "lower legs", "chest", "back", "shoulders", "arms", "core", "glutes"],
  "Carlos Ramirez": ["neck", "shoulders", "upper back", "posture", "mobility"]
};

function isExerciseRelevant(exercise: Exercise, personaName: string): boolean {
  const equipmentFilter = personaEquipmentFilters[personaName];
  const bodyPartFocus = personaBodyPartFocus[personaName];
  
  // Guard against missing data
  if (!exercise || !exercise.equipments || !Array.isArray(exercise.equipments)) {
    return false;
  }
  
  // Check equipment compatibility
  const hasCompatibleEquipment = exercise.equipments.some((eq: string) =>
    eq && equipmentFilter.some((filter: string) => eq.toLowerCase().includes(filter.toLowerCase()))
  );
  
  if (!hasCompatibleEquipment) return false;
  
  // Check body part relevance
  const bodyParts = exercise.bodyParts || [];
  const targetMuscles = exercise.targetMuscles || [];
  const targetBodyParts = [...bodyParts, ...targetMuscles];
  const hasRelevantBodyPart = targetBodyParts.some((part: string) =>
    part && bodyPartFocus.some((focus: string) =>
      part.toLowerCase().includes(focus.toLowerCase()) ||
      focus.toLowerCase().includes(part.toLowerCase())
    )
  );
  
  // Exercise is relevant if it matches equipment AND body part focus
  return hasCompatibleEquipment && hasRelevantBodyPart;
}

async function extractExercises(): Promise<PersonaExerciseSet> {
  const exercisesPath = path.resolve(process.cwd(), 'exercises-data', 'exercises.json');
  const rawData = await fs.promises.readFile(exercisesPath, 'utf-8');
  const allExercises: Exercise[] = JSON.parse(rawData);
  
  const personaExercises: PersonaExerciseSet = {};
  
  Object.keys(personaEquipmentFilters).forEach(personaName => {
    personaExercises[personaName] = allExercises.filter(exercise => 
      isExerciseRelevant(exercise, personaName)
    );
    
    console.log(`Extracted ${personaExercises[personaName].length} exercises for ${personaName}`);
  });
  
  return personaExercises;
}

// Convert exercise format to match the program prompt template
function convertToProgramFormat(exercises: Exercise[]): any[] {
  return exercises.map(ex => ({
    exercise_id: ex.exerciseId,
    name: ex.name,
    primary_muscles: ex.targetMuscles || [],
    equipment: ex.equipments
  }));
}

async function main() {
  try {
    const personaExercises = await extractExercises();
    
    // Convert to program format and save
    const programFormatExercises: PersonaExerciseSet = {};
    Object.keys(personaExercises).forEach(persona => {
      programFormatExercises[persona] = convertToProgramFormat(personaExercises[persona]);
    });
    
    // Save the extracted exercises
    const outputPath = path.resolve(process.cwd(), 'docs', 'persona_extracts.json');
    await fs.promises.writeFile(outputPath, JSON.stringify(programFormatExercises, null, 2));
    
    console.log(`Saved exercise extracts to ${outputPath}`);
    
    // Print sample exercises for each persona
    Object.keys(programFormatExercises).forEach(persona => {
      console.log(`\n${persona} - Sample exercises:`);
      programFormatExercises[persona].slice(0, 5).forEach(ex => {
        console.log(`  - ${ex.name} (${ex.equipments.join(', ')})`);
      });
    });
    
  } catch (error) {
    console.error('Error extracting exercises:', error);
    process.exit(1);
  }
}

main();