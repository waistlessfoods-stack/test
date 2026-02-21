import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Only apply redirect in production
  if (process.env.NODE_ENV === 'production') {
    // Redirect all pages except /links to /links
    if (pathname !== '/links' && !pathname.startsWith('/api')) {
      return NextResponse.redirect(new URL('/links', request.url));
    }
  }

  // Pass pathname in headers for server components
  const response = NextResponse.next();
  response.headers.set('x-pathname', pathname);
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
