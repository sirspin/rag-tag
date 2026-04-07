'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PublishButton({ editionId, paperId }: { editionId: string; paperId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePublish() {
    if (!confirm('Publish this edition? It will be publicly visible.')) return

    setLoading(true)
    setError(null)

    const res = await fetch('/api/editions/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ edition_id: editionId }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Failed to publish.')
      setLoading(false)
      return
    }

    if (data.public_url) {
      router.push(data.public_url)
    } else {
      router.push(`/paper/${paperId}`)
    }
  }

  return (
    <div className="flex items-center gap-3">
      {error && <p className="font-garamond italic text-sm" style={{ color: '#ff6b6b' }}>{error}</p>}
      <button
        onClick={handlePublish}
        disabled={loading}
        className="font-garamond text-sm px-4 py-1.5 border border-current font-variant-small-caps"
        style={{
          color: 'var(--background)',
          borderColor: 'rgba(255,255,255,0.4)',
          fontVariant: 'small-caps',
          letterSpacing: '0.08em',
        }}
      >
        {loading ? 'Publishing…' : 'Publish edition →'}
      </button>
    </div>
  )
}
