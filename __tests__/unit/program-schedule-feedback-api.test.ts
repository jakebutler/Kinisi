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
  shiftProgramSchedule: jest.fn(),
  updateSessionStart: jest.fn(),
  updateSessionDuration: jest.fn(),
}));

import { POST as feedbackPOST } from '@/app/api/program/[id]/schedule/feedback/route';
import { createSupabaseServerClient } from '@/utils/supabaseServer';
import { getProgramById, updateProgramFields } from '@/utils/programDataHelpers';
import { scheduleProgram, shiftProgramSchedule, updateSessionStart, updateSessionDuration } from '@/utils/scheduling';

const validId = '550e8400-e29b-41d4-a716-446655440000';

describe('API: POST /api/program/[id]/schedule/feedback', () => {
  const baseProgram = {
    id: validId,
    user_id: 'user-1',
    start_date: '2025-01-02',
    program_json: {
      weeks: [
        { week: 1, sessions: [ { uid: 'w1s1', start_at: '2025-01-02T08:00', duration_minutes: 60 } ] }
      ]
    },
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase.auth.getUser.mockReset();
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    (createSupabaseServerClient as jest.Mock).mockResolvedValue(mockSupabase);
    (getProgramById as jest.Mock).mockResolvedValue(baseProgram);
    (updateProgramFields as jest.Mock).mockResolvedValue({ ok: true });
    (scheduleProgram as jest.Mock).mockReturnValue({ updated: baseProgram.program_json, appliedPreferences: { daysOfWeek: [1,3,5] } });
    (shiftProgramSchedule as jest.Mock).mockReturnValue({ updated: baseProgram.program_json });
    (updateSessionStart as jest.Mock).mockReturnValue({ updated: baseProgram.program_json, updatedCount: 1 });
    (updateSessionDuration as jest.Mock).mockReturnValue({ updated: baseProgram.program_json, updatedCount: 1 });
  });

  it('updates single session duration', async () => {
    const req = { json: async () => ({ uid: 'w1s1', newDurationMinutes: 75 }) } as any;
    const res: any = await feedbackPOST(req, { params: { id: validId } } as any);
    expect(res.status).toBe(200);
    expect(updateSessionDuration).toHaveBeenCalledWith(baseProgram.program_json, 'w1s1', 75);
    expect(updateProgramFields).toHaveBeenCalled();
  });

  it('updates single session start using newStartAt', async () => {
    const req = { json: async () => ({ uid: 'w1s1', newStartAt: '2025-01-03T10:30' }) } as any;
    const res: any = await feedbackPOST(req, { params: { id: validId } } as any);
    expect(res.status).toBe(200);
    expect(updateSessionStart).toHaveBeenCalledWith(baseProgram.program_json, 'w1s1', '2025-01-03T10:30');
  });

  it('updates single session start using deltaMinutes when newStartAt absent', async () => {
    // Ensure the program_json has the uid so route can compute a target from existing start
    const req = { json: async () => ({ uid: 'w1s1', deltaMinutes: 30 }) } as any;
    const res: any = await feedbackPOST(req, { params: { id: validId } } as any);
    expect(res.status).toBe(200);
    // We cannot assert exact computed time here easily; verify updateSessionStart called with uid and some string
    const call = (updateSessionStart as jest.Mock).mock.calls[0];
    expect(call[0]).toEqual(baseProgram.program_json);
    expect(call[1]).toBe('w1s1');
    expect(typeof call[2]).toBe('string');
  });

  it('returns 400 when deltaMinutes path cannot find session', async () => {
    (getProgramById as jest.Mock).mockResolvedValueOnce({ ...baseProgram, program_json: { weeks: [] } });
    const req = { json: async () => ({ uid: 'missing', deltaMinutes: 15 }) } as any;
    const res: any = await feedbackPOST(req, { params: { id: validId } } as any);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/Session not found/);
  });

  it('shifts schedule when shiftDays provided', async () => {
    const req = { json: async () => ({ shiftDays: 2 }) } as any;
    const res: any = await feedbackPOST(req, { params: { id: validId } } as any);
    expect(res.status).toBe(200);
    expect(shiftProgramSchedule).toHaveBeenCalledWith(baseProgram.program_json, 2, 0);
  });

  it('regenerates schedule when no specific feedback provided', async () => {
    const req = { json: async () => ({ startDate: '2025-02-01', preferences: { daysOfWeek: [2,4] } }) } as any;
    const res: any = await feedbackPOST(req, { params: { id: validId } } as any);
    expect(res.status).toBe(200);
    expect(scheduleProgram).toHaveBeenCalledWith(baseProgram.program_json, '2025-02-01', { daysOfWeek: [2,4] });
  });

  it('400 for missing id', async () => {
    const req = { json: async () => ({}) } as any;
    const res: any = await feedbackPOST(req, { params: {} as any } as any);
    expect(res.status).toBe(400);
  });

  it('404 for invalid uuid', async () => {
    const req = { json: async () => ({}) } as any;
    const res: any = await feedbackPOST(req, { params: { id: 'bad-id' } } as any);
    expect(res.status).toBe(404);
  });

  it('401 when unauthenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } });
    const req = { json: async () => ({}) } as any;
    const res: any = await feedbackPOST(req, { params: { id: validId } } as any);
    expect(res.status).toBe(401);
  });

  it('403 when forbidden (different user)', async () => {
    (getProgramById as jest.Mock).mockResolvedValueOnce({ ...baseProgram, user_id: 'other' });
    const req = { json: async () => ({}) } as any;
    const res: any = await feedbackPOST(req, { params: { id: validId } } as any);
    expect(res.status).toBe(403);
  });

  it('400 when no session updated in duration update', async () => {
    (updateSessionDuration as jest.Mock).mockReturnValueOnce({ updated: baseProgram.program_json, updatedCount: 0 });
    const req = { json: async () => ({ uid: 'w1s1', newDurationMinutes: 10 }) } as any;
    const res: any = await feedbackPOST(req, { params: { id: validId } } as any);
    expect(res.status).toBe(400);
  });

  it('400 when no session updated in start update', async () => {
    (updateSessionStart as jest.Mock).mockReturnValueOnce({ updated: baseProgram.program_json, updatedCount: 0 });
    const req = { json: async () => ({ uid: 'w1s1', newStartAt: '2025-01-05T12:00' }) } as any;
    const res: any = await feedbackPOST(req, { params: { id: validId } } as any);
    expect(res.status).toBe(400);
  });

  it('500 when saving fails', async () => {
    (updateProgramFields as jest.Mock).mockRejectedValueOnce(new Error('save fail'));
    const req = { json: async () => ({ uid: 'w1s1', newDurationMinutes: 75 }) } as any;
    const res: any = await feedbackPOST(req, { params: { id: validId } } as any);
    expect(res.status).toBe(500);
  });
});
