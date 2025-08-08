import { jest } from '@jest/globals';

// Mock the getAvailableExercises function
export const getAvailableExercises = jest.fn().mockResolvedValue([
  {
    exercise_id: 'pushup',
    name: 'Push-up',
    primary_muscles: ['chest'],
    equipment: ['bodyweight']
  },
  {
    exercise_id: 'squat',
    name: 'Squat',
    primary_muscles: ['legs'],
    equipment: ['bodyweight']
  },
  {
    exercise_id: 'plank',
    name: 'Plank',
    primary_muscles: ['core'],
    equipment: ['bodyweight']
  }
]);

// Mock other functions used in tests
export const saveExerciseProgram = jest.fn().mockResolvedValue({
  id: 'program-123',
  status: 'created'
});

export const getProgramById = jest.fn().mockImplementation((id: string) => {
  if (id === 'nonexistent-id') {
    return Promise.reject(new Error('Program not found'));
  }
  return Promise.resolve({
    id,
    user_id: 'user-123',
    program_json: { weeks: [] },
    status: 'draft'
  });
});

export const saveProgramFeedback = jest.fn().mockImplementation((data: any) => {
  if (data.program_id === 'bad') {
    return Promise.reject(new Error('Invalid program ID'));
  }
  return Promise.resolve({
    id: 'feedback-123',
    program_id: data.program_id,
    feedback: data.feedback
  });
});

export const approveProgram = jest.fn().mockImplementation((id: string) => {
  if (id === 'nonexistent-id') {
    return Promise.reject(new Error('Program not found'));
  }
  return Promise.resolve({
    id,
    status: 'approved',
    approved_at: new Date().toISOString()
  });
});

export const updateProgramJson = jest.fn().mockImplementation((id: string, program_json: any, status?: string) => {
  if (id === 'bad') {
    return Promise.reject(new Error('Invalid program ID'));
  }
  return Promise.resolve({
    id,
    program_json,
    status: status || 'draft'
  });
});

// Export as default as well for different import styles
export default {
  getAvailableExercises,
  saveExerciseProgram,
  getProgramById,
  saveProgramFeedback,
  approveProgram,
  updateProgramJson
};
