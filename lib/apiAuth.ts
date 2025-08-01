import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { getSessionFromCookies } from './auth';

export interface AuthenticatedAPIContext {
  userId: string;
  username: string;
  jellyfinToken: string;
}

/**
 * Get authenticated user context from API request
 * Returns null if user is not authenticated
 */
export async function getAuthenticatedUser(
  request?: NextRequest
): Promise<AuthenticatedAPIContext | null> {
  try {
    let cookieStore;
    
    if (request) {
      // Use request cookies if available (for middleware/edge functions)
      cookieStore = request.cookies;
    } else {
      // Use server cookies for API routes
      cookieStore = await cookies();
    }

    const session = await getSessionFromCookies(cookieStore);
    
    if (!session) {
      return null;
    }

    return {
      userId: session.userId,
      username: session.username,
      jellyfinToken: session.jellyfinToken,
    };
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
}

/**
 * Require authentication for API route
 * Throws if user is not authenticated
 */
export async function requireAuth(
  request?: NextRequest
): Promise<AuthenticatedAPIContext> {
  const user = await getAuthenticatedUser(request);
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  return user;
}

/**
 * Create Jellyfin API headers with authentication
 */
export function createJellyfinHeaders(token: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-Emby-Authorization': `MediaBrowser Client="ProjectU", Device="NextClient", DeviceId="projectu-web", Version="1.0.0", Token="${token}"`,
  };
}

/**
 * Create authenticated Jellyfin API URL with token
 */
export function createJellyfinImageUrl(
  itemId: string, 
  imageType: 'Primary' | 'Backdrop' | 'Logo' | 'Thumb', 
  token: string,
  tag?: string
): string {
  const jellyfinUrl = process.env.JELLYFIN_URL || process.env.JELLYFIN_SRVR_URL || 'https://watch.umroo.art';
  if (tag) {
    return `${jellyfinUrl}/Items/${itemId}/Images/${imageType}?api_key=${token}&Tag=${tag}`;
  }
  return `${jellyfinUrl}/Items/${itemId}/Images/${imageType}?api_key=${token}`;
}
