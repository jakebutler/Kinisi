import { jest } from '@jest/globals';

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

import { POST as revisePOST } from '@/app/api/program/[id]/revise/route';
import { NextRequest } from 'next/server';
import { callLLMWithPrompt } from '@/utils/llm';
import { getProgramById, getAvailableExercises, updateProgramJson } from '@/utils/programDataHelpers';
import { buildProgramRevisionPrompt } from '@/utils/programPromptTemplate';
import { validateProgramOutput } from '@/utils/validateProgramOutput';

const url = (id: string) => `http://localhost/api/program/${id}/revise`;

describe('API: POST /api/program/[id]/revise', () => {
  const programId = 'program-123';
  const baseBody = { feedback: 'Please increase upper body volume by 1-2 sets.' };
  const mockProgram = { id: programId, program_json: { weeks: [] }, status: 'draft' };
  const mockExercises = [
    { exercise_id: 'pushup', name: 'Push-up' },
    { exercise_id: 'row', name: 'Row' },
  ];
  const mockPrompt = 'REVISE_PROMPT';
  const mockLLMResponse = {
    weeks: [
      { week: 1, sessions: [{ session: 1, goal: 'Strength', exercises: [{ exercise_id: 'pushup', sets: 4, reps: 10, notes: '' }] }] },
    ],
  };
  const mockUpdated = { id: programId, status: 'draft', program_json: mockLLMResponse };

  beforeEach(() => {
    jest.clearAllMocks();
    (getProgramById as jest.Mock).mockResolvedValue(mockProgram);
    (getAvailableExercises as jest.Mock).mockResolvedValue(mockExercises);
    (buildProgramRevisionPrompt as jest.Mock).mockReturnValue(mockPrompt);
    (callLLMWithPrompt as jest.Mock).mockResolvedValue(mockLLMResponse);
    (validateProgramOutput as jest.Mock).mockReturnValue({ valid: true });
    (updateProgramJson as jest.Mock).mockResolvedValue(mockUpdated);
  });

  it('returns 200 with updated program on success', async () => {
    const req = new NextRequest(url(programId), { method: 'POST', body: JSON.stringify(baseBody) });
    const res: any = await revisePOST(req as any, { params: Promise.resolve({ id: programId }) } as any);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual(mockUpdated);

    expect(getProgramById).toHaveBeenCalledWith(programId);
    expect(getAvailableExercises).toHaveBeenCalled();
    expect(buildProgramRevisionPrompt).toHaveBeenCalledWith(mockProgram.program_json, baseBody.feedback, mockExercises, undefined);
    expect(callLLMWithPrompt).toHaveBeenCalledWith(mockPrompt);
    expect(validateProgramOutput).toHaveBeenCalledWith(mockLLMResponse);
    expect(updateProgramJson).toHaveBeenCalledWith(programId, mockLLMResponse, 'draft');
  });

  it('returns 400 when feedback is missing', async () => {
    const req = new NextRequest(url(programId), { method: 'POST', body: JSON.stringify({}) });
    const res: any = await revisePOST(req as any, { params: Promise.resolve({ id: programId }) } as any);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/Feedback is required/);
  });

  it('returns 404 when program not found', async () => {
    (getProgramById as jest.Mock).mockResolvedValueOnce(null);
    const req = new NextRequest(url('missing'), { method: 'POST', body: JSON.stringify(baseBody) });
    const res: any = await revisePOST(req as any, { params: Promise.resolve({ id: 'missing' }) } as any);
    expect(res.status).toBe(404);
  });

  it('returns 502 when LLM fails', async () => {
    (callLLMWithPrompt as jest.Mock).mockRejectedValueOnce(new Error('LLM down'));
    const req = new NextRequest(url(programId), { method: 'POST', body: JSON.stringify(baseBody) });
    const res: any = await revisePOST(req as any, { params: Promise.resolve({ id: programId }) } as any);
    expect(res.status).toBe(502);
  });

  it('returns 422 when validation fails', async () => {
    (validateProgramOutput as jest.Mock).mockReturnValueOnce({ valid: false, error: 'bad' });
    const req = new NextRequest(url(programId), { method: 'POST', body: JSON.stringify(baseBody) });
    const res: any = await revisePOST(req as any, { params: Promise.resolve({ id: programId }) } as any);
    expect(res.status).toBe(422);
  });

  it('respects exerciseFilter and assessment params', async () => {
    const body = { feedback: 'Tune', exerciseFilter: { primary_muscles: ['chest'] }, assessment: 'Context' };
    const req = new NextRequest(url(programId), { method: 'POST', body: JSON.stringify(body) });
    await revisePOST(req as any, { params: Promise.resolve({ id: programId }) } as any);
    expect(getAvailableExercises).toHaveBeenCalledWith({ primary_muscles: ['chest'] });
    expect(buildProgramRevisionPrompt).toHaveBeenCalledWith(mockProgram.program_json, 'Tune', mockExercises, 'Context');
  });

  it('returns 500 if saving update fails', async () => {
    (updateProgramJson as jest.Mock).mockRejectedValueOnce(new Error('db fail'));
    const req = new NextRequest(url(programId), { method: 'POST', body: JSON.stringify(baseBody) });
    const res: any = await revisePOST(req as any, { params: Promise.resolve({ id: programId }) } as any);
    expect(res.status).toBe(500);
  });
});
