import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Handle the dashboard redirect
  if (request.nextUrl.pathname === '/dashboard-v2') {
    return NextResponse.redirect(new URL('/fitness-program', request.url));
  }
}

export const config = {
  matcher: ['/dashboard-v2']
};
