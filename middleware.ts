import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { nextUrl, cookies } = req;

  // Gate /register behind access cookie
  if (nextUrl.pathname.startsWith('/register')) {
    const access = cookies.get('kinisi_access')?.value;
    if (access !== '1') {
      const redirectUrl = new URL('/access', req.url);
      const nextPath = nextUrl.pathname + nextUrl.search;
      redirectUrl.searchParams.set('next', nextPath || '/register');
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/register'],
};
