import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, createTokenPair, getSecureCookieOptions, validateJellyfinToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  try {
    const refreshToken = req.cookies.get('refresh-token')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token provided' }, 
        { status: 401 }
      );
    }

    // Verify the refresh token
    const payload = await verifyToken(refreshToken);
    
    if (!payload || payload.type !== 'refresh') {
      return NextResponse.json(
        { error: 'Invalid refresh token' }, 
        { status: 401 }
      );
    }

    // Validate that the Jellyfin token is still valid
    const isJellyfinTokenValid = await validateJellyfinToken(
      payload.jellyfinToken, 
      payload.userId
    );

    if (!isJellyfinTokenValid) {
      console.log('[REFRESH] Jellyfin token is no longer valid for user:', payload.username);
      return NextResponse.json(
        { error: 'Session expired, please login again' }, 
        { status: 401 }
      );
    }

    // Create new token pair
    const sessionData = {
      userId: payload.userId,
      username: payload.username,
      jellyfinToken: payload.jellyfinToken,
    };

    const { accessToken, refreshToken: newRefreshToken } = await createTokenPair(sessionData);
    const cookieOptions = getSecureCookieOptions(isProduction);

    const res = NextResponse.json({
      success: true,
      user: {
        id: payload.userId,
        username: payload.username,
      }
    });

    // Set new tokens
    res.cookies.set('access-token', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60, // 15 minutes
    });

    res.cookies.set('refresh-token', newRefreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return res;

  } catch (error: any) {
    console.error('[REFRESH] Error:', error);
    return NextResponse.json(
      { error: 'Token refresh failed' }, 
      { status: 500 }
    );
  }
}
