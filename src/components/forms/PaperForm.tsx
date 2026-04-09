'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function PaperForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [tagline, setTagline] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setName(val)
    if (!slug || slug === slugify(name)) {
      setSlug(slugify(val))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/papers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug,
        name,
        masthead_tagline: tagline,
        style: 'standard',
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    router.push(`/paper/${data.paper_id}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* Paper name */}
      <div>
        <label className="section-header block mb-2">Paper name</label>
        <input
          type="text"
          required
          value={name}
          onChange={handleNameChange}
          placeholder="The Sunday Dispatch"
          className="input-editorial text-xl"
          maxLength={80}
        />
        {slug && (
          <p className="font-courier text-xs text-text-secondary mt-2">
            ragtag.is/p/{slug}
          </p>
        )}
      </div>

      {/* Slug override */}
      <div>
        <label className="section-header block mb-2">URL slug</label>
        <input
          type="text"
          required
          value={slug}
          onChange={e => setSlug(slugify(e.target.value))}
          placeholder="sunday-dispatch"
          className="input-editorial font-courier"
          pattern="[a-z0-9-]+"
          maxLength={60}
        />
      </div>

      {/* Tagline */}
      <div>
        <label className="section-header block mb-2">
          Masthead tagline <span className="font-garamond italic normal-case tracking-normal font-normal opacity-60">— optional</span>
        </label>
        <input
          type="text"
          value={tagline}
          onChange={e => setTagline(e.target.value)}
          placeholder='"Curated by people who actually read things"'
          className="input-editorial"
          maxLength={120}
        />
      </div>

      <hr className="rule-thin" />

      {/* Style */}
      <div>
        <label className="section-header block mb-2">Editorial style</label>
        <select className="input-editorial bg-transparent" disabled>
          <option value="standard">Standard</option>
        </select>
        <p className="font-courier text-xs text-text-secondary mt-2">
          More styles coming soon.
        </p>
      </div>

      {error && (
        <p className="font-garamond italic text-accent">{error}</p>
      )}

      <button type="submit" disabled={loading || !name || !slug} className="btn-primary">
        {loading ? 'Creating…' : 'Create paper →'}
      </button>
    </form>
  )
}
