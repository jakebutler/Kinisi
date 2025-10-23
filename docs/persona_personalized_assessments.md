# Kinisi Persona Personalized Assessments

This document contains personalized assessments generated for each of the Kinisi UX personas using the app's LLM assessment generation system.

## Assessment Generation Process

Each assessment was generated using the following process:
1. Used the persona's survey response data from `kinisi_personas.md`
2. Applied the LLM prompt from `utils/assessmentChain.ts` (lines 115-131)
3. Generated personalized assessment following the app's assessment generation workflow

## LLM Prompt Template

The assessment generation uses this prompt template (fallback version from `utils/assessmentChain.ts`):

```
You are an experienced fitness coach creating a personalized initial assessment.
Input is a set of survey answers about the user's goals, history, and constraints.
Write a concise, empathetic assessment that:
1) Summarizes current status and goals
2) Highlights key constraints or risks (only if present in SURVEY ANSWERS)
3) Recommends focus areas for the next 4–6 weeks
4) Suggests 2–3 actionable next steps

Strict rules:
- Use ONLY facts provided in SURVEY ANSWERS. Do NOT invent symptoms or conditions.
- If pain is not present in SURVEY ANSWERS, do not mention pain.
- Use CONTEXT only when it directly supports SURVEY ANSWERS.

Format as short paragraphs with clear headings. Keep it under 300 words.

SURVEY ANSWERS:
{{survey}}
```

Additional strict rules:
- Do NOT instruct the user to take a separate physical fitness test. Base your assessment solely on SURVEY ANSWERS.
- Do NOT introduce symptoms, injuries, or constraints that are not present in SURVEY ANSWERS.

---

## Persona — Jordan Lee

### Survey Response Data
```json
{
  "primaryGoal": "Improve health",
  "medicalClearance": "No",
  "currentPain": {
    "hasPain": true,
    "description": "Occasional lower back tightness from sitting and lifting kids"
  },
  "activityFrequency": "1–2",
  "physicalFunction": "Fair",
  "intentToChange": "Yes",
  "importance": 9,
  "confidence": 6,
  "sleep": "5–6",
  "tobaccoUse": "No",
  "activityPreferences": [
    "Home workouts",
    "Walking/hiking"
  ],
  "otherActivityPreferences": "",
  "equipmentAccess": [
    "None / Bodyweight only",
    "Outdoor space"
  ],
  "otherEquipmentAccess": "",
  "timeCommitment": {
    "daysPerWeek": 3,
    "minutesPerSession": 25,
    "preferredTimeOfDay": "Morning"
  }
}
```

### Generated Assessment

**Current Status & Goals**
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
3. Add gentle stretching sessions before bedtime to address back tightness

---

## Persona — Taylor Nguyen

### Survey Response Data
```json
{
  "primaryGoal": "Gain strength",
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
  "activityPreferences": [
    "Strength training",
    "Home workouts"
  ],
  "otherActivityPreferences": "",
  "equipmentAccess": [
    "Dumbbells or resistance bands"
  ],
  "otherEquipmentAccess": "",
  "timeCommitment": {
    "daysPerWeek": 3,
    "minutesPerSession": 30,
    "preferredTimeOfDay": "Evening"
  }
}
```

### Generated Assessment

**Current Status & Goals**
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
3. Gradually increase resistance and add variety as consistency improves

---

## Persona — Samira Patel

### Survey Response Data
```json
{
  "primaryGoal": "Gain strength",
  "medicalClearance": "No",
  "currentPain": {
    "hasPain": true,
    "description": "Mild knee discomfort from long cycling sessions"
  },
  "activityFrequency": "3–4",
  "physicalFunction": "Good",
  "intentToChange": "Yes",
  "importance": 9,
  "confidence": 8,
  "sleep": "7–8",
  "tobaccoUse": "No",
  "activityPreferences": [
    "Cycling",
    "Strength training",
    "Yoga/stretching"
  ],
  "otherActivityPreferences": "",
  "equipmentAccess": [
    "Gym with machines/weights",
    "Cardio equipment"
  ],
  "otherEquipmentAccess": "",
  "timeCommitment": {
    "daysPerWeek": 5,
    "minutesPerSession": 60,
    "preferredTimeOfDay": "Morning"
  }
}
```

### Generated Assessment

**Current Status & Goals**
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
3. Monitor knee discomfort and adjust intensity as needed

---

## Persona — Carlos Ramirez

### Survey Response Data
```json
{
  "primaryGoal": "Reduce pain",
  "medicalClearance": "Yes",
  "currentPain": {
    "hasPain": true,
    "description": "Chronic neck and shoulder stiffness from desk posture"
  },
  "activityFrequency": "0",
  "physicalFunction": "Poor",
  "intentToChange": "Yes",
  "importance": 10,
  "confidence": 4,
  "sleep": "5–6",
  "tobaccoUse": "No",
  "activityPreferences": [
    "Yoga/stretching",
    "Home workouts"
  ],
  "otherActivityPreferences": "",
  "equipmentAccess": [
    "None / Bodyweight only"
  ],
  "otherEquipmentAccess": "",
  "timeCommitment": {
    "daysPerWeek": 4,
    "minutesPerSession": 15,
    "preferredTimeOfDay": "Afternoon"
  }
}
```

### Generated Assessment

**Current Status & Goals**
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
3. Gradually increase duration as comfort and confidence improve

---

**Last Updated**: 2025-01-22
**Assessment Generation Version**: v2 (assessmentChain.ts fallback prompt)