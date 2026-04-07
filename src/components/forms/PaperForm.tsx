'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Australia/Sydney',
  'Pacific/Auckland',
]

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

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
  const [cadence, setCadence] = useState<'weekly' | 'biweekly' | 'monthly'>('weekly')
  const [publishDay, setPublishDay] = useState(0)
  const [publishTime, setPublishTime] = useState('09:00')
  const [timezone, setTimezone] = useState('America/New_York')
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
        cadence,
        publish_day: publishDay,
        publish_time: publishTime,
        timezone,
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
            commonplace.is/p/{slug}/1
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

      {/* Cadence */}
      <div>
        <label className="section-header block mb-3">Publishing cadence</label>
        <div className="flex gap-4 flex-wrap">
          {(['weekly', 'biweekly', 'monthly'] as const).map(c => (
            <label key={c} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="cadence"
                value={c}
                checked={cadence === c}
                onChange={() => setCadence(c)}
                className="accent-text-primary"
              />
              <span className="font-garamond capitalize">{c}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Publish day + time */}
      <div className="grid grid-cols-2 gap-8">
        <div>
          <label className="section-header block mb-2">Publish day</label>
          <select
            value={publishDay}
            onChange={e => setPublishDay(Number(e.target.value))}
            className="input-editorial bg-transparent"
          >
            {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="section-header block mb-2">Publish time</label>
          <input
            type="time"
            value={publishTime}
            onChange={e => setPublishTime(e.target.value)}
            className="input-editorial font-courier"
          />
        </div>
      </div>

      {/* Timezone */}
      <div>
        <label className="section-header block mb-2">Timezone</label>
        <select
          value={timezone}
          onChange={e => setTimezone(e.target.value)}
          className="input-editorial bg-transparent"
        >
          {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>)}
        </select>
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
