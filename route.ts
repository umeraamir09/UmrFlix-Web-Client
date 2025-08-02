// import { NextResponse } from 'next/server'


// export async function POST(req: Request) {
//   const jellyfinUrl = process.env.JELLYFIN_URL ?? 'https://watch.umroo.art'

//   try {
//     const { username, password } = await req.json()

//     // Confirm input
//     console.log('[LOGIN] Received:', { username, password })

//     const url = `${jellyfinUrl.replace(/\/$/, '')}/Users/AuthenticateByName`

//     const headers = {
//       'Content-Type': 'application/json',
//       'X-Emby-Authorization':
//         'MediaBrowser Client="ProjectU", Device="NextClient", DeviceId="projectu-web", Version="1.0.0"'
//     }

//     const body = JSON.stringify({
//       Username: username,
//       Pw: password
//     })

//     console.log('[LOGIN] Sending to Jellyfin:', { url, headers, body })

//     const response = await fetch(url, {
//       method: 'POST',
//       headers,
//       body
//     })

//     const text = await response.text()
//     console.log('[LOGIN] Raw response from Jellyfin:', text)

//     // Try parsing JSON
//     let data
//     try {
//       data = JSON.parse(text)
//     } catch (err) {
//       return NextResponse.json({ error: 'Invalid JSON response', raw: text }, { status: 500 })
//     }

//     if (!response.ok) {
//       return NextResponse.json({ error: data }, { status: response.status })
//     }

//     return NextResponse.json({
//       token: data.AccessToken,
//       userId: data.User.Id,
//       username: data.User.Name
//     })
//   } catch (error: any) {
//     console.error('[LOGIN] Error:', error)
//     return NextResponse.json({ error: error.message }, { status: 500 })
//   }
// }
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  const jellyfinUrl = process.env.JELLYFIN_URL ?? 'https://watch.umroo.art'

  try {
    const { username, password } = await req.json()

    console.log('[LOGIN] Received:', { username, password })

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

    console.log('[LOGIN] Sending to Jellyfin:', { url, headers, body })

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body
    })

    const text = await response.text()
    console.log('[LOGIN] Raw response from Jellyfin:', text)

    let data
    try {
      data = JSON.parse(text)
    } catch (err) {
      return NextResponse.json({ error: 'Invalid JSON response', raw: text }, { status: 500 })
    }

    if (!response.ok) {
      return NextResponse.json({ error: data }, { status: response.status })
    }

    // ✅ Create a response object to attach cookies
    const res = NextResponse.json({
      message: 'Login successful',
      username: data.User.Name
    })

    // ✅ Set cookies
    const cookieStore = await cookies()

    cookieStore.set('jellyfin_token', data.AccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    cookieStore.set('jellyfin_user_id', data.User.Id, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    })

    return res
  } catch (error: any) {
    console.error('[LOGIN] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

