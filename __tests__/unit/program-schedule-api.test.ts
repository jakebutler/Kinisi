import { jest } from '@jest/globals';

// Shared mock Supabase instance
let mockSupabase: any = {
  auth: { getUser: jest.fn() },
};

// Mock modules BEFORE importing route
jest.mock('@/utils/programDataHelpers', () => ({
  getProgramById: jest.fn(),
  updateProgramFields: jest.fn(),
}));
jest.mock('@/utils/supabaseServer', () => ({
  createSupabaseServerClient: jest.fn(),
}));
jest.mock('@/utils/scheduling', () => ({
  scheduleProgram: jest.fn(),
}));

import { POST as schedulePOST } from '@/app/api/program/[id]/schedule/route';
import { createSupabaseServerClient } from '@/utils/supabaseServer';
import { getProgramById, updateProgramFields } from '@/utils/programDataHelpers';
import { scheduleProgram } from '@/utils/scheduling';

const validId = '550e8400-e29b-41d4-a716-446655440000';

describe('API: POST /api/program/[id]/schedule', () => {
  const mockProgram = {
    id: validId,
    user_id: 'user-1',
    start_date: '2025-01-02',
    program_json: { weeks: [] },
  };
  const savedResponse = { ...mockProgram, program_json: { weeks: [{ w: 1 }] } };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase.auth.getUser.mockReset();
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    (createSupabaseServerClient as jest.Mock).mockResolvedValue(mockSupabase);
    (getProgramById as jest.Mock).mockResolvedValue(mockProgram);
    (scheduleProgram as jest.Mock).mockReturnValue({ updated: savedResponse.program_json, appliedPreferences: { preferred_days: ['Mon','Wed'] } });
    (updateProgramFields as jest.Mock).mockResolvedValue(savedResponse);
  });

  it('returns 200 on success and saves schedule', async () => {
    const req = { json: async () => ({ startDate: '2025-02-01', preferences: { preferred_days: ['Tue','Thu'] } }) } as any;
    const res: any = await schedulePOST(req, { params: { id: validId } } as any);
    expect(res.status).toBe(200);
    expect(createSupabaseServerClient).toHaveBeenCalled();
    expect(getProgramById).toHaveBeenCalledWith(validId, expect.anything());
    expect(scheduleProgram).toHaveBeenCalledWith(mockProgram.program_json, '2025-02-01', { preferred_days: ['Tue','Thu'] });
    expect(updateProgramFields).toHaveBeenCalledWith(validId, expect.objectContaining({ program_json: savedResponse.program_json }), expect.anything());
  });

  it('uses program.start_date when startDate missing', async () => {
    const req = { json: async () => ({}) } as any;
    await schedulePOST(req, { params: { id: validId } } as any);
    expect(scheduleProgram).toHaveBeenCalledWith(mockProgram.program_json, mockProgram.start_date, undefined);
  });

  it('400 when id missing', async () => {
    const req = { json: async () => ({}) } as any;
    const res: any = await schedulePOST(req, { params: {} as any } as any);
    expect(res.status).toBe(400);
  });

  it('404 when id not UUID', async () => {
    const req = { json: async () => ({}) } as any;
    const res: any = await schedulePOST(req, { params: { id: 'not-a-uuid' } } as any);
    expect(res.status).toBe(404);
  });

  it('401 when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } });
    const req = { json: async () => ({}) } as any;
    const res: any = await schedulePOST(req, { params: { id: validId } } as any);
    expect(res.status).toBe(401);
  });

  it('404 when program not found', async () => {
    (getProgramById as jest.Mock).mockResolvedValueOnce(null);
    const req = { json: async () => ({}) } as any;
    const res: any = await schedulePOST(req, { params: { id: validId } } as any);
    expect(res.status).toBe(404);
  });

  it('403 when program belongs to another user', async () => {
    (getProgramById as jest.Mock).mockResolvedValueOnce({ ...mockProgram, user_id: 'someone-else' });
    const req = { json: async () => ({}) } as any;
    const res: any = await schedulePOST(req, { params: { id: validId } } as any);
    expect(res.status).toBe(403);
  });

  it('500 when saving fails', async () => {
    (updateProgramFields as jest.Mock).mockRejectedValueOnce(new Error('db error'));
    const req = { json: async () => ({}) } as any;
    const res: any = await schedulePOST(req, { params: { id: validId } } as any);
    expect(res.status).toBe(500);
  });
});
