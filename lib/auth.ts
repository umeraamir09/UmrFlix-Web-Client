import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production'
);

const ACCESS_TOKEN_EXPIRES = '15m'; // Short-lived access token
const REFRESH_TOKEN_EXPIRES = '7d'; // Long-lived refresh token

export interface JWTPayload {
  userId: string;
  username: string;
  jellyfinToken: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface SessionData {
  userId: string;
  username: string;
  jellyfinToken: string;
}

/**
 * Create a JWT token
 */
export async function createToken(
  payload: Omit<JWTPayload, 'type' | 'iat' | 'exp'>,
  type: 'access' | 'refresh'
): Promise<string> {
  const expiresIn = type === 'access' ? ACCESS_TOKEN_EXPIRES : REFRESH_TOKEN_EXPIRES;
  
  return new SignJWT({ ...payload, type })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET);
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as JWTPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Create both access and refresh tokens
 */
export async function createTokenPair(sessionData: SessionData) {
  const tokenData = {
    userId: sessionData.userId,
    username: sessionData.username,
    jellyfinToken: sessionData.jellyfinToken,
  };

  const [accessToken, refreshToken] = await Promise.all([
    createToken(tokenData, 'access'),
    createToken(tokenData, 'refresh'),
  ]);

  return { accessToken, refreshToken };
}

/**
 * Cookie options for secure token storage
 */
export const getSecureCookieOptions = (isProduction: boolean) => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax' as const,
  path: '/',
});

/**
 * Get session data from request cookies
 */
export async function getSessionFromCookies(cookies: any): Promise<SessionData | null> {
  const accessToken = cookies.get('access-token')?.value;
  const refreshToken = cookies.get('refresh-token')?.value;

  if (!accessToken && !refreshToken) {
    return null;
  }

  // Try access token first
  if (accessToken) {
    const payload = await verifyToken(accessToken);
    if (payload && payload.type === 'access') {
      return {
        userId: payload.userId,
        username: payload.username,
        jellyfinToken: payload.jellyfinToken,
      };
    }
  }

  // If access token is invalid/expired, try refresh token
  if (refreshToken) {
    const payload = await verifyToken(refreshToken);
    if (payload && payload.type === 'refresh') {
      return {
        userId: payload.userId,
        username: payload.username,
        jellyfinToken: payload.jellyfinToken,
      };
    }
  }

  return null;
}

/**
 * Validate Jellyfin token by making a test request
 */
export async function validateJellyfinToken(
  jellyfinToken: string,
  userId: string
): Promise<boolean> {
  try {
    const jellyfinUrl = process.env.JELLYFIN_URL ?? 'https://watch.umroo.art';
    const response = await fetch(`${jellyfinUrl}/Users/${userId}`, {
      headers: {
        'X-Emby-Authorization': `MediaBrowser Client="ProjectU", Device="NextClient", DeviceId="projectu-web", Version="1.0.0", Token="${jellyfinToken}"`,
      },
    });
    
    return response.ok;
  } catch (error) {
    console.error('Jellyfin token validation failed:', error);
    return false;
  }
}
