import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Only apply in production
  if (process.env.NODE_ENV === 'production') {
    const { pathname } = request.nextUrl;

    // Redirect all pages except /links to /links
    if (pathname !== '/links' && !pathname.startsWith('/api')) {
      return NextResponse.redirect(new URL('/links', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
