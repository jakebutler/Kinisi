import { jest } from '@jest/globals';

// Mock the getAvailableExercises function
export const getAvailableExercises = jest.fn().mockResolvedValue([
  {
    exercise_id: 'pushup',
    name: 'Push-up',
    target_muscles: ['chest'],
    equipments: ['bodyweight']
  },
  {
    exercise_id: 'squat',
    name: 'Squat',
    target_muscles: ['legs'],
    equipments: ['bodyweight']
  },
  {
    exercise_id: 'plank',
    name: 'Plank',
    target_muscles: ['core'],
    equipments: ['bodyweight']
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

// Export as default as well for different import styles
export default {
  getAvailableExercises,
  saveExerciseProgram,
  getProgramById,
  saveProgramFeedback,
  approveProgram
};
