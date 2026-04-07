'use client'

import { useState } from 'react'

export default function InviteForm({ paperId }: { paperId: string }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const res = await fetch('/api/invites/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paper_id: paperId, email }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Something went wrong.')
    } else {
      setSuccess(`Invite sent to ${email}.`)
      setEmail('')
    }

    setLoading(false)
  }

  return (
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
        {loading ? 'Sending…' : 'Send invite'}
      </button>
      {success && <p className="w-full font-garamond italic text-text-secondary text-sm">{success}</p>}
      {error && <p className="w-full font-garamond italic text-accent text-sm">{error}</p>}
    </form>
  )
}
