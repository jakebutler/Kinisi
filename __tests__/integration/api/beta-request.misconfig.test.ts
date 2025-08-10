import { jest } from '@jest/globals';

// In this suite we isolate modules to vary the supabaseAdmin mock

describe('API: POST /api/beta-request (server misconfiguration)', () => {
  const url = 'http://localhost/api/beta-request';

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('returns 500 when supabaseAdmin is not configured', async () => {
    jest.isolateModules(async () => {
      // Mock utils BEFORE importing route
      jest.doMock('@/utils/betaRequests', () => ({
        createBetaRequest: jest.fn(),
        findBetaRequestByEmail: jest.fn(),
      }));
      // Explicitly mock supabaseAdmin as undefined to trigger env guard
      jest.doMock('@/utils/supabaseAdmin', () => ({
        supabaseAdmin: undefined,
      }));

      const { NextRequest } = await import('next/server');
      const { POST } = await import('@/app/api/beta-request/route');

      const req = new NextRequest(url, {
        method: 'POST',
        body: JSON.stringify({ email: 'user@example.com' }),
      } as any);

      const res: any = await POST(req as any);
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toMatch(/misconfiguration/i);
    });
  });
});
