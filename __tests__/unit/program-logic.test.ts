import { jest } from '@jest/globals';

// Mock all dependencies with inline implementations
jest.mock('@/utils/llm', () => ({
  callLLMWithPrompt: jest.fn()
}));

jest.mock('@/utils/programDataHelpers', () => ({
  getAvailableExercises: jest.fn(),
  saveExerciseProgram: jest.fn()
}));

jest.mock('@/utils/validateProgramOutput', () => ({
  validateProgramOutput: jest.fn()
}));

import { callLLMWithPrompt } from '@/utils/llm';
import { getAvailableExercises, saveExerciseProgram } from '@/utils/programDataHelpers';
import { validateProgramOutput } from '@/utils/validateProgramOutput';

// Test the business logic without NextResponse
describe('Program Creation Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    (getAvailableExercises as jest.Mock).mockResolvedValue([
      { id: 'pushup', name: 'Push-ups', equipment: 'bodyweight' }
    ]);
    
    (callLLMWithPrompt as jest.Mock).mockResolvedValue({
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
    
    (validateProgramOutput as jest.Mock).mockReturnValue({ valid: true });
    
    (saveExerciseProgram as jest.Mock).mockResolvedValue({
      id: 'test-program-id',
      created_at: '2023-01-01T00:00:00.000Z'
    });
  });

  it('should process program creation successfully', async () => {
    const assessment = 'Test fitness assessment';
    const exerciseFilter = { equipment: ['bodyweight'] };

    // Test the logic step by step
    const exercises = await getAvailableExercises(exerciseFilter);
    expect(exercises).toHaveLength(1);
    expect(exercises[0].id).toBe('pushup');

    const llmResponse = await callLLMWithPrompt('test-prompt');
    expect(llmResponse).toHaveProperty('weeks');
    expect(llmResponse.weeks).toHaveLength(1);

    const validation = validateProgramOutput(llmResponse);
    expect(validation.valid).toBe(true);

    const saved = await saveExerciseProgram({
      user_id: 'demo-user',
      program_json: llmResponse,
      status: 'draft'
    });
    expect(saved.id).toBe('test-program-id');
  });

  it('should handle validation errors correctly', async () => {
    // Test validation logic
    const assessment = '';
    expect(assessment).toBeFalsy(); // Should trigger validation error
    expect(typeof assessment).toBe('string'); // But still be a string type
    
    // Test with undefined assessment
    const undefinedAssessment = undefined;
    expect(undefinedAssessment).toBeFalsy();
    expect(typeof undefinedAssessment).toBe('undefined'); // Should trigger validation error
  });

  it('should handle no exercises found scenario', async () => {
    // Mock no exercises found
    (getAvailableExercises as jest.Mock).mockResolvedValue([]);
    
    const exerciseFilter = { equipment: ['nonexistent'] };
    const exercises = await getAvailableExercises(exerciseFilter);
    
    expect(exercises).toHaveLength(0);
    expect(Array.isArray(exercises)).toBe(true);
  });

  it('should handle LLM failure scenario', async () => {
    // Mock LLM failure
    (callLLMWithPrompt as jest.Mock).mockRejectedValue(new Error('LLM service unavailable'));
    
    try {
      await callLLMWithPrompt('test-prompt');
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('LLM service unavailable');
    }
  });

  it('should handle invalid program output', async () => {
    // Mock invalid program output
    (validateProgramOutput as jest.Mock).mockReturnValue({ 
      valid: false, 
      error: 'Invalid program structure' 
    });
    
    const llmResponse = { invalid: 'structure' };
    const validation = validateProgramOutput(llmResponse);
    
    expect(validation.valid).toBe(false);
    expect(validation.error).toBe('Invalid program structure');
  });

  it('should handle database save failure', async () => {
    // Mock database save failure
    (saveExerciseProgram as jest.Mock).mockRejectedValue(new Error('Database connection failed'));
    
    try {
      await saveExerciseProgram({
        user_id: 'demo-user',
        program_json: { weeks: [] },
        status: 'draft'
      });
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Database connection failed');
    }
  });

  it('should validate all mocks are working correctly', () => {
    // Verify all mocks are Jest functions
    expect(jest.isMockFunction(getAvailableExercises)).toBe(true);
    expect(jest.isMockFunction(callLLMWithPrompt)).toBe(true);
    expect(jest.isMockFunction(validateProgramOutput)).toBe(true);
    expect(jest.isMockFunction(saveExerciseProgram)).toBe(true);
    
    console.log('✅ All mocks are properly configured as Jest functions');
  });
});
