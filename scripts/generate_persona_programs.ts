// scripts/generate_persona_programs.ts
// Script to generate custom fitness programs for each persona using their assessments and extracted exercises

import fs from 'fs';
import path from 'path';
import { buildProgramPrompt } from '../utils/programPromptTemplate';

interface PersonaAssessment {
  persona: string;
  assessment: string;
}

interface Exercise {
  exercise_id: string;
  name: string;
  primary_muscles: string[];
  equipment: string[];
}

interface PersonaPrograms {
  programs: {
    [personaName: string]: {
      persona: string;
      assessment: string;
      program: any;
    };
  };
}

// Persona assessments from the persona_personalized_assessments.md file
const personaAssessments: PersonaAssessment[] = [
  {
    persona: "Jordan Lee",
    assessment: `**Current Status & Goals**
Jordan is a 38-year-old marketing manager and parent looking to improve overall health while managing occasional lower back tightness from sitting and lifting children. With a current activity level of 1-2 days per week and fair physical function, he's ready to commit to 3 days per week of 25-minute morning sessions, prioritizing health improvement and energy restoration.

**Key Considerations**
The lower back tightness requires attention to proper form and gradual progression. Jordan's confidence level (6/10) suggests he may benefit from structured guidance and early wins to build momentum. His time constraints as a working parent make efficient, home-based workouts essential.

**Focus Areas for Next 4-6 Weeks**
1. Core strengthening and posterior chain activation to support back health
2. Mobility work targeting hip flexors and thoracic spine
3. Building consistent habits with achievable morning routines

**Actionable Next Steps**
1. Start with 15-minute bodyweight circuits focusing on glute activation and core stability
2. Incorporate daily movement breaks (2-3 minutes) during work hours
3. Add gentle stretching sessions before bedtime to address back tightness`
  },
  {
    persona: "Taylor Nguyen",
    assessment: `**Current Status & Goals**
Taylor is a 25-year-old recent college graduate and former student athlete looking to regain strength and consistency after losing fitness habits post-graduation. Currently inactive (0 days/week) with fair physical function, Taylor is motivated to build confidence through strength training using resistance bands or dumbbells during evening sessions.

**Key Considerations**
As a former athlete, Taylor has foundational movement knowledge but needs structure to rebuild consistency. The confidence level (5/10) indicates some uncertainty about maintaining motivation alone. Evening workouts align with Taylor's schedule and preferred training time.

**Focus Areas for Next 4-6 Weeks**
1. Rebuilding foundational movement patterns and strength base
2. Creating sustainable evening workout habits
3. Progressive overload with bodyweight and light resistance training

**Actionable Next Steps**
1. Begin with 20-minute full-body resistance band circuits 3x per week
2. Track workout completion to build momentum and confidence
3. Gradually increase resistance and add variety as consistency improves`
  },
  {
    persona: "Samira Patel",
    assessment: `**Current Status & Goals**
Samira is a 33-year-old software engineer and amateur triathlete seeking to regain strength and endurance after a two-year hiatus due to work burnout. With good physical function and current activity at 3-4 days/week, she's ready to commit to 5 morning sessions per week while managing mild knee discomfort from cycling.

**Key Considerations**
The knee discomfort requires careful exercise selection and proper warm-up protocols. Samira's high confidence (8/10) and importance rating (9/10) suggest strong motivation, but her history of burnout indicates the need for balanced programming that prevents overtraining.

**Focus Areas for Next 4-6 Weeks**
1. Gradual strength rebuilding with knee-friendly exercises
2. Balancing cycling with complementary strength and flexibility work
3. Implementing recovery strategies to prevent overuse injuries

**Actionable Next Steps**
1. Alternate between strength training and yoga/stretching sessions
2. Incorporate knee strengthening exercises and proper warm-up routines
3. Monitor knee discomfort and adjust intensity as needed`
  },
  {
    persona: "Carlos Ramirez",
    assessment: `**Current Status & Goals**
Carlos is a 45-year-old remote customer support specialist dealing with chronic neck and shoulder stiffness from prolonged desk work. Currently inactive with poor physical function, his primary goal is pain reduction through gentle movement. With medical clearance and high importance (10/10) but low confidence (4/10), he needs a safe, gradual approach.

**Key Considerations**
The chronic neck and shoulder issues require careful exercise selection and gradual progression. Carlos's low confidence suggests the need for clear guidance and early success experiences. Short afternoon sessions (15 minutes, 4x/week) align with his work schedule and pain management goals.

**Focus Areas for Next 4-6 Weeks**
1. Gentle mobility work for neck and shoulder relief
2. Building movement confidence through safe, achievable exercises
3. Establishing consistent daily movement habits

**Actionable Next Steps**
1. Begin with 10-minute gentle stretching routines targeting neck and shoulders
2. Incorporate posture-improving exercises that can be done at a desk
3. Gradually increase duration as comfort and confidence improve`
  }
];

