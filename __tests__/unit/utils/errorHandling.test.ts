import { handleErrorResponse } from '@/utils/errorHandling';
import { NextResponse } from 'next/server';

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn(),
  },
}));

describe('handleErrorResponse', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return a NextResponse with a 500 status code by default', () => {
    const error = new Error('Test error');
    handleErrorResponse(error);
    expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Test error' }, { status: 500 });
  });

  it('should return a NextResponse with the specified status code', () => {
    const error = new Error('Test error');
    handleErrorResponse(error, 400);
    expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Test error' }, { status: 400 });
  });

  it('should handle non-Error objects', () => {
    const error = 'A string error';
    handleErrorResponse(error);
    expect(NextResponse.json).toHaveBeenCalledWith({ error: 'A string error' }, { status: 500 });
  });
});
