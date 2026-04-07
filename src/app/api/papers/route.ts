import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { slug, name, masthead_tagline, cadence, publish_day, publish_time, timezone } = body

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })

  const service = createServiceClient()

  // Upsert user profile (in case trigger hasn't run)
  await service.from('users').upsert({ id: user.id, email: user.email! }, { onConflict: 'id' })

  // Create paper
  const { data: paper, error: paperErr } = await service
    .from('papers')
    .insert({
      slug,
      name,
      masthead_tagline: masthead_tagline || null,
      created_by: user.id,
      cadence,
      publish_day,
      publish_time,
      timezone,
    })
    .select()
    .single()

  if (paperErr) {
    const msg = paperErr.code === '23505'
      ? `The slug "${slug}" is already taken. Try a different paper name.`
      : paperErr.message
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  // Create EIC membership — service client bypasses RLS bootstrap chicken-and-egg
  const { error: memberErr } = await service.from('memberships').insert({
    paper_id: paper.id,
    user_id: user.id,
    role: 'eic',
    status: 'active',
    joined_at: new Date().toISOString(),
  })

  if (memberErr) return NextResponse.json({ error: memberErr.message }, { status: 500 })

  return NextResponse.json({ paper_id: paper.id })
}
