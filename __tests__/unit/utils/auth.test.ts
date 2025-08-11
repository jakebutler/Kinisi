import { getAuthenticatedUser } from '@/utils/auth';
import { NextResponse } from 'next/server';

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn(),
  },
}));

describe('getAuthenticatedUser', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return the user object if the user is authenticated', async () => {
    const supabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: '123' } },
          error: null,
        }),
      },
    };
    const { user, response } = await getAuthenticatedUser(supabase as any);
    expect(user).toEqual({ id: '123' });
    expect(response).toBeNull();
  });

  it('should return a NextResponse if the user is not authenticated', async () => {
    const supabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    };
    await getAuthenticatedUser(supabase as any);
    expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Unauthorized' }, { status: 401 });
  });

  it('should return a NextResponse if there is an error getting the user', async () => {
    const supabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: new Error('Test error'),
        }),
      },
    };
    await getAuthenticatedUser(supabase as any);
    expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Unauthorized' }, { status: 401 });
  });
});
