import { NextRequest, NextResponse } from 'next/server'
import { fetchOGMeta } from '@/lib/og'

export async function POST(request: NextRequest) {
  const { url } = await request.json()

  if (!url) {
    return NextResponse.json({ error: 'URL is required.' }, { status: 400 })
  }

  try {
    const meta = await fetchOGMeta(url)
    return NextResponse.json(meta)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch metadata.'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