// Add survey response context to each assessment
const surveyContext: Record<string, string> = {
  "Jordan Lee": `
Survey Context:
- Primary Goal: Improve health
- Current Pain: Occasional lower back tightness from sitting and lifting kids
- Activity Frequency: 1-2 days per week
- Physical Function: Fair
- Time Commitment: 3 days/week, 25 minutes, Morning
- Equipment: Bodyweight only, Outdoor space
- Activity Preferences: Home workouts, Walking/hiking`,
  
  "Taylor Nguyen": `
Survey Context:
- Primary Goal: Gain strength
- Current Pain: None
- Activity Frequency: 0 days per week
- Physical Function: Fair
- Time Commitment: 3 days/week, 30 minutes, Evening
- Equipment: Dumbbells or resistance bands
- Activity Preferences: Strength training, Home workouts`,
  
  "Samira Patel": `
Survey Context:
- Primary Goal: Gain strength
- Current Pain: Mild knee discomfort from long cycling sessions
- Activity Frequency: 3-4 days per week
- Physical Function: Good
- Time Commitment: 5 days/week, 60 minutes, Morning
- Equipment: Gym with machines/weights, Cardio equipment
- Activity Preferences: Cycling, Strength training, Yoga/stretching`,
  
  "Carlos Ramirez": `
Survey Context:
- Primary Goal: Reduce pain
- Current Pain: Chronic neck and shoulder stiffness from desk posture
- Activity Frequency: 0 days per week
- Physical Function: Poor
- Time Commitment: 4 days/week, 15 minutes, Afternoon
- Equipment: Bodyweight only
- Activity Preferences: Yoga/stretching, Home workouts`
};

async function loadPersonaExercises(): Promise<Record<string, Exercise[]>> {
  const extractsPath = path.resolve(process.cwd(), 'docs', 'persona_extracts.json');
  const rawData = await fs.promises.readFile(extractsPath, 'utf-8');
  return JSON.parse(rawData);
}

