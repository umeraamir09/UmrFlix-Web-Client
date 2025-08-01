import { NextResponse } from 'next/server';
import { getSecureCookieOptions } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ message: 'Logged out successfully' });
  const cookieOptions = getSecureCookieOptions(process.env.NODE_ENV === 'production');

  // Clear the authentication cookies
  response.cookies.set('access-token', '', { ...cookieOptions, maxAge: -1 });
  response.cookies.set('refresh-token', '', { ...cookieOptions, maxAge: -1 });

  return response;
}
