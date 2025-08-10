import { jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST as validatePOST } from '@/app/api/access-code/validate/route';

const url = 'http://localhost/api/access-code/validate';

describe('API: POST /api/access-code/validate', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('returns 200 and success for correct code', async () => {
    process.env.ACCESS_CODE = 'SECRET';

    const req = new NextRequest(url, { method: 'POST', body: JSON.stringify({ code: 'SECRET' }) });
    const res: any = await validatePOST(req as any);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it('returns 401 for incorrect code', async () => {
    process.env.ACCESS_CODE = 'SECRET';

    const req = new NextRequest(url, { method: 'POST', body: JSON.stringify({ code: 'WRONG' }) });
    const res: any = await validatePOST(req as any);

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toMatch(/invalid/i);
  });

  it('returns 400 when code is missing', async () => {
    process.env.ACCESS_CODE = 'SECRET';

    const req = new NextRequest(url, { method: 'POST', body: JSON.stringify({}) });
    const res: any = await validatePOST(req as any);

    expect(res.status).toBe(400);
  });

  it('returns 500 when ACCESS_CODE env is missing', async () => {
    delete process.env.ACCESS_CODE;

    const req = new NextRequest(url, { method: 'POST', body: JSON.stringify({ code: 'ANY' }) });
    const res: any = await validatePOST(req as any);

    expect(res.status).toBe(500);
  });
});
