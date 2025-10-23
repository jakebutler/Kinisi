import { jest } from '@jest/globals';

// Provide a single mutable mock server-side Supabase client (do not replace reference)
let mockSupabase: any = {
  auth: {
    getUser: jest.fn(),
  },
};

// Mock dependencies BEFORE importing route
jest.mock('@/utils/llm', () => ({ callLLMWithPrompt: jest.fn() }));
jest.mock('@/utils/programDataHelpers', () => ({
  getProgramById: jest.fn(),
  getAvailableExercises: jest.fn(),
  updateProgramJson: jest.fn(),
}));
jest.mock('@/utils/programPromptTemplate', () => ({
  buildProgramRevisionPrompt: jest.fn(),
}));
jest.mock('@/utils/validateProgramOutput', () => ({
  validateProgramOutput: jest.fn(),
}));
jest.mock('@/utils/supabaseServer', () => ({
  createSupabaseServerClient: jest.fn(),
}));

import { POST as revisePOST } from '@/app/api/program/[id]/revise/route';
// Using a simple stub for the request with a json() method to avoid NextRequest constructor quirks in tests
import { callLLMWithPrompt } from '@/utils/llm';
import { getProgramById, getAvailableExercises, updateProgramJson } from '@/utils/programDataHelpers';
import { buildProgramRevisionPrompt } from '@/utils/programPromptTemplate';
import { validateProgramOutput } from '@/utils/validateProgramOutput';
import { createSupabaseServerClient } from '@/utils/supabaseServer';

const url = (id: string) => `http://localhost/api/program/${id}/revise`;

describe('API: POST /api/program/[id]/revise', () => {
  let supabaseInstance: any;
  const programId = '550e8400-e29b-41d4-a716-446655440000';
  const baseBody = { feedback: 'Please increase upper body volume by 1-2 sets.' };
  const mockProgram = { id: programId, program_json: { weeks: [] }, status: 'draft', user_id: 'user-1' };
  const mockExercises = [
    { exercise_id: 'pushup', name: 'Push-up' },
    { exercise_id: 'row', name: 'Row' },
  ];
  const mockPrompt = 'REVISE_PROMPT';
  const mockLLMResponse = {
    weeks: [
      { week: 1, sessions: [{ session: 1, goal: 'Strength', uid: 'test-session-id', exercises: [{ exercise_id: 'pushup', sets: 4, reps: 10, notes: '' }] }] },
    ],
  };
  // The API converts ExerciseProgramPayload to ProgramJson format
  const expectedProgramJson = {
    weeks: mockLLMResponse.weeks.map((week: any) => ({
      weekNumber: week.week,
      goal: week.sessions[0]?.goal || `Week ${week.week}`,
      sessions: week.sessions.map((session: any) => ({
        id: session.uid || 'test-session-id',
        name: session.session.toString(),
        goal: session.goal,
        exercises: session.exercises.map((exercise: any) => ({
          id: exercise.exercise_id,
          name: exercise.exercise_id,
          sets: exercise.sets,
          reps: exercise.reps?.toString(),
          targetMuscles: [],
          instructions: exercise.notes || ''
        }))
      }))
    }))
  };
  const mockUpdated = { id: programId, status: 'draft', program_json: expectedProgramJson };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reuse a single supabase instance; reset spies per test
    mockSupabase.auth.getUser.mockReset();
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    supabaseInstance = mockSupabase;
    (createSupabaseServerClient as jest.Mock).mockResolvedValue(supabaseInstance);
    (getProgramById as jest.Mock).mockResolvedValue(mockProgram);
    (getAvailableExercises as jest.Mock).mockResolvedValue(mockExercises);
    (buildProgramRevisionPrompt as jest.Mock).mockReturnValue(mockPrompt);
    (callLLMWithPrompt as jest.Mock).mockResolvedValue(mockLLMResponse);
    (validateProgramOutput as jest.Mock).mockReturnValue({ valid: true });
    (updateProgramJson as jest.Mock).mockResolvedValue(mockUpdated);
  });

  it('returns 200 with updated program on success', async () => {
    const req = { json: async () => baseBody } as any;
    const res: any = await revisePOST(req as any, { params: { id: programId } } as any);
    if (res.status !== 200) {
      const errBody = await res.json();
      // Temporary debug log to diagnose failure
      // eslint-disable-next-line no-console
      console.log('Revise route failure debug:', res.status, errBody);
      // eslint-disable-next-line no-console
      console.log('createSupabaseServerClient is mock?', jest.isMockFunction(createSupabaseServerClient));
      // eslint-disable-next-line no-console
      console.log('createSupabaseServerClient calls:', (createSupabaseServerClient as jest.Mock).mock?.calls?.length ?? 'n/a');
    }
    expect(createSupabaseServerClient).toHaveBeenCalled();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual(mockUpdated);

    // Verify auth was called
    expect(supabaseInstance.auth.getUser).toHaveBeenCalled();
    expect(getProgramById).toHaveBeenCalledWith(programId, expect.anything());
    expect(getAvailableExercises).toHaveBeenCalled();
    expect(buildProgramRevisionPrompt).toHaveBeenCalledWith(mockProgram.program_json, baseBody.feedback, mockExercises, undefined);
    expect(callLLMWithPrompt).toHaveBeenCalledWith(mockPrompt);
    expect(validateProgramOutput).toHaveBeenCalledWith(mockLLMResponse);
    expect(updateProgramJson).toHaveBeenCalledWith(programId, expectedProgramJson, 'draft', expect.anything());
  });

  it('returns 400 when feedback is missing', async () => {
    const req = { json: async () => ({}) } as any;
    const res: any = await revisePOST(req as any, { params: { id: programId } } as any);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/Feedback is required/);
  });

  it('returns 404 when program not found', async () => {
    (getProgramById as jest.Mock).mockResolvedValueOnce(null);
    const missingId = '550e8400-e29b-41d4-a716-446655440001';
    const req = { json: async () => baseBody } as any;
    const res: any = await revisePOST(req as any, { params: { id: missingId } } as any);
    expect(res.status).toBe(404);
  });

  it('returns 502 when LLM fails', async () => {
    (callLLMWithPrompt as jest.Mock).mockRejectedValueOnce(new Error('LLM down'));
    const req = { json: async () => baseBody } as any;
    const res: any = await revisePOST(req as any, { params: { id: programId } } as any);
    expect(res.status).toBe(502);
  });

  it('returns 422 when validation fails', async () => {
    (validateProgramOutput as jest.Mock).mockReturnValueOnce({ valid: false, error: 'bad' });
    const req = { json: async () => baseBody } as any;
    const res: any = await revisePOST(req as any, { params: { id: programId } } as any);
    expect(res.status).toBe(422);
  });

  it('respects exerciseFilter and assessment params', async () => {
    const body = { feedback: 'Tune', exerciseFilter: { primary_muscles: ['chest'] }, assessment: 'Context' };
    const req = { json: async () => body } as any;
    await revisePOST(req as any, { params: { id: programId } } as any);
    expect(getAvailableExercises).toHaveBeenCalledWith({ primary_muscles: ['chest'] }, expect.anything());
    expect(buildProgramRevisionPrompt).toHaveBeenCalledWith(mockProgram.program_json, 'Tune', mockExercises, 'Context');
  });

  it('returns 500 if saving update fails', async () => {
    (updateProgramJson as jest.Mock).mockRejectedValueOnce(new Error('db fail'));
    const req = { json: async () => baseBody } as any;
    const res: any = await revisePOST(req as any, { params: { id: programId } } as any);
    expect(res.status).toBe(500);
  });
});
