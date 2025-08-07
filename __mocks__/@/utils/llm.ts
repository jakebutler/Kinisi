import { jest } from '@jest/globals';

export const callLLMWithPrompt = jest.fn();

// Default implementation (can be overridden in tests)
callLLMWithPrompt.mockResolvedValue({
  weeks: [
    {
      week: 1,
      sessions: [
        {
          session: 1,
          goal: "Strength",
          exercises: [
            { 
              exercise_id: "pushup", 
              sets: 3, 
              reps: 10, 
              notes: "Standard push-ups" 
            }
          ]
        }
      ]
    }
  ]
});

// Export as default as well for different import styles
export default {
  callLLMWithPrompt
};
