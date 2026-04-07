'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { InviteRow, PaperRow } from '@/types'

export default function InvitePage({ params }: { params: { token: string } }) {
  const router = useRouter()
  const [invite, setInvite] = useState<InviteRow | null>(null)
  const [paper, setPaper] = useState<PaperRow | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      // Check if already logged in
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Claim the invite directly
        await claimInvite(user.id, supabase)
        return
      }

      const { data: inviteData } = await supabase
        .from('invites')
        .select('*')
        .eq('token', params.token)
        .single()

      if (!inviteData) {
        setError('This invitation link is invalid or has already been used.')
        setLoading(false)
        return
      }

      if (new Date(inviteData.expires_at) < new Date()) {
        setExpired(true)
        setLoading(false)
        return
      }

      if (inviteData.claimed_by) {
        setError('This invitation has already been claimed.')
        setLoading(false)
        return
      }

      setInvite(inviteData)

      const { data: paperData } = await supabase
        .from('papers')
        .select('*')
        .eq('id', inviteData.paper_id)
        .single()

      setPaper(paperData)
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.token])

  async function claimInvite(userId: string, supabase: ReturnType<typeof createClient>) {
    // Mark invite as claimed
    await supabase.from('invites').update({ claimed_by: userId }).eq('token', params.token)

    // Get invite details
    const { data: inviteData } = await supabase.from('invites').select('*').eq('token', params.token).single()
    if (!inviteData) return

    // Check if membership exists
    const { data: existing } = await supabase
      .from('memberships')
      .select('*')
      .eq('paper_id', inviteData.paper_id)
      .eq('user_id', userId)
      .single()

    if (!existing) {
      await supabase.from('memberships').insert({
        paper_id: inviteData.paper_id,
        user_id: userId,
        role: 'contributor',
        status: 'active',
        joined_at: new Date().toISOString(),
      })
    } else if (existing.status === 'invited') {
      await supabase.from('memberships').update({ status: 'active', joined_at: new Date().toISOString() }).eq('id', existing.id)
    }

    router.push(`/paper/${inviteData.paper_id}/submit`)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)

    const supabase = createClient()

    // Update user metadata with display name so the trigger stores it
    // Send magic link
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: invite!.email,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(`/invite/${params.token}`)}`,
      },
    })

    if (otpError) {
      setError('Failed to send magic link. Please try again.')
      setSending(false)
      return
    }

    // Store display name in invite for post-claim
    await supabase.from('invites').update({}).eq('token', params.token)

    // Store display_name in localStorage so we can upsert after callback
    localStorage.setItem('pending_display_name', displayName)
    localStorage.setItem('pending_invite_token', params.token)

    setSent(true)
    setSending(false)
  }

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <p className="font-garamond italic text-text-secondary">Loading…</p>
      </div>
    )
  }

  if (error || expired) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <h1 className="masthead-name text-4xl mb-4">Commonplace</h1>
          <hr className="rule-thin mb-6" />
          <p className="font-garamond italic text-text-secondary text-lg">
            {expired ? 'This invitation has expired.' : error}
          </p>
        </div>
      </div>
    )
  }

  if (sent) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <h1 className="masthead-name text-4xl mb-6">Commonplace</h1>
          <hr className="rule-thin mb-6" />
          <p className="font-garamond italic text-text-secondary text-xl mb-2">
            Check your inbox.
          </p>
          <p className="font-garamond text-text-secondary">
            A sign-in link is on its way to <strong className="text-text-primary not-italic">{invite?.email}</strong>.
            Click it to claim your byline.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="masthead-name text-4xl mb-2">Commonplace</h1>
          <p className="font-garamond italic text-text-secondary">
            The paper your people make.
          </p>
        </div>

        <hr className="rule-thin mb-8" />

        <div className="mb-8">
          <p className="section-header mb-2">You&rsquo;re invited</p>
          <p className="font-playfair font-bold text-2xl text-text-primary mb-1">
            {paper?.name}
          </p>
          {paper?.masthead_tagline && (
            <p className="font-garamond italic text-text-secondary">
              &ldquo;{paper.masthead_tagline}&rdquo;
            </p>
          )}
        </div>

        <hr className="rule-thin mb-8" />

        <form onSubmit={handleSubmit} className="space-y-8">
          <p className="font-garamond text-text-secondary">
            You&rsquo;re joining as a contributor. Your submissions will appear as your byline in every edition.
          </p>

          <div>
            <label className="section-header block mb-2">Your byline</label>
            <input
              type="text"
              required
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder='e.g. "Alex R." or "The Sports Desk"'
              className="input-editorial text-lg"
              maxLength={60}
              autoFocus
            />
            <p className="font-courier text-xs text-text-secondary mt-2">
              This appears next to your submissions in the paper.
            </p>
          </div>

          <button type="submit" disabled={sending || !displayName.trim()} className="btn-primary w-full">
            {sending ? 'Sending link…' : 'Claim my byline →'}
          </button>

          <p className="font-garamond italic text-text-secondary text-sm text-center">
            We&rsquo;ll send a sign-in link to {invite?.email}
          </p>
        </form>
      </div>
    </div>
  )
}
