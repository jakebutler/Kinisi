import { SurveyQuestion } from '@/types/survey';

export const intakeSurveyQuestions: SurveyQuestion[] = [
  {
    key: 'medicalClearance',
    title: 'Have you ever been told by a doctor that you should not exercise because of a medical condition?',
    type: 'radio',
    options: [
      { label: 'Yes', value: 'Yes' },
      { label: 'No', value: 'No' },
    ],
    required: true
  },
  {
    key: 'currentPain',
    title: 'Do you currently experience pain or injury that limits your physical activity?',
    type: 'radio',
    options: [
      { label: 'Yes', value: 'Yes' },
      { label: 'No', value: 'No' },
    ],
    required: true,
    showFollowUp: (value: unknown) => value === 'Yes',
    followUp: {
      key: 'painDescription',
      title: 'Please describe your pain or injury:',
      type: 'text',
      required: true
    }
  },
  {
    key: 'painDescription',
    title: 'Please describe your pain or injury:',
    type: 'text',
    required: false,
    isFollowUp: true
  },
  {
    key: 'activityFrequency',
    title: 'On average, how many days per week do you do 30+ minutes of moderate-to-vigorous physical activity?',
    type: 'select',
    options: [
      { label: '0', value: '0' },
      { label: '1-2', value: '1-2' },
      { label: '3-4', value: '3-4' },
      { label: '5-7', value: '5-7' },
    ],
    required: true
  },
  {
    key: 'physicalFunction',
    title: 'How would you rate your overall physical function?',
    type: 'select',
    options: [
      { label: 'Excellent', value: 'Excellent' },
      { label: 'Good', value: 'Good' },
      { label: 'Fair', value: 'Fair' },
      { label: 'Poor', value: 'Poor' },
    ],
    required: true
  },
  {
    key: 'intentToChange',
    title: 'Do you intend to increase your physical activity in the next 30 days?',
    type: 'radio',
    options: [
      { label: 'Yes', value: 'Yes' },
      { label: 'No', value: 'No' },
      { label: 'Not sure', value: 'Not sure' },
    ],
    required: true
  },
  {
    key: 'importance',
    title: 'On a scale of 0–10, how important is it for you to become more physically active?',
    type: 'number',
    required: true,
    min: 0,
    max: 10
  },
  {
    key: 'confidence',
    title: 'On a scale of 0–10, how confident are you in your ability to follow an exercise plan?',
    type: 'number',
    required: true,
    min: 0,
    max: 10
  },
  {
    key: 'sleep',
    title: 'How many hours of sleep do you usually get per night?',
    type: 'select',
    options: [
      { label: 'Less than 5', value: 'Less than 5' },
      { label: '5-6', value: '5-6' },
      { label: '7-8', value: '7-8' },
      { label: 'More than 8', value: 'More than 8' },
    ],
    required: true
  },
  {
    key: 'tobaccoUse',
    title: 'Do you currently smoke or use tobacco?',
    type: 'radio',
    options: [
      { label: 'Yes', value: 'Yes' },
      { label: 'No', value: 'No' },
    ],
    required: true
  },
  {
    key: 'primaryGoal',
    title: 'What is your top goal for being physically active?',
    type: 'select',
    options: [
      { label: 'Improve health', value: 'Improve health' },
      { label: 'Lose weight', value: 'Lose weight' },
      { label: 'Gain strength', value: 'Gain strength' },
      { label: 'Reduce pain', value: 'Reduce pain' },
      { label: 'Feel better/energized', value: 'Feel better/energized' },
      { label: 'Other', value: 'Other' },
    ],
    required: true
  },
  {
    key: 'activityPreferences',
    title: 'What types of physical activity do you enjoy or want to include in your routine? (Select all that apply)',
    type: 'multiselect',
    options: [
      { label: 'Walking/hiking', value: 'Walking/hiking' },
      { label: 'Strength training', value: 'Strength training' },
      { label: 'Yoga/stretching', value: 'Yoga/stretching' },
      { label: 'Group classes', value: 'Group classes' },
      { label: 'Sports', value: 'Sports' },
      { label: 'Cycling', value: 'Cycling' },
      { label: 'Swimming', value: 'Swimming' },
      { label: 'Home workouts', value: 'Home workouts' },
      { label: 'Other', value: 'Other' },
    ],
    required: true
  },
  {
    key: 'otherActivityPreferences',
    title: 'Please specify other activities you enjoy',
    type: 'text',
    required: false
  },
  {
    key: 'equipmentAccess',
    title: 'What equipment or facilities do you have access to? (Select all that apply)',
    type: 'multiselect',
    options: [
      { label: 'None / Bodyweight only', value: 'None / Bodyweight only' },
      { label: 'Dumbbells or resistance bands', value: 'Dumbbells or resistance bands' },
      { label: 'Gym with machines/weights', value: 'Gym with machines/weights' },
      { label: 'Cardio equipment', value: 'Cardio equipment' },
      { label: 'Outdoor space', value: 'Outdoor space' },
      { label: 'Pool', value: 'Pool' },
      { label: 'Other', value: 'Other' },
    ],
    required: true
  },
  {
    key: 'otherEquipmentAccess',
    title: 'Please specify other equipment or facilities you have access to',
    type: 'text',
    required: false
  },
  {
    key: 'timeCommitment',
    title: 'How much time can you realistically commit to physical activity each week?',
    type: 'group',
    fields: [
      {
        key: 'daysPerWeek',
        title: 'Days per week',
        type: 'number',
        min: 1,
        max: 7,
        required: true
      },
      {
        key: 'minutesPerSession',
        title: 'Minutes per session',
        type: 'number',
        min: 5,
        max: 240,
        required: true
      },
      {
        key: 'preferredTimeOfDay',
        title: 'Preferred time of day',
        type: 'select',
        options: [
          { label: 'Morning', value: 'Morning' },
          { label: 'Afternoon', value: 'Afternoon' },
          { label: 'Evening', value: 'Evening' },
          { label: 'Flexible', value: 'Flexible' }
        ],
        required: true
      }
    ]
  }
];