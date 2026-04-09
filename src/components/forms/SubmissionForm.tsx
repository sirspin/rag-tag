'use client'

import { useState, useRef } from 'react'
import OGCard from '@/components/ui/OGCard'
import type { OGMeta, PaperRow } from '@/types'

export default function SubmissionForm({ paper, defaultUrl }: { paper: PaperRow; defaultUrl?: string }) {
  const [url, setUrl] = useState(defaultUrl || '')
  const [note, setNote] = useState('')
  const [meta, setMeta] = useState<OGMeta | null>(null)
  const [fetchingMeta, setFetchingMeta] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchedUrlRef = useRef<string>('')

  async function fetchMeta(inputUrl: string) {
    if (!inputUrl || inputUrl === fetchedUrlRef.current) return
    try { new URL(inputUrl) } catch { return }

    setFetchingMeta(true)
    setMeta(null)

    const res = await fetch('/api/og-fetch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: inputUrl }),
    })

    const data = await res.json()
    if (res.ok) {
      setMeta(data)
      fetchedUrlRef.current = inputUrl
    }
    setFetchingMeta(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const res = await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paper_id: paper.id,
        url,
        note: note.trim() || null,
        og_title: meta?.title || null,
        og_description: meta?.description || null,
        og_image: meta?.image || null,
        og_site_name: meta?.site_name || null,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Something went wrong.')
      setSubmitting(false)
      return
    }

    setSubmitted(true)
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div className="text-center py-10">
        <hr className="rule-thin mb-8" />
        <p className="font-quattrocento font-bold text-2xl text-text-primary mb-3">Filed.</p>
        <p className="font-garamond italic text-text-secondary text-lg">
          Your story is in {paper.name}.
        </p>
        <hr className="rule-thin mt-8 mb-8" />
        <button
          onClick={() => { setSubmitted(false); setUrl(''); setNote(''); setMeta(null); fetchedUrlRef.current = '' }}
          className="font-garamond italic text-text-secondary text-sm hover:text-text-primary"
        >
          File another story →
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* URL input */}
      <div>
        <label className="section-header block mb-2">Link</label>
        <input
          type="url"
          required
          value={url}
          onChange={e => setUrl(e.target.value)}
          onBlur={() => fetchMeta(url)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); fetchMeta(url) } }}
          placeholder="https://..."
          className="input-editorial text-base font-courier"
          autoFocus
        />
      </div>

      {/* OG preview */}
      {fetchingMeta && (
        <p className="font-garamond italic text-text-secondary text-sm">Loading preview…</p>
      )}
      {meta && !fetchingMeta && <OGCard meta={meta} />}

      {/* Note */}
      <div>
        <label className="section-header block mb-2">
          Note <span className="font-garamond italic normal-case tracking-normal font-normal opacity-60">— optional</span>
        </label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value.slice(0, 140))}
          placeholder="What made you submit this?"
          rows={3}
          className="input-editorial resize-none pt-2 font-garamond italic"
          style={{ borderBottom: '1px solid var(--rules)' }}
        />
        <p className="font-courier text-xs text-text-secondary mt-1 text-right">
          {note.length}/140
        </p>
      </div>

      {error && <p className="font-garamond italic text-accent">{error}</p>}

      <button type="submit" disabled={submitting || !url} className="btn-primary w-full">
        {submitting ? 'Filing…' : `File to ${paper.name} →`}
      </button>
    </form>
  )
}
