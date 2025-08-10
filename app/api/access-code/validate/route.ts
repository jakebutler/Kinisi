import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { code } = body || {};

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Access code is required.' }, { status: 400 });
    }

    const expected = process.env.ACCESS_CODE;
    if (!expected) {
      // Not exposing details to client
      return NextResponse.json({ error: 'Unable to process request.' }, { status: 500 });
    }

    if (code !== expected) {
      return NextResponse.json({ error: 'Invalid access code.' }, { status: 401 });
    }

    const res = NextResponse.json({ success: true }, { status: 200 });
    // Set a short-lived cookie to gate /register
    const cookieOptions = {
      httpOnly: true,
      sameSite: 'lax' as const,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 day
    };

    try {
      // Preferred: NextResponse cookies API
      res.cookies.set('kinisi_access', '1', cookieOptions);
      return res;
    } catch {
      // Fallback below
    }

    // Fallback: set Set-Cookie header manually for mocked environments
    const parts = [
      'kinisi_access=1',
      'Path=/' ,
      'SameSite=Lax',
      'HttpOnly',
      `Max-Age=${cookieOptions.maxAge}`,
      cookieOptions.secure ? 'Secure' : '',
    ].filter(Boolean);
    res.headers.set('Set-Cookie', parts.join('; '));
    return res;
  } catch {
    return NextResponse.json({ error: 'Unable to process request.' }, { status: 500 });
  }
}
