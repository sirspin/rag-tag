'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import RagtagLogo from '@/components/RagtagLogo'

export default function OnboardPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [roleTitle, setRoleTitle] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await save()
  }

  async function handleSkip() {
    router.push(`/paper/${params.id}/submit`)
  }

  async function save() {
    setSaving(true)
    await fetch('/api/users/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role_title: roleTitle.trim() || null,
        bio: bio.trim() || null,
      }),
    })
    router.push(`/paper/${params.id}/submit`)
  }

  return (
    <div className="bg-background min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4"><RagtagLogo className="h-12 w-auto" /></div>
          <p className="font-quattrocento italic text-text-secondary">
            You&rsquo;re in. One more thing.
          </p>
        </div>

        <hr className="rule-thin mb-8" />

        <div className="mb-6">
          <p className="section-header mb-1">Set your byline</p>
          <p className="font-garamond text-text-secondary text-sm">
            Give yourself a role and a short bio. Both are optional — you can always add them later.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="section-header block mb-2">
              Role <span className="font-garamond italic normal-case tracking-normal font-normal opacity-60">— optional</span>
            </label>
            <input
              type="text"
              value={roleTitle}
              onChange={e => setRoleTitle(e.target.value)}
              placeholder='e.g. "Calzone and Pizza Critic"'
              className="input-editorial"
              maxLength={80}
            />
          </div>

          <div>
            <label className="section-header block mb-2">
              Bio <span className="font-garamond italic normal-case tracking-normal font-normal opacity-60">— optional</span>
            </label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="A sentence or two about you."
              className="input-editorial resize-none"
              rows={3}
              maxLength={280}
            />
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving…' : 'Save and continue →'}
            </button>
            <button
              type="button"
              onClick={handleSkip}
              disabled={saving}
              className="btn-secondary"
            >
              Skip
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
