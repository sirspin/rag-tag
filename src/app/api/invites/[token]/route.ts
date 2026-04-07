import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  const supabase = createServiceClient()

  const { data: invite } = await supabase
    .from('invites')
    .select('*')
    .eq('token', params.token)
    .single()

  if (!invite) {
    return NextResponse.json({ error: 'Invalid invite link.' }, { status: 404 })
  }

  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This invitation has expired.' }, { status: 410 })
  }

  if (invite.claimed_by) {
    return NextResponse.json({ error: 'This invitation has already been claimed.' }, { status: 410 })
  }

  const { data: paper } = await supabase
    .from('papers')
    .select('id, name, masthead_tagline')
    .eq('id', invite.paper_id)
    .single()

  return NextResponse.json({ invite, paper })
}
