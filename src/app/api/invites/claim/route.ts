import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const { token, display_name } = await request.json()

  if (!token) {
    return NextResponse.json({ error: 'token is required.' }, { status: 400 })
  }

  // Must be authenticated
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  const service = createServiceClient()

  // Fetch invite
  const { data: invite } = await service
    .from('invites')
    .select('*')
    .eq('token', token)
    .single()

  if (!invite) {
    return NextResponse.json({ error: 'Invalid invite link.' }, { status: 404 })
  }
  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This invitation has expired.' }, { status: 410 })
  }
  // Already claimed by someone else
  if (invite.claimed_by && invite.claimed_by !== user.id) {
    return NextResponse.json({ error: 'This invitation has already been claimed.' }, { status: 410 })
  }

  // Mark invite claimed
  await service
    .from('invites')
    .update({ claimed_by: user.id })
    .eq('token', token)

  // Save display_name + avatar_initial to user profile
  const name = display_name?.trim() || null
  const initial = name ? name[0].toUpperCase() : user.email![0].toUpperCase()

  await service
    .from('users')
    .upsert(
      { id: user.id, email: user.email!, display_name: name, avatar_initial: initial },
      { onConflict: 'id' }
    )

  // Upsert membership — service client bypasses RLS
  const { data: existing } = await service
    .from('memberships')
    .select('id, status')
    .eq('paper_id', invite.paper_id)
    .eq('user_id', user.id)
    .single()

  if (!existing) {
    await service.from('memberships').insert({
      paper_id: invite.paper_id,
      user_id: user.id,
      role: 'contributor',
      status: 'active',
      joined_at: new Date().toISOString(),
    })
  } else if (existing.status !== 'active') {
    await service
      .from('memberships')
      .update({ status: 'active', joined_at: new Date().toISOString() })
      .eq('id', existing.id)
  }

  return NextResponse.json({ success: true, paper_id: invite.paper_id })
}
