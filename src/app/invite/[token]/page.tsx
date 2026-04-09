'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import RagtagLogo from '@/components/RagtagLogo'

type InviteData = {
  invite: { id: string; paper_id: string; email: string; expires_at: string; claimed_by: string | null }
  paper: { id: string; name: string; masthead_tagline: string | null }
}

export default function InvitePage({ params }: { params: { token: string } }) {
  const router = useRouter()
  const [data, setData] = useState<InviteData | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const claimAttempted = useRef(false)

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/invites/${params.token}`)
      const json = await res.json()

      if (!res.ok) {
        setError(json.error || 'Invalid invitation.')
        setLoading(false)
        return
      }

      setData(json)

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user && !claimAttempted.current) {
        const savedName = localStorage.getItem('pending_display_name')
        if (savedName !== null) {
          claimAttempted.current = true
          await callClaimAPI(savedName, json.invite.paper_id)
          return
        }
      }

      setLoading(false)
    }

    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.token])

  async function callClaimAPI(name: string, paperId?: string) {
    setClaiming(true)
    const res = await fetch('/api/invites/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: params.token, display_name: name }),
    })
    const json = await res.json()

    localStorage.removeItem('pending_display_name')
    localStorage.removeItem('pending_invite_token')

    if (!res.ok) {
      setError(json.error || 'Failed to claim invite.')
      setClaiming(false)
      setLoading(false)
      return
    }

    const pid = json.paper_id || paperId
    router.push(`/paper/${pid}/onboard`)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await callClaimAPI(displayName, data?.invite.paper_id)
      return
    }

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: data!.invite.email,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(`/invite/${params.token}`)}`,
      },
    })

    if (otpError) {
      setError('Failed to send sign-in link. Please try again.')
      setSending(false)
      return
    }

    localStorage.setItem('pending_display_name', displayName)
    localStorage.setItem('pending_invite_token', params.token)

    setSent(true)
    setSending(false)
  }

  if (loading || claiming) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <p className="font-garamond italic text-text-secondary">
          {claiming ? 'Claiming your byline\u2026' : 'Loading\u2026'}
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="flex justify-center mb-4"><RagtagLogo className="h-12 w-auto" /></div>
          <hr className="rule-thin mb-6" />
          <p className="font-garamond italic text-text-secondary text-lg">{error}</p>
        </div>
      </div>
    )
  }

  if (sent) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="flex justify-center mb-6"><RagtagLogo className="h-12 w-auto" /></div>
          <hr className="rule-thin mb-6" />
          <p className="font-garamond italic text-text-secondary text-xl mb-2">
            Check your inbox.
          </p>
          <p className="font-garamond text-text-secondary">
            A sign-in link is on its way to{' '}
            <strong className="text-text-primary not-italic">{data?.invite.email}</strong>.
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
          <div className="flex justify-center mb-4"><RagtagLogo className="h-12 w-auto" /></div>
          <p className="font-quattrocento italic text-text-secondary">
            The paper your people make.
          </p>
        </div>

        <hr className="rule-thin mb-8" />

        <div className="mb-8">
          <p className="section-header mb-2">You&rsquo;re invited</p>
          <p className="font-playfair font-bold text-2xl text-text-primary mb-1">
            {data?.paper.name}
          </p>
          {data?.paper.masthead_tagline && (
            <p className="font-garamond italic text-text-secondary">
              &ldquo;{data.paper.masthead_tagline}&rdquo;
            </p>
          )}
        </div>

        <hr className="rule-thin mb-8" />

        <form onSubmit={handleSubmit} className="space-y-8">
          <p className="font-garamond text-text-secondary">
            You&rsquo;ve been invited to join <strong className="text-text-primary not-italic">{data?.paper.name}</strong> as a staff reporter.
            Your byline appears next to every story you file.
          </p>

          <div>
            <label className="section-header block mb-2">Your byline</label>
            <input
              type="text"
              required
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder='e.g. "Alex R." or "The Culture Desk"'
              className="input-editorial text-lg"
              maxLength={60}
              autoFocus
            />
            <p className="font-courier text-xs text-text-secondary mt-2">
              This appears next to your stories in the paper.
            </p>
          </div>

          <button
            type="submit"
            disabled={sending || !displayName.trim()}
            className="btn-primary w-full"
          >
            {sending ? 'Sending link\u2026' : 'Claim my byline \u2192'}
          </button>

          <p className="font-garamond italic text-text-secondary text-sm text-center">
            We&rsquo;ll send a sign-in link to {data?.invite.email}
          </p>
        </form>
      </div>
    </div>
  )
}
