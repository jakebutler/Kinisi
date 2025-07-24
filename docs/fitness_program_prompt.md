# Fitness Program Generation LLM Prompt (Draft)

## Purpose
Generate a personalized, structured fitness program for a user based on their approved assessment.

## Input
- User's approved assessment (JSON/text)
- User goals, constraints, and preferences

## Output (Schema Example)
```json
{
  "programTitle": "4-Week Strength & Cardio Hybrid",
  "overview": "A balanced program for intermediate users focused on strength and fat loss.",
  "weeks": [
    {
      "week": 1,
      "days": [
        { "day": "Monday", "focus": "Upper Body Strength", "exercises": [
          { "name": "Bench Press", "sets": 4, "reps": 8, "notes": "Progressive overload" },
          { "name": "Pull-Ups", "sets": 3, "reps": 10, "notes": "Assisted if needed" }
        ] },
        { "day": "Tuesday", "focus": "Cardio/HIIT", "exercises": [ ... ] },
        ...
      ]
    },
    ...
  ],
  "specialNotes": "Increase weights each week by 2.5-5%. Rest at least 48h between strength sessions."
}
```

## Prompt Example
```
You are a fitness coach. Given the following user assessment, generate a 4-week personalized fitness program with a mix of strength and cardio. Structure the output as JSON. Include weekly breakdown, daily focus, exercise details, and special notes. Be concise, safe, and evidence-based.

User Assessment:
{assessment_json}
```

---
## (To be refined during implementation)