function generateMockProgram(persona: string, assessment: string, exercises: Exercise[]): any {
  // For this script, we'll create mock programs that follow the schema
  // In a real implementation, this would call the LLM
  
  const personaPrograms = {
    "Jordan Lee": {
      weeks: [
        {
          week: 1,
          sessions: [
            {
              session: 1,
              goal: "Core activation & mobility",
              exercises: [
                { exercise_id: "plank", sets: 3, reps: 30, notes: "Focus on breathing" },
                { exercise_id: "glute_bridge", sets: 3, reps: 15, notes: "Squeeze glutes at top" },
                { exercise_id: "cat_cow_stretch", sets: 1, reps: 10, notes: "Slow controlled movement" }
              ]
            },
            {
              session: 2,
              goal: "Posterior chain strength",
              exercises: [
                { exercise_id: "bodyweight_squat", sets: 3, reps: 12, notes: "Keep chest up" },
                { exercise_id: "push_up", sets: 3, reps: 8, notes: "Modified if needed" },
                { exercise_id: "bird_dog", sets: 3, reps: 10, notes: "Alternate sides" }
              ]
            },
            {
              session: 3,
              goal: "Flexibility & recovery",
              exercises: [
                { exercise_id: "forward_fold", sets: 1, reps: 30, notes: "Hold for 30 seconds" },
                { exercise_id: "hip_flexor_stretch", sets: 1, reps: 30, notes: "Each side" },
                { exercise_id: "child_pose", sets: 1, reps: 45, notes: "Focus on breathing" }
              ]
            }
          ]
        },
        {
          week: 2,
          sessions: [
            {
              session: 1,
              goal: "Core stability progressions",
              exercises: [
                { exercise_id: "side_plank", sets: 3, reps: 20, notes: "Each side" },
                { exercise_id: "dead_bug", sets: 3, reps: 12, notes: "Slow controlled movement" },
                { exercise_id: "pelvic_tilt", sets: 3, reps: 15, notes: "Lie on back" }
              ]
            },
            {
              session: 2,
              goal: "Full body integration",
              exercises: [
                { exercise_id: "lunge", sets: 3, reps: 10, notes: "Each side" },
                { exercise_id: "inchworm", sets: 3, reps: 8, notes: "Walk hands out and back" },
                { exercise_id: "superman", sets: 3, reps: 12, notes: "Lift chest and legs" }
              ]
            },
            {
              session: 3,
              goal: "Active recovery & mobility",
              exercises: [
                { exercise_id: "thoracic_rotation", sets: 1, reps: 10, notes: "Each side" },
                { exercise_id: "piriformis_stretch", sets: 1, reps: 30, notes: "Each side" },
                { exercise_id: "wall_sit", sets: 3, reps: 30, notes: "Back against wall" }
              ]
            }
          ]
        }
      ]
    },
    "Taylor Nguyen": {
      weeks: [
        {
          week: 1,
          sessions: [
            {
              session: 1,
              goal: "Full body foundation",
              exercises: [
                { exercise_id: "bodyweight_squat", sets: 3, reps: 15, notes: "Focus on form" },
                { exercise_id: "push_up", sets: 3, reps: 10, notes: "Modified if needed" },
                { exercise_id: "plank", sets: 3, reps: 30, notes: "Keep core tight" },
                { exercise_id: "glute_bridge", sets: 3, reps: 12, notes: "Squeeze at top" }
              ]
            },
            {
              session: 2,
              goal: "Upper body strength",
              exercises: [
                { exercise_id: "dumbbell_press", sets: 3, reps: 12, notes: "Control the movement" },
                { exercise_id: "dumbbell_row", sets: 3, reps: 12, notes: "Each arm" },
                { exercise_id: "overhead_press", sets: 3, reps: 10, notes: "Light weight" },
                { exercise_id: "bicep_curl", sets: 3, reps: 12, notes: "Controlled reps" }
              ]
            },
            {
              session: 3,
              goal: "Lower body & core",
              exercises: [
                { exercise_id: "dumbbell_lunge", sets: 3, reps: 10, notes: "Each leg" },
                { exercise_id: "romanian_deadlift", sets: 3, reps: 12, notes: "Light weight" },
                { exercise_id: "calf_raise", sets: 3, reps: 15, notes: "Full range" },
                { exercise_id: "russian_twist", sets: 3, reps: 20, notes: "Each side" }
              ]
            }
          ]
        },
        {
          week: 2,
          sessions: [
            {
              session: 1,
              goal: "Full body progression",
              exercises: [
                { exercise_id: "goblet_squat", sets: 3, reps: 12, notes: "Keep chest up" },
                { exercise_id: "renegade_row", sets: 3, reps: 8, notes: "Each arm" },
                { exercise_id: "mountain_climber", sets: 3, reps: 20, notes: "Quick pace" },
                { exercise_id: "hip_thrust", sets: 3, reps: 15, notes: "Squeeze glutes" }
              ]
            },
            {
              session: 2,
              goal: "Upper body hypertrophy",
              exercises: [
                { exercise_id: "incline_press", sets: 3, reps: 12, notes: "Incline bench" },
                { exercise_id: "pull_up", sets: 3, reps: 8, notes: "Assisted if needed" },
                { exercise_id: "lateral_raise", sets: 3, reps: 15, notes: "Light weight" },
                { exercise_id: "tricep_extension", sets: 3, reps: 12, notes: "Overhead" }
              ]
            },
            {
              session: 3,
              goal: "Lower body power",
              exercises: [
                { exercise_id: "dumbbell_step_up", sets: 3, reps: 10, notes: "Each leg" },
                { exercise_id: "good_morning", sets: 3, reps: 12, notes: "Light weight" },
                { exercise_id: "split_squat", sets: 3, reps: 10, notes: "Each leg" },
                { exercise_id: "hanging_knee_raise", sets: 3, reps: 12, notes: "Controlled" }
              ]
            }
          ]
        }
      ]
    },
    "Samira Patel": {
      weeks: [
        {
          week: 1,
          sessions: [
            {
              session: 1,
              goal: "Lower body strength",
              exercises: [
                { exercise_id: "barbell_squat", sets: 4, reps: 8, notes: "Focus on depth" },
                { exercise_id: "leg_press", sets: 3, reps: 12, notes: "Full range" },
                { exercise_id: "leg_extension", sets: 3, reps: 15, notes: "Squeeze quads" },
                { exercise_id: "calf_raise", sets: 4, reps: 20, notes: "Stretch at bottom" }
              ]
            },
            {
              session: 2,
              goal: "Upper body power",
              exercises: [
                { exercise_id: "bench_press", sets: 4, reps: 8, notes: "Controlled descent" },
                { exercise_id: "pull_up", sets: 4, reps: 6, notes: "Weighted if possible" },
                { exercise_id: "overhead_press", sets: 3, reps: 10, notes: "Strict form" },
                { exercise_id: "barbell_row", sets: 4, reps: 8, notes: "Explosive pull" }
              ]
            },
            {
              session: 3,
              goal: "Active recovery & mobility",
              exercises: [
                { exercise_id: "yoga_flow", sets: 1, reps: 30, notes: "Sun salutation" },
                { exercise_id: "foam_roll", sets: 1, reps: 15, notes: "Each muscle group" },
                { exercise_id: "dynamic_stretch", sets: 1, reps: 20, notes: "Full body" },
                { exercise_id: "breathing_exercise", sets: 1, reps: 10, notes: "Box breathing" }
              ]
            },
            {
              session: 4,
              goal: "Full body conditioning",
              exercises: [
                { exercise_id: "deadlift", sets: 4, reps: 6, notes: "Perfect form" },
                { exercise_id: "push_press", sets: 3, reps: 8, notes: "Explosive" },
                { exercise_id: "kettlebell_swing", sets: 4, reps: 15, notes: "Hip hinge" },
                { exercise_id: "battle_rope", sets: 3, reps: 30, notes: "Alternating waves" }
              ]
            },
            {
              session: 5,
              goal: "Cardio & endurance",
              exercises: [
                { exercise_id: "cycling", sets: 1, reps: 45, notes: "Steady pace" },
                { exercise_id: "rowing", sets: 1, reps: 20, notes: "Interval training" },
                { exercise_id: "jumping_jacks", sets: 3, reps: 30, notes: "Quick pace" },
                { exercise_id: "burpee", sets: 3, reps: 10, notes: "Modified if needed" }
              ]
            }
          ]
        },
        {
          week: 2,
          sessions: [
            {
              session: 1,
              goal: "Lower body hypertrophy",
              exercises: [
                { exercise_id: "bulgarian_split_squat", sets: 4, reps: 10, notes: "Each leg" },
                { exercise_id: "romanian_deadlift", sets: 4, reps: 12, notes: "Feel hamstrings" },
                { exercise_id: "leg_curl", sets: 3, reps: 15, notes: "Squeeze glutes" },
                { exercise_id: "seated_calf_raise", sets: 4, reps: 20, notes: "Full range" }
              ]
            },
            {
              session: 2,
              goal: "Upper body volume",
              exercises: [
                { exercise_id: "incline_press", sets: 4, reps: 10, notes: "Controlled" },
                { exercise_id: "chin_up", sets: 4, reps: 8, notes: "Weighted if possible" },
                { exercise_id: "dumbbell_shrug", sets: 4, reps: 15, notes: "Full range" },
                { exercise_id: "face_pull", sets: 3, reps: 15, notes: "Shoulder health" }
              ]
            },
            {
              session: 3,
              goal: "Yoga & flexibility",
              exercises: [
                { exercise_id: "vinyasa_flow", sets: 1, reps: 45, notes: "Continuous flow" },
                { exercise_id: "hip_openers", sets: 1, reps: 30, notes: "Each side" },
                { exercise_id: "shoulder_stretch", sets: 1, reps: 20, notes: "Gentle" },
                { exercise_id: "meditation", sets: 1, reps: 10, notes: "Focus on breath" }
              ]
            },
            {
              session: 4,
              goal: "Functional strength",
              exercises: [
                { exercise_id: "farmer_walk", sets: 3, reps: 30, notes: "Heavy weight" },
                { exercise_id: "tire_flip", sets: 3, reps: 10, notes: "Explosive" },
                { exercise_id: "sled_push", sets: 3, reps: 20, notes: "Power through" },
                { exercise_id: "medicine_ball_slam", sets: 3, reps: 15, notes: "Full body" }
              ]
            },
            {
              session: 5,
              goal: "High intensity cardio",
              exercises: [
                { exercise_id: "sprint_intervals", sets: 1, reps: 20, notes: "30s on, 30s off" },
                { exercise_id: "assault_bike", sets: 1, reps: 15, notes: "Tabata style" },
                { exercise_id: "box_jump", sets: 3, reps: 10, notes: "Land soft" },
                { exercise_id: "row_sprints", sets: 1, reps: 15, notes: "500m repeats" }
              ]
            }
          ]
        }
      ]
    },
    "Carlos Ramirez": {
      weeks: [
        {
          week: 1,
          sessions: [
            {
              session: 1,
              goal: "Neck & shoulder release",
              exercises: [
                { exercise_id: "neck_rotations", sets: 1, reps: 10, notes: "Gentle circles" },
                { exercise_id: "shoulder_rolls", sets: 1, reps: 15, notes: "Both directions" },
                { exercise_id: "chin_tucks", sets: 1, reps: 10, notes: "Hold 3 seconds" },
                { exercise_id: "wall_angels", sets: 1, reps: 8, notes: "Slow controlled" }
              ]
            },
            {
              session: 2,
              goal: "Posture improvement",
              exercises: [
                { exercise_id: "chest_stretch", sets: 1, reps: 30, notes: "Doorway stretch" },
                { exercise_id: "thoracic_extension", sets: 1, reps: 10, notes: "Foam roller" },
                { exercise_id: "scapular_retraction", sets: 1, reps: 15, notes: "Squeeze shoulder blades" },
                { exercise_id: "upper_back_stretch", sets: 1, reps: 20, notes: "Gentle" }
              ]
            },
            {
              session: 3,
              goal: "Gentle movement",
              exercises: [
                { exercise_id: "cat_cow", sets: 1, reps: 12, notes: "Slow rhythm" },
                { exercise_id: "gentle_twist", sets: 1, reps: 8, notes: "Each side" },
                { exercise_id: "pelvic_tilt", sets: 1, reps: 15, notes: "Lie on back" },
                { exercise_id: "deep_breathing", sets: 1, reps: 10, notes: "Diaphragmatic" }
              ]
            },
            {
              session: 4,
              goal: "Mobility & relaxation",
              exercises: [
                { exercise_id: "shoulder_circles", sets: 1, reps: 12, notes: "Both directions" },
                { exercise_id: "arm_stretches", sets: 1, reps: 20, notes: "Across chest" },
                { exercise_id: "wrist_rotations", sets: 1, reps: 10, notes: "Both directions" },
                { exercise_id: "progressive_relaxation", sets: 1, reps: 15, notes: "Full body" }
              ]
            }
          ]
        },
        {
          week: 2,
          sessions: [
            {
              session: 1,
              goal: "Neck strengthening",
              exercises: [
                { exercise_id: "isometric_neck", sets: 1, reps: 8, notes: "Each direction" },
                { exercise_id: "chin_tucks_plus", sets: 1, reps: 12, notes: "Add resistance" },
                { exercise_id: "shoulder_blade_squeeze", sets: 1, reps: 15, notes: "Hold 5 seconds" },
                { exercise_id: "wall_push_up", sets: 1, reps: 10, notes: "Gentle" }
              ]
            },
            {
              session: 2,
              goal: "Upper back activation",
              exercises: [
                { exercise_id: "band_pull_apart", sets: 1, reps: 15, notes: "Light band" },
                { exercise_id: "face_pull", sets: 1, reps: 12, notes: "Light resistance" },
                { exercise_id: "reverse_fly", sets: 1, reps: 12, notes: "Light dumbbells" },
                { exercise_id: "prone_t", sets: 1, reps: 10, notes: "Lie on stomach" }
              ]
            },
            {
              session: 3,
              goal: "Full body integration",
              exercises: [
                { exercise_id: "wall_sit", sets: 1, reps: 30, notes: "Back against wall" },
                { exercise_id: "gentle_squat", sets: 1, reps: 12, notes: "Partial range" },
                { exercise_id: "modified_plank", sets: 1, reps: 20, notes: "On knees" },
                { exercise_id: "standing_reach", sets: 1, reps: 10, notes: "Overhead reach" }
              ]
            },
            {
              session: 4,
              goal: "Stress relief",
              exercises: [
                { exercise_id: "shoulder_shrug", sets: 1, reps: 15, notes: "Relax shoulders" },
                { exercise_id: "neck_stretch", sets: 1, reps: 20, notes: "Each side" },
                { exercise_id: "breathing_stretch", sets: 1, reps: 10, notes: "Inhale stretch, exhale relax" },
                { exercise_id: "mindful_movement", sets: 1, reps: 15, notes: "Slow deliberate" }
              ]
            }
          ]
        }
      ]
    }
  };
  
  return (personaPrograms as any)[persona] || { weeks: [] };
}

