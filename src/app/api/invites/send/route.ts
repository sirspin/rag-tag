import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const { paper_id, email } = await request.json()

  if (!paper_id || !email) {
    return NextResponse.json({ error: 'paper_id and email are required.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  // Verify sender is EIC
  const { data: membership } = await supabase
    .from('memberships')
    .select('*')
    .eq('paper_id', paper_id)
    .eq('user_id', user.id)
    .eq('role', 'eic')
    .eq('status', 'active')
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'Only the EIC can invite contributors.' }, { status: 403 })
  }

  // Get paper
  const { data: paper } = await supabase
    .from('papers')
    .select('name, slug')
    .eq('id', paper_id)
    .single()

  if (!paper) {
    return NextResponse.json({ error: 'Paper not found.' }, { status: 404 })
  }

  // Get EIC display name
  const { data: eicProfile } = await supabase
    .from('users')
    .select('display_name, email')
    .eq('id', user.id)
    .single()

  const eicName = eicProfile?.display_name || eicProfile?.email || 'Your editor'

  // Create invite token
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const serviceSupabase = createServiceClient()

  const { error: inviteError } = await serviceSupabase.from('invites').insert({
    paper_id,
    email,
    token,
    expires_at: expiresAt,
  })

  if (inviteError) {
    return NextResponse.json({ error: 'Failed to create invite.' }, { status: 500 })
  }

  // Send magic link email via Supabase Auth (invite as OTP to invite page)
  const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/invite/${token}`

  const { error: emailError } = await serviceSupabase.auth.admin.inviteUserByEmail(email, {
    data: { invited_to_paper: paper_id, invite_token: token },
    redirectTo: inviteUrl,
  })

  if (emailError) {
    // If user exists, send them a magic link instead
    const { error: otpError } = await serviceSupabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: inviteUrl,
      },
    })

    if (otpError) {
      console.error('Failed to send invite email:', otpError)
      // Still return success — the invite record exists and we can share the link manually
    }
  }

  return NextResponse.json({ success: true, invite_url: inviteUrl })
}
