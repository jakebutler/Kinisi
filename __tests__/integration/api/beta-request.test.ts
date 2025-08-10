import { jest } from '@jest/globals';

// Mock utils BEFORE importing route
jest.mock('@/utils/betaRequests', () => ({
  createBetaRequest: jest.fn(),
  findBetaRequestByEmail: jest.fn(),
}));
// Mock admin client to avoid importing ESM supabase client in tests
jest.mock('@/utils/supabaseAdmin', () => ({
  supabaseAdmin: {},
}));

import { POST as betaPOST } from '@/app/api/beta-request/route';
import { NextRequest } from 'next/server';
import { createBetaRequest, findBetaRequestByEmail } from '@/utils/betaRequests';

const url = 'http://localhost/api/beta-request';

describe('API: POST /api/beta-request', () => {
  const base = { email: 'test@example.com', name: 'Test User', referral_source: 'homepage' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 201 when a new beta request is created', async () => {
    (findBetaRequestByEmail as jest.Mock).mockResolvedValue(null);
    (createBetaRequest as jest.Mock).mockResolvedValue({ id: 'id-1', ...base, created_at: new Date().toISOString() });

    const req = new NextRequest(url, { method: 'POST', body: JSON.stringify(base) });
    const res: any = await betaPOST(req as any);

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect((createBetaRequest as jest.Mock).mock.calls[0][0]).toEqual(base);
  });

  it('returns 200 when the email is already on the list', async () => {
    (findBetaRequestByEmail as jest.Mock).mockResolvedValue({ id: 'existing', email: base.email });

    const req = new NextRequest(url, { method: 'POST', body: JSON.stringify({ email: base.email }) });
    const res: any = await betaPOST(req as any);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.message).toMatch(/already/i);
    expect(createBetaRequest).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid or missing email', async () => {
    const req1 = new NextRequest(url, { method: 'POST', body: JSON.stringify({}) });
    const res1: any = await betaPOST(req1 as any);
    expect(res1.status).toBe(400);

    const req2 = new NextRequest(url, { method: 'POST', body: JSON.stringify({ email: 'bad-email' }) });
    const res2: any = await betaPOST(req2 as any);
    expect(res2.status).toBe(400);
  });

  it('returns 500 when an unexpected error occurs', async () => {
    (findBetaRequestByEmail as jest.Mock).mockRejectedValue(new Error('db down'));

    const req = new NextRequest(url, { method: 'POST', body: JSON.stringify(base) });
    const res: any = await betaPOST(req as any);

    expect(res.status).toBe(500);
  });
});
