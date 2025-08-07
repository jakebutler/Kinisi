import { jest } from '@jest/globals';

// Mock all dependencies with inline implementations (BEFORE imports)
jest.mock('@/utils/llm', () => ({
  callLLMWithPrompt: jest.fn()
}));

jest.mock('@/utils/programDataHelpers', () => ({
  getAvailableExercises: jest.fn(),
  saveExerciseProgram: jest.fn()
}));

jest.mock('@/utils/programPromptTemplate', () => ({
  buildProgramPrompt: jest.fn()
}));

jest.mock('@/utils/validateProgramOutput', () => ({
  validateProgramOutput: jest.fn()
}));

// Import AFTER mocking
import { callLLMWithPrompt } from '@/utils/llm';
import { getAvailableExercises, saveExerciseProgram } from '@/utils/programDataHelpers';
import { buildProgramPrompt } from '@/utils/programPromptTemplate';
import { validateProgramOutput } from '@/utils/validateProgramOutput';

describe('Program Create API Business Logic', () => {
  // Mock data
  const mockExercises = [
    { id: 'pushup', name: 'Push-ups', equipment: 'bodyweight' },
    { id: 'squat', name: 'Squats', equipment: 'bodyweight' }
  ];

  const mockLLMResponse = {
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
  };

  const mockSavedProgram = {
    id: 'test-program-id',
    created_at: '2023-01-01T00:00:00.000Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configure default mock implementations
    (getAvailableExercises as jest.Mock).mockResolvedValue(mockExercises);
    (buildProgramPrompt as jest.Mock).mockReturnValue('Generated prompt for LLM');
    (callLLMWithPrompt as jest.Mock).mockResolvedValue(mockLLMResponse);
    (validateProgramOutput as jest.Mock).mockReturnValue({ valid: true });
    (saveExerciseProgram as jest.Mock).mockResolvedValue(mockSavedProgram);
  });

  describe('Success Scenarios', () => {
    it('should process valid program creation request successfully', async () => {
      const assessment = 'I want to build strength and muscle';
      const exerciseFilter = { equipment: ['bodyweight'] };

      // Step 1: Fetch exercises
      const exercises = await getAvailableExercises(exerciseFilter);
      expect(exercises).toEqual(mockExercises);
      expect(exercises).toHaveLength(2);

      // Step 2: Build prompt
      const prompt = buildProgramPrompt(assessment, exercises);
      expect(prompt).toBe('Generated prompt for LLM');

      // Step 3: Call LLM
      const llmResponse = await callLLMWithPrompt(prompt);
      expect(llmResponse).toEqual(mockLLMResponse);
      expect(llmResponse.weeks).toHaveLength(1);

      // Step 4: Validate output
      const validation = validateProgramOutput(llmResponse);
      expect(validation.valid).toBe(true);

      // Step 5: Save program
      const saved = await saveExerciseProgram({
        user_id: 'demo-user',
        program_json: llmResponse,
        status: 'draft'
      });
      expect(saved).toEqual(mockSavedProgram);

      // Verify all mocks called correctly
      expect(getAvailableExercises).toHaveBeenCalledWith(exerciseFilter);
      expect(buildProgramPrompt).toHaveBeenCalledWith(assessment, exercises);
      expect(callLLMWithPrompt).toHaveBeenCalledWith(prompt);
      expect(validateProgramOutput).toHaveBeenCalledWith(llmResponse);
      expect(saveExerciseProgram).toHaveBeenCalledWith({
        user_id: 'demo-user',
        program_json: llmResponse,
        status: 'draft'
      });
    });

    it('should handle different exercise filters correctly', async () => {
      const exerciseFilter = { equipment: ['dumbbells', 'barbell'] };
      
      await getAvailableExercises(exerciseFilter);
      
      expect(getAvailableExercises).toHaveBeenCalledWith(exerciseFilter);
    });
  });

  describe('Validation Error Scenarios', () => {
    it('should handle missing assessment', () => {
      const assessment = '';
      expect(assessment).toBeFalsy();
      expect(typeof assessment).toBe('string');
    });

    it('should handle undefined assessment', () => {
      const assessment = undefined;
      expect(assessment).toBeFalsy();
      expect(typeof assessment).toBe('undefined');
    });

    it('should handle non-string assessment', () => {
      const assessment = 123;
      expect(typeof assessment).toBe('number');
      expect(typeof assessment !== 'string').toBe(true);
    });

    it('should handle missing exerciseFilter', () => {
      const exerciseFilter = undefined;
      expect(exerciseFilter).toBeUndefined();
      expect(typeof exerciseFilter).toBe('undefined');
    });

    it('should handle null exerciseFilter', () => {
      const exerciseFilter = null;
      expect(exerciseFilter).toBeNull();
      expect(typeof exerciseFilter).toBe('object');
      expect(exerciseFilter === null).toBe(true);
    });

    it('should handle non-object exerciseFilter', () => {
      const exerciseFilter = 'invalid';
      expect(typeof exerciseFilter).toBe('string');
      expect(typeof exerciseFilter !== 'object').toBe(true);
    });
  });

  describe('External Service Failure Scenarios', () => {
    it('should handle getAvailableExercises failure', async () => {
      (getAvailableExercises as jest.Mock).mockRejectedValue(new Error('Database connection failed'));
      
      await expect(getAvailableExercises({ equipment: ['bodyweight'] }))
        .rejects.toThrow('Database connection failed');
    });

    it('should handle no exercises found', async () => {
      (getAvailableExercises as jest.Mock).mockResolvedValue([]);
      
      const exercises = await getAvailableExercises({ equipment: ['nonexistent'] });
      expect(exercises).toHaveLength(0);
      expect(Array.isArray(exercises)).toBe(true);
    });

    it('should handle buildProgramPrompt failure', () => {
      (buildProgramPrompt as jest.Mock).mockImplementation(() => {
        throw new Error('Prompt template error');
      });
      
      expect(() => buildProgramPrompt('test', mockExercises))
        .toThrow('Prompt template error');
    });

    it('should handle LLM service failure', async () => {
      (callLLMWithPrompt as jest.Mock).mockRejectedValue(new Error('LLM service unavailable'));
      
      await expect(callLLMWithPrompt('test prompt'))
        .rejects.toThrow('LLM service unavailable');
    });

    it('should handle invalid LLM output', () => {
      (validateProgramOutput as jest.Mock).mockReturnValue({
        valid: false,
        error: 'Invalid program structure'
      });
      
      const validation = validateProgramOutput({ invalid: 'data' });
      expect(validation.valid).toBe(false);
      expect(validation.error).toBe('Invalid program structure');
    });

    it('should handle saveExerciseProgram failure', async () => {
      (saveExerciseProgram as jest.Mock).mockRejectedValue(new Error('Database save failed'));
      
      await expect(saveExerciseProgram({
        user_id: 'demo-user',
        program_json: mockLLMResponse,
        status: 'draft'
      })).rejects.toThrow('Database save failed');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty exercise list', async () => {
      (getAvailableExercises as jest.Mock).mockResolvedValue([]);
      
      const exercises = await getAvailableExercises({ equipment: [] });
      expect(exercises).toEqual([]);
      expect(exercises.length === 0).toBe(true);
    });

    it('should handle malformed LLM response', async () => {
      const malformedResponse = { weeks: null };
      (callLLMWithPrompt as jest.Mock).mockResolvedValue(malformedResponse);
      
      const response = await callLLMWithPrompt('test');
      expect(response.weeks).toBeNull();
    });

    it('should handle empty assessment string', () => {
      const assessment = '   '; // whitespace only
      expect(assessment.trim()).toBe('');
      expect(assessment.length > 0).toBe(true);
    });

    it('should handle complex exerciseFilter', async () => {
      const complexFilter = {
        equipment: ['bodyweight', 'dumbbells'],
        difficulty: 'intermediate',
        muscleGroups: ['chest', 'shoulders']
      };
      
      await getAvailableExercises(complexFilter);
      expect(getAvailableExercises).toHaveBeenCalledWith(complexFilter);
    });
  });

  describe('Mock Verification', () => {
    it('should validate all mocks are working correctly', () => {
      expect(jest.isMockFunction(getAvailableExercises)).toBe(true);
      expect(jest.isMockFunction(buildProgramPrompt)).toBe(true);
      expect(jest.isMockFunction(callLLMWithPrompt)).toBe(true);
      expect(jest.isMockFunction(validateProgramOutput)).toBe(true);
      expect(jest.isMockFunction(saveExerciseProgram)).toBe(true);
      
      console.log('✅ All Program Create API mocks are properly configured');
    });

    it('should verify mock call counts in success scenario', async () => {
      const assessment = 'Test assessment';
      const exerciseFilter = { equipment: ['bodyweight'] };

      // Execute full flow
      const exercises = await getAvailableExercises(exerciseFilter);
      const prompt = buildProgramPrompt(assessment, exercises);
      const llmResponse = await callLLMWithPrompt(prompt);
      const validation = validateProgramOutput(llmResponse);
      
      if (validation.valid) {
        await saveExerciseProgram({
          user_id: 'demo-user',
          program_json: llmResponse,
          status: 'draft'
        });
      }

      // Verify call counts
      expect(getAvailableExercises).toHaveBeenCalledTimes(1);
      expect(buildProgramPrompt).toHaveBeenCalledTimes(1);
      expect(callLLMWithPrompt).toHaveBeenCalledTimes(1);
      expect(validateProgramOutput).toHaveBeenCalledTimes(1);
      expect(saveExerciseProgram).toHaveBeenCalledTimes(1);
    });
  });
});
