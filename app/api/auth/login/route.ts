import { NextResponse } from 'next/server'
import { createTokenPair, getSecureCookieOptions } from '@/lib/auth'

export async function POST(req: Request) {
  const jellyfinUrl = process.env.JELLYFIN_URL ?? 'https://watch.umroo.art'
  const isProduction = process.env.NODE_ENV === 'production'

  try {
    const { username, password } = await req.json()

    console.log('[LOGIN] Authentication attempt for:', username)

    const url = `${jellyfinUrl.replace(/\/$/, '')}/Users/AuthenticateByName`

    const headers = {
      'Content-Type': 'application/json',
      'X-Emby-Authorization':
        'MediaBrowser Client="ProjectU", Device="NextClient", DeviceId="projectu-web", Version="1.0.0"'
    }

    const body = JSON.stringify({
      Username: username,
      Pw: password
    })

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
    })

    const text = await response.text()

    let data
    try {
      data = JSON.parse(text)
    } catch (err) {
      console.error('[LOGIN] Invalid JSON response:', text)
      return NextResponse.json(
        { error: 'Invalid response from Jellyfin server' }, 
        { status: 500 }
      )
    }

    if (!response.ok) {
      console.error('[LOGIN] Jellyfin authentication failed:', data)
      return NextResponse.json(
        { error: data?.Message || 'Authentication failed' }, 
        { status: response.status }
      )
    }

    if (!data.AccessToken || !data.User?.Id) {
      console.error('[LOGIN] Missing required data in response:', data)
      return NextResponse.json(
        { error: 'Invalid authentication response' }, 
        { status: 500 }
      )
    }

    // Create secure JWT token pair
    const sessionData = {
      userId: data.User.Id,
      username: data.User.Name,
      jellyfinToken: data.AccessToken,
    }

    const { accessToken, refreshToken } = await createTokenPair(sessionData)
    const cookieOptions = getSecureCookieOptions(isProduction)

    // Create response with minimal user data (no sensitive tokens)
    const res = NextResponse.json({
      success: true,
      user: {
        id: data.User.Id,
        username: data.User.Name,
      }
    })

    // Set secure HTTP-only cookies
    res.cookies.set('access-token', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60, // 15 minutes
    })

    res.cookies.set('refresh-token', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    console.log('[LOGIN] Successful authentication for:', username)
    return res

  } catch (error: any) {
    console.error('[LOGIN] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
