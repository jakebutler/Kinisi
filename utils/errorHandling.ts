import { NextResponse } from 'next/server';

export function handleApiError<T>(data: T | null, error: Error | null): { data: T | null, error: Error | null } {
  return { data, error };
}

export function handleErrorResponse(err: unknown, status = 500): NextResponse {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status });
}
