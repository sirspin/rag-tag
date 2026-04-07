'use client'

import { useState } from 'react'

export default function InviteForm({ paperId }: { paperId: string }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setInviteUrl(null)

    const res = await fetch('/api/invites/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paper_id: paperId, email }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Something went wrong.')
    } else {
      setInviteUrl(data.invite_url)
      setEmail('')
    }

    setLoading(false)
  }

  async function handleCopy() {
    if (!inviteUrl) return
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-3 items-end flex-wrap">
        <div className="flex-1 min-w-48">
          <label className="section-header block mb-2">Invite a writer</label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="contributor@example.com"
            className="input-editorial"
          />
        </div>
        <button type="submit" disabled={loading || !email} className="btn-primary whitespace-nowrap">
          {loading ? 'Sending...' : 'Send invite'}
        </button>
        {error && <p className="w-full font-garamond italic text-accent text-sm">{error}</p>}
      </form>

      {inviteUrl && (
        <div className="pt-2">
          <p className="font-garamond italic text-text-secondary text-sm mb-2">
            Invite sent. Or share this link directly:
          </p>
          <div className="flex gap-2 items-center">
            <code className="font-courier text-xs text-text-secondary bg-rules/5 border border-rules/20 px-3 py-2 flex-1 truncate">
              {inviteUrl}
            </code>
            <button
              type="button"
              onClick={handleCopy}
              className="btn-secondary text-sm px-3 py-2 whitespace-nowrap"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