async function generatePrograms(): Promise<PersonaPrograms> {
  const personaExercises = await loadPersonaExercises();
  const programs: PersonaPrograms = { programs: {} };
  
  for (const personaAssessment of personaAssessments) {
    const { persona, assessment } = personaAssessment;
    const exercises = personaExercises[persona] || [];
    
    // Add survey context to assessment
    const fullAssessment = assessment + surveyContext[persona];
    
    // Generate mock program (in real implementation, this would call LLM)
    const program = generateMockProgram(persona, fullAssessment, exercises);
    
    programs.programs[persona] = {
      persona,
      assessment: fullAssessment,
      program
    };
    
    console.log(`Generated program for ${persona}`);
  }
  
  return programs;
}

async function main() {
  try {
    const programs = await generatePrograms();
    
    // Save the programs
    const outputPath = path.resolve(process.cwd(), 'docs', 'persona_fitness_programs.json');
    await fs.promises.writeFile(outputPath, JSON.stringify(programs, null, 2));
    
    console.log(`Saved fitness programs to ${outputPath}`);
    
    // Print summary
    Object.keys(programs.programs).forEach(persona => {
      const program = programs.programs[persona].program;
      const totalWeeks = program.weeks.length;
      const totalSessions = program.weeks.reduce((sum: number, week: any) => sum + week.sessions.length, 0);
      console.log(`${persona}: ${totalWeeks} weeks, ${totalSessions} sessions`);
    });
    
  } catch (error) {
    console.error('Error generating programs:', error);
    process.exit(1);
  }
}

main();