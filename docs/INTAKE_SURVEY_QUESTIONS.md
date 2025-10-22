# Kinisi Intake Survey - Complete Question Set

## Overview

This document contains the complete set of questions and answer options for the Kinisi intake survey. Use this to generate sample datasets or understand the survey structure.

---

## Survey Questions

### Question 1: Primary Goal

**Question**: What is your top goal for being physically active?

**Type**: Single select (radio buttons)

**Field Name**: `primaryGoal`

**Answer Options**:
- Improve health
- Lose weight
- Gain strength
- Reduce pain
- Feel better/energized
- Other

**Validation**: Required

**Sample Values**:
```json
"primaryGoal": "Improve health"
"primaryGoal": "Gain strength"
"primaryGoal": "Other"
```

---

### Question 2: Medical Clearance

**Question**: Have you ever been told by a doctor that you should not exercise because of a medical condition?

**Type**: Single select (radio buttons)

**Field Name**: `medicalClearance`

**Answer Options**:
- Yes
- No

**Validation**: Required

**Sample Values**:
```json
"medicalClearance": "No"
"medicalClearance": "Yes"
```

---

### Question 3: Current Pain

**Question**: Do you currently experience pain or injury that limits your physical activity?

**Type**: Conditional (Yes/No with optional text area)

**Field Name**: `currentPain`

**Structure**:
```typescript
{
  hasPain: boolean,
  description?: string  // Required if hasPain is true
}
```

**Answer Options**:
- Yes (triggers description text area)
- No

**Validation**: 
- `hasPain` is required
- If `hasPain` is `true`, `description` must be non-empty
- `description` max length: 1000 characters

**Sample Values**:
```json
{
  "currentPain": {
    "hasPain": false
  }
}

{
  "currentPain": {
    "hasPain": true,
    "description": "Occasional lower back pain when lifting heavy objects"
  }
}

{
  "currentPain": {
    "hasPain": true,
    "description": "Knee pain from old sports injury, limits running"
  }
}
```

---

### Question 4: Activity Frequency

**Question**: On average, how many days per week do you do 30+ minutes of moderate-to-vigorous physical activity?

**Type**: Single select (radio buttons)

**Field Name**: `activityFrequency`

**Answer Options**:
- 0
- 1–2
- 3–4
- 5–7

**Validation**: Required

**Sample Values**:
```json
"activityFrequency": "0"
"activityFrequency": "1–2"
"activityFrequency": "3–4"
"activityFrequency": "5–7"
```

---

### Question 5: Physical Function

**Question**: How would you rate your overall physical function?

**Type**: Single select (radio buttons)

**Field Name**: `physicalFunction`

**Answer Options**:
- Excellent
- Good
- Fair
- Poor

**Validation**: Required

**Sample Values**:
```json
"physicalFunction": "Excellent"
"physicalFunction": "Good"
"physicalFunction": "Fair"
"physicalFunction": "Poor"
```

---

### Question 6: Intent to Change

**Question**: Do you intend to increase your physical activity in the next 30 days?

**Type**: Single select (radio buttons)

**Field Name**: `intentToChange`

**Answer Options**:
- Yes
- No
- Not sure

**Validation**: Required

**Sample Values**:
```json
"intentToChange": "Yes"
"intentToChange": "No"
"intentToChange": "Not sure"
```

---

### Question 7: Importance

**Question**: On a scale of 0–10, how important is it for you to become more physically active?

**Type**: Scale (0-10 buttons)

**Field Name**: `importance`

**Answer Options**: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10

**Validation**: Required, must be integer 0-10

**UI**: Horizontal button scale with labels:
- Left label: "Not important"
- Right label: "Very important"

**Sample Values**:
```json
"importance": 0
"importance": 5
"importance": 8
"importance": 10
```

---

### Question 8: Confidence

**Question**: On a scale of 0–10, how confident are you in your ability to follow an exercise plan?

**Type**: Scale (0-10 buttons)

**Field Name**: `confidence`

**Answer Options**: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10

**Validation**: Required, must be integer 0-10

**UI**: Horizontal button scale with labels:
- Left label: "Not confident"
- Right label: "Very confident"

**Sample Values**:
```json
"confidence": 0
"confidence": 4
"confidence": 7
"confidence": 10
```

---

### Question 9: Sleep

**Question**: How many hours of sleep do you usually get per night?

**Type**: Single select (radio buttons)

**Field Name**: `sleep`

**Answer Options**:
- Less than 5
- 5–6
- 7–8
- More than 8

**Validation**: Required

**Sample Values**:
```json
"sleep": "Less than 5"
"sleep": "5–6"
"sleep": "7–8"
"sleep": "More than 8"
```

---

### Question 10: Tobacco Use

**Question**: Do you currently smoke or use tobacco?

**Type**: Single select (radio buttons)

**Field Name**: `tobaccoUse`

**Answer Options**:
- Yes
- No

**Validation**: Required

**Sample Values**:
```json
"tobaccoUse": "No"
"tobaccoUse": "Yes"
```

---

### Question 11: Activity Preferences

**Question**: What types of physical activity do you enjoy or want to include in your routine?

**Subtitle**: Select all that apply

**Type**: Multi-select (checkboxes with optional text area)

**Field Name**: `activityPreferences` (array)

**Answer Options**:
- Walking/hiking
- Strength training
- Yoga/stretching
- Group classes
- Sports
- Cycling
- Swimming
- Home workouts
- Other (triggers text area)

**Additional Field**: `otherActivityPreferences` (string, max 1000 chars)

**Validation**: 
- At least one option must be selected
- If "Other" is selected, `otherActivityPreferences` should be provided

**Sample Values**:
```json
{
  "activityPreferences": ["Walking/hiking", "Yoga/stretching"],
  "otherActivityPreferences": ""
}

{
  "activityPreferences": ["Strength training", "Home workouts"],
  "otherActivityPreferences": ""
}

{
  "activityPreferences": ["Cycling", "Swimming", "Other"],
  "otherActivityPreferences": "Rock climbing and trail running"
}

{
  "activityPreferences": ["Group classes", "Sports"],
  "otherActivityPreferences": ""
}
```

---

### Question 12: Equipment Access

**Question**: What equipment or facilities do you have access to?

**Subtitle**: Select all that apply

**Type**: Multi-select (checkboxes with optional text area)

**Field Name**: `equipmentAccess` (array)

**Answer Options**:
- None / Bodyweight only
- Dumbbells or resistance bands
- Gym with machines/weights
- Cardio equipment
- Outdoor space
- Pool
- Other (triggers text area)

**Additional Field**: `otherEquipmentAccess` (string, max 1000 chars)

**Validation**: 
- At least one option must be selected
- If "Other" is selected, `otherEquipmentAccess` should be provided

**Sample Values**:
```json
{
  "equipmentAccess": ["None / Bodyweight only"],
  "otherEquipmentAccess": ""
}

{
  "equipmentAccess": ["Dumbbells or resistance bands", "Outdoor space"],
  "otherEquipmentAccess": ""
}

{
  "equipmentAccess": ["Gym with machines/weights", "Cardio equipment"],
  "otherEquipmentAccess": ""
}

{
  "equipmentAccess": ["Pool", "Other"],
  "otherEquipmentAccess": "TRX suspension trainer and kettlebells"
}
```

---

### Question 13: Time Commitment

**Question**: How much time can you realistically commit to physical activity each week?

**Type**: Composite (multiple inputs)

**Field Name**: `timeCommitment`

**Structure**:
```typescript
{
  daysPerWeek: number,        // 0-7
  minutesPerSession: number,  // 5-180
  preferredTimeOfDay: string  // 'Morning' | 'Afternoon' | 'Evening' | 'Flexible'
}
```

**Sub-questions**:

#### 13a: Days per week
- **Type**: Button scale (0-7)
- **Options**: 0, 1, 2, 3, 4, 5, 6, 7
- **Validation**: Required

#### 13b: Minutes per session
- **Type**: Numeric input
- **Range**: 5-180 minutes
- **Validation**: Required, must be integer between 5 and 180
- **UI Note**: Auto-clamps to range on blur

#### 13c: Preferred time of day
- **Type**: Single select (radio buttons)
- **Options**: Morning, Afternoon, Evening, Flexible
- **Validation**: Required

**Sample Values**:
```json
{
  "timeCommitment": {
    "daysPerWeek": 3,
    "minutesPerSession": 30,
    "preferredTimeOfDay": "Morning"
  }
}

{
  "timeCommitment": {
    "daysPerWeek": 5,
    "minutesPerSession": 45,
    "preferredTimeOfDay": "Evening"
  }
}

{
  "timeCommitment": {
    "daysPerWeek": 2,
    "minutesPerSession": 60,
    "preferredTimeOfDay": "Flexible"
  }
}

{
  "timeCommitment": {
    "daysPerWeek": 0,
    "minutesPerSession": 15,
    "preferredTimeOfDay": "Afternoon"
  }
}
```

---

## Complete Sample Datasets

### Sample 1: Beginner with No Equipment

```json
{
  "primaryGoal": "Improve health",
  "medicalClearance": "No",
  "currentPain": {
    "hasPain": false
  },
  "activityFrequency": "0",
  "physicalFunction": "Fair",
  "intentToChange": "Yes",
  "importance": 8,
  "confidence": 5,
  "sleep": "7–8",
  "tobaccoUse": "No",
  "activityPreferences": ["Walking/hiking", "Home workouts"],
  "otherActivityPreferences": "",
  "equipmentAccess": ["None / Bodyweight only", "Outdoor space"],
  "otherEquipmentAccess": "",
  "timeCommitment": {
    "daysPerWeek": 3,
    "minutesPerSession": 20,
    "preferredTimeOfDay": "Morning"
  }
}
```

