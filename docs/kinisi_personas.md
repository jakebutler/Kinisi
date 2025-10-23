# Kinisi UX Personas & Test Data (Validated)

This document contains 4 UX personas and their corresponding validated Kinisi intake survey datasets.

---
## Persona — Jordan Lee

**Role:** Marketing Manager & Parent of Two  
**Location:** Seattle, WA  
**Age:** 38  
**Background:** Former recreational runner, currently balancing remote work and family life.  

**Goals & Motivations:** Wants to regain energy, relieve mild back pain, and build consistent exercise habits without needing gym time.  
**Pain Points:** Struggles to find time for workouts.; Frustrated by confusing fitness apps and unrealistic routines.; Mild back pain from prolonged sitting and lifting kids.  
**Key Workflows:** Completes intake survey focused on time limitations and pain management.; Reviews AI assessment summary for mobility and energy improvement.; Follows a 3-day/week beginner home program.; Provides feedback after 2 weeks on program difficulty.  
**Description:** Jordan uses Kinisi before work or during lunch breaks for 20-minute guided sessions. Appreciates the AI’s realistic planning and reminders for movement during the day.

### Test Data (survey_responses.response)
```json
{
  "PersonaName": "Jordan Lee",
  "TypicalInputData": {
    "primaryGoal": "Improve health",
    "medicalClearance": "No",
    "currentPain": {
      "hasPain": true,
      "description": "Occasional lower back tightness from sitting and lifting kids"
    },
    "activityFrequency": "1\u20132",
    "physicalFunction": "Fair",
    "intentToChange": "Yes",
    "importance": 9,
    "confidence": 6,
    "sleep": "5\u20136",
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
  },
  "PreferredFeatures": [
    "AI-generated daily reminders",
    "Short workout recommendations",
    "Progress tracking"
  ],
  "SampleUsageScenario": "Jordan opens Kinisi on weekday mornings to follow a 25-minute recovery workout. After 2 weeks, provides feedback that the intensity feels right but requests more stretching."
}
```

---
## Persona — Taylor Nguyen

**Role:** Recent College Graduate  
**Location:** Austin, TX  
**Age:** 25  
**Background:** Former student athlete who lost fitness habits after graduation.  

**Goals & Motivations:** Wants to rebuild consistency and confidence in their fitness routine, focusing on bodyweight and light resistance training.  
**Pain Points:** Intimidated by gym culture.; Overwhelmed by conflicting online advice.; Low confidence in maintaining motivation alone.  
**Key Workflows:** Completes intake survey highlighting beginner level and limited equipment.; Reviews personalized fitness plan focused on progressive bodyweight routines.; Uses Kinisi’s guided videos and milestone tracking.; Requests modifications after completing first month.  
**Description:** Taylor uses Kinisi every other evening, celebrating small progress milestones. Feels supported by clear AI feedback and the flexible schedule.

### Test Data (survey_responses.response)
```json
{
  "PersonaName": "Taylor Nguyen",
  "TypicalInputData": {
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
    "sleep": "7\u20138",
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
  },
  "PreferredFeatures": [
    "Gamified progress streaks",
    "AI-curated weekly plan",
    "Motivational tips"
  ],
  "SampleUsageScenario": "Taylor completes the Kinisi intake survey, gets a strength-focused plan using resistance bands, and follows evening workouts 3x/week while tracking progress."
}
```

---
## Persona — Samira Patel

**Role:** Software Engineer, Amateur Triathlete  
**Location:** Denver, CO  
**Age:** 33  
**Background:** Used to train for triathlons, paused for two years due to work burnout.  

**Goals & Motivations:** Wants to regain endurance and strength gradually while preventing overuse injuries.  
**Pain Points:** Fear of overtraining.; Struggles balancing consistency with recovery.; Bored by generic training apps.  
**Key Workflows:** Completes intake survey with focus on strength and conditioning.; Reviews AI’s personalized split routine combining strength + cardio.; Uses weekly summaries and feedback options.; Refines the plan to include more flexibility work.  
**Description:** Samira loves Kinisi’s balance between structure and adaptability. She uses the app for hybrid strength-yoga sessions that fit around her cycling schedule.

### Test Data (survey_responses.response)
```json
{
  "PersonaName": "Samira Patel",
  "TypicalInputData": {
    "primaryGoal": "Gain strength",
    "medicalClearance": "No",
    "currentPain": {
      "hasPain": true,
      "description": "Mild knee discomfort from long cycling sessions"
    },
    "activityFrequency": "3\u20134",
    "physicalFunction": "Good",
    "intentToChange": "Yes",
    "importance": 9,
    "confidence": 8,
    "sleep": "7\u20138",
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
  },
  "PreferredFeatures": [
    "Program customization by recovery level",
    "AI injury-prevention suggestions",
    "Progressive load tracking"
  ],
  "SampleUsageScenario": "Samira reviews her Kinisi plan combining gym and yoga days, logs performance notes weekly, and uses the AI feedback tool to adjust intensity after knee discomfort."
}
```

---
## Persona — Carlos Ramirez

**Role:** Customer Support Specialist (Remote)  
**Location:** Chicago, IL  
**Age:** 45  
**Background:** Sedentary work for over a decade, dealing with chronic neck and shoulder pain.  

**Goals & Motivations:** Seeks low-impact, pain-free movement to restore function and energy, not aesthetics.  
**Pain Points:** Persistent stiffness and discomfort.; Low confidence in exercise safety.; Finds traditional workout apps irrelevant.  
**Key Workflows:** Completes intake survey emphasizing pain areas and limited mobility.; Receives an AI-curated physical therapy-style recovery program.; Tracks pain levels weekly and adjusts intensity automatically.; Provides feedback to increase flexibility-focused sessions.  
**Description:** Carlos uses Kinisi daily for short mobility sessions between meetings. The program’s adaptive recovery feedback keeps him consistent without fear of injury.

### Test Data (survey_responses.response)
```json
{
  "PersonaName": "Carlos Ramirez",
  "TypicalInputData": {
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
    "sleep": "5\u20136",
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
  },
  "PreferredFeatures": [
    "Adaptive recovery plans",
    "Pain tracking over time",
    "Gentle mobility reminders"
  ],
  "SampleUsageScenario": "Carlos opens Kinisi during work breaks to complete 15-minute mobility sessions targeting neck and shoulders. The AI adjusts his plan as pain scores improve."
}
```

---
