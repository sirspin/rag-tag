import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const { paper_id, url, note, og_title, og_description, og_image, og_site_name } = await request.json()

  if (!paper_id || !url) {
    return NextResponse.json({ error: 'paper_id and url are required.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  // Verify membership
  const { data: membership } = await supabase
    .from('memberships')
    .select('*')
    .eq('paper_id', paper_id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'You are not a member of this paper.' }, { status: 403 })
  }

  // Validate URL
  try {
    new URL(url)
  } catch {
    return NextResponse.json({ error: 'Invalid URL.' }, { status: 400 })
  }

  const { data: submission, error } = await supabase
    .from('submissions')
    .insert({
      paper_id,
      user_id: user.id,
      url,
      note: note || null,
      og_title: og_title || null,
      og_description: og_description || null,
      og_image: og_image || null,
      og_site_name: og_site_name || null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to save submission.' }, { status: 500 })
  }

  // Trigger AI re-organization in the background (fire and forget)
  const organizeUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/papers/${paper_id}/organize`
  fetch(organizeUrl, {
    method: 'POST',
    headers: { 'x-internal-secret': process.env.INTERNAL_API_SECRET || '' },
  }).catch(() => {/* ignore errors */})

  return NextResponse.json({ success: true, submission })
}