### Sample 2: Intermediate with Gym Access

```json
{
  "primaryGoal": "Gain strength",
  "medicalClearance": "No",
  "currentPain": {
    "hasPain": false
  },
  "activityFrequency": "3–4",
  "physicalFunction": "Good",
  "intentToChange": "Yes",
  "importance": 9,
  "confidence": 7,
  "sleep": "7–8",
  "tobaccoUse": "No",
  "activityPreferences": ["Strength training", "Cycling"],
  "otherActivityPreferences": "",
  "equipmentAccess": ["Gym with machines/weights", "Cardio equipment"],
  "otherEquipmentAccess": "",
  "timeCommitment": {
    "daysPerWeek": 4,
    "minutesPerSession": 60,
    "preferredTimeOfDay": "Evening"
  }
}
```

### Sample 3: Active with Pain Management

```json
{
  "primaryGoal": "Reduce pain",
  "medicalClearance": "No",
  "currentPain": {
    "hasPain": true,
    "description": "Chronic lower back pain from desk work, worsens with prolonged sitting"
  },
  "activityFrequency": "1–2",
  "physicalFunction": "Fair",
  "intentToChange": "Yes",
  "importance": 10,
  "confidence": 6,
  "sleep": "5–6",
  "tobaccoUse": "No",
  "activityPreferences": ["Yoga/stretching", "Walking/hiking", "Swimming"],
  "otherActivityPreferences": "",
  "equipmentAccess": ["Pool", "Outdoor space", "Dumbbells or resistance bands"],
  "otherEquipmentAccess": "",
  "timeCommitment": {
    "daysPerWeek": 3,
    "minutesPerSession": 30,
    "preferredTimeOfDay": "Flexible"
  }
}
```

### Sample 4: Weight Loss Focus

```json
{
  "primaryGoal": "Lose weight",
  "medicalClearance": "No",
  "currentPain": {
    "hasPain": false
  },
  "activityFrequency": "1–2",
  "physicalFunction": "Good",
  "intentToChange": "Yes",
  "importance": 9,
  "confidence": 4,
  "sleep": "Less than 5",
  "tobaccoUse": "No",
  "activityPreferences": ["Walking/hiking", "Group classes", "Cardio equipment"],
  "otherActivityPreferences": "",
  "equipmentAccess": ["Gym with machines/weights", "Cardio equipment"],
  "otherEquipmentAccess": "",
  "timeCommitment": {
    "daysPerWeek": 5,
    "minutesPerSession": 45,
    "preferredTimeOfDay": "Morning"
  }
}
```

### Sample 5: Advanced Athlete

```json
{
  "primaryGoal": "Gain strength",
  "medicalClearance": "No",
  "currentPain": {
    "hasPain": true,
    "description": "Minor shoulder discomfort from previous rotator cuff injury, managed with proper warm-up"
  },
  "activityFrequency": "5–7",
  "physicalFunction": "Excellent",
  "intentToChange": "Yes",
  "importance": 10,
  "confidence": 9,
  "sleep": "7–8",
  "tobaccoUse": "No",
  "activityPreferences": ["Strength training", "Sports", "Other"],
  "otherActivityPreferences": "Olympic weightlifting and CrossFit",
  "equipmentAccess": ["Gym with machines/weights", "Other"],
  "otherEquipmentAccess": "Olympic lifting platform, bumper plates, and specialty bars",
  "timeCommitment": {
    "daysPerWeek": 6,
    "minutesPerSession": 90,
    "preferredTimeOfDay": "Afternoon"
  }
}
```

### Sample 6: Senior Wellness

```json
{
  "primaryGoal": "Feel better/energized",
  "medicalClearance": "Yes",
  "currentPain": {
    "hasPain": true,
    "description": "Arthritis in knees and hips, limits high-impact activities"
  },
  "activityFrequency": "1–2",
  "physicalFunction": "Fair",
  "intentToChange": "Not sure",
  "importance": 7,
  "confidence": 3,
  "sleep": "5–6",
  "tobaccoUse": "No",
  "activityPreferences": ["Walking/hiking", "Yoga/stretching", "Swimming"],
  "otherActivityPreferences": "",
  "equipmentAccess": ["Pool", "Outdoor space"],
  "otherEquipmentAccess": "",
  "timeCommitment": {
    "daysPerWeek": 2,
    "minutesPerSession": 25,
    "preferredTimeOfDay": "Morning"
  }
}
```

