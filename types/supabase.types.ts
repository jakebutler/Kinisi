export type SurveyResponses = {
  medicalClearance: 'Yes' | 'No';
  currentPain: {
    hasPain: boolean;
    description?: string;
  };
  activityFrequency: '0' | '1–2' | '3–4' | '5–7';
  physicalFunction: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  intentToChange: 'Yes' | 'No' | 'Not sure';
  importance: number; // 0-10
  confidence: number; // 0-10
  sleep: 'Less than 5' | '5–6' | '7–8' | 'More than 8';
  tobaccoUse: 'Yes' | 'No';
  primaryGoal: 'Improve health' | 'Lose weight' | 'Gain strength' | 'Reduce pain' | 'Feel better/energized' | 'Other';
  activityPreferences: Array<
    | 'Walking/hiking'
    | 'Strength training'
    | 'Yoga/stretching'
    | 'Group classes'
    | 'Sports'
    | 'Cycling'
    | 'Swimming'
    | 'Home workouts'
    | 'Other'
  >;
  otherActivityPreferences?: string;
  equipmentAccess: Array<
    | 'None / Bodyweight only'
    | 'Dumbbells or resistance bands'
    | 'Gym with machines/weights'
    | 'Cardio equipment'
    | 'Outdoor space'
    | 'Pool'
    | 'Other'
  >;
  otherEquipmentAccess?: string;
  timeCommitment: {
    daysPerWeek: number; // 0-7
    minutesPerSession: number;
    preferredTimeOfDay: 'Morning' | 'Afternoon' | 'Evening' | 'Flexible';
  };
};
