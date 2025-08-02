// app/api/subtitles/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const path = searchParams.get('path')

  if (!path) {
    return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 })
  }

  try {
    const response = await fetch(`https://watch.umroo.art${path}`)

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch subtitle' }, { status: response.status })
    }

    const data = await response.text()

    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': 'text/vtt',
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