### Sample 7: Busy Professional

```json
{
  "primaryGoal": "Improve health",
  "medicalClearance": "No",
  "currentPain": {
    "hasPain": false
  },
  "activityFrequency": "0",
  "physicalFunction": "Good",
  "intentToChange": "Yes",
  "importance": 8,
  "confidence": 6,
  "sleep": "5–6",
  "tobaccoUse": "No",
  "activityPreferences": ["Home workouts", "Strength training"],
  "otherActivityPreferences": "",
  "equipmentAccess": ["Dumbbells or resistance bands"],
  "otherEquipmentAccess": "",
  "timeCommitment": {
    "daysPerWeek": 3,
    "minutesPerSession": 20,
    "preferredTimeOfDay": "Flexible"
  }
}
```

### Sample 8: Group Fitness Enthusiast

```json
{
  "primaryGoal": "Feel better/energized",
  "medicalClearance": "No",
  "currentPain": {
    "hasPain": false
  },
  "activityFrequency": "3–4",
  "physicalFunction": "Excellent",
  "intentToChange": "Yes",
  "importance": 9,
  "confidence": 8,
  "sleep": "7–8",
  "tobaccoUse": "No",
  "activityPreferences": ["Group classes", "Yoga/stretching", "Cycling"],
  "otherActivityPreferences": "",
  "equipmentAccess": ["Gym with machines/weights", "Cardio equipment"],
  "otherEquipmentAccess": "",
  "timeCommitment": {
    "daysPerWeek": 4,
    "minutesPerSession": 50,
    "preferredTimeOfDay": "Evening"
  }
}
```

### Sample 9: Outdoor Enthusiast

```json
{
  "primaryGoal": "Improve health",
  "medicalClearance": "No",
  "currentPain": {
    "hasPain": false
  },
  "activityFrequency": "3–4",
  "physicalFunction": "Good",
  "intentToChange": "Yes",
  "importance": 8,
  "confidence": 7,
  "sleep": "7–8",
  "tobaccoUse": "No",
  "activityPreferences": ["Walking/hiking", "Cycling", "Other"],
  "otherActivityPreferences": "Trail running and mountain biking",
  "equipmentAccess": ["Outdoor space", "Other"],
  "otherEquipmentAccess": "Mountain bike and hiking gear",
  "timeCommitment": {
    "daysPerWeek": 4,
    "minutesPerSession": 60,
    "preferredTimeOfDay": "Morning"
  }
}
```

### Sample 10: Rehabilitation Focus

```json
{
  "primaryGoal": "Reduce pain",
  "medicalClearance": "Yes",
  "currentPain": {
    "hasPain": true,
    "description": "Recovering from ACL surgery 6 months ago, cleared for exercise but need to rebuild strength gradually"
  },
  "activityFrequency": "1–2",
  "physicalFunction": "Poor",
  "intentToChange": "Yes",
  "importance": 10,
  "confidence": 5,
  "sleep": "7–8",
  "tobaccoUse": "No",
  "activityPreferences": ["Strength training", "Yoga/stretching", "Swimming"],
  "otherActivityPreferences": "",
  "equipmentAccess": ["Pool", "Dumbbells or resistance bands"],
  "otherEquipmentAccess": "",
  "timeCommitment": {
    "daysPerWeek": 3,
    "minutesPerSession": 30,
    "preferredTimeOfDay": "Afternoon"
  }
}
```

---

## Question Flow & Validation Summary

### Total Questions: 13

1. Primary Goal (required)
2. Medical Clearance (required)
3. Current Pain (required, conditional text)
4. Activity Frequency (required)
5. Physical Function (required)
6. Intent to Change (required)
7. Importance Scale (required, 0-10)
8. Confidence Scale (required, 0-10)
9. Sleep (required)
10. Tobacco Use (required)
11. Activity Preferences (required, multi-select)
12. Equipment Access (required, multi-select)
13. Time Commitment (required, composite)

### Validation Rules

- **All questions are required**
- **Text areas**: Max 1000 characters
- **Numeric inputs**: 
  - Days per week: 0-7
  - Minutes per session: 5-180
  - Scales: 0-10
- **Conditional fields**:
  - Pain description required if `hasPain = true`
  - Other text fields shown only when "Other" is selected
- **Multi-select**: At least one option must be selected

### Progress Tracking

- Progress bar shows: `(currentQuestionIndex + 1) / 13 * 100%`
- Navigation: Back button (disabled on Q1), Continue/Complete button (disabled until valid)

---

## JSON Schema Reference

For programmatic validation, refer to:
`/app/legacy/survey/intake-survey-questions.json`

This file contains the full JSON Schema definition with all validation rules.

---

**Last Updated**: 2025-01-10
**Survey Version**: 1.0 (Comprehensive)
