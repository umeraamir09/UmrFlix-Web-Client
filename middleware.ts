import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionFromCookies } from './lib/auth';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip middleware for certain paths
  const isPublicPath = [
    '/login',
    '/api/auth/login',
    '/api/auth/refresh',
    '/_next',
    '/favicon.ico',
    '/branding',  // Allow access to branding assets
    '/public',    // Allow access to public assets
  ].some(path => pathname.startsWith(path));

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Check authentication status
  const session = await getSessionFromCookies(request.cookies);
  const isLoggedIn = Boolean(session);
  const isLoginPage = pathname.startsWith('/login');
  const isProtectedPage = !isPublicPath;

  // Redirect logged-in users away from login page
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Redirect unauthenticated users to login
  if (!isLoggedIn && isProtectedPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // For authenticated requests, check if token needs refresh
  if (isLoggedIn && isProtectedPage) {
    const accessToken = request.cookies.get('access-token')?.value;
    
    // If no access token but we have a session (from refresh token), 
    // we need to refresh silently in the background
    if (!accessToken) {
      const response = NextResponse.next();
      // Add a header to trigger client-side refresh
      response.headers.set('X-Refresh-Token', 'true');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
