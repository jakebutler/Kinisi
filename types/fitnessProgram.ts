// Fitness Program Type Definition
export interface FitnessProgram {
  programTitle: string;
  overview: string;
  weeks: Array<{
    week: number;
    days: Array<{
      day: string;
      focus: string;
      exercises: Array<{
        name: string;
        sets: number;
        reps: number;
        notes?: string;
      }>;
    }>;
  }>;
  specialNotes?: string;
}
