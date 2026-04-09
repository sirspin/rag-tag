'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import RagtagLogo from '@/components/RagtagLogo'
import InviteForm from '@/components/forms/InviteForm'
import type { PaperRow, MembershipRow, SubmissionRow, UserRow } from '@/types'

type StaffReporter = { membership: MembershipRow; user: UserRow; storyCount: number }

export default function PaperManagePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [paper, setPaper] = useState<PaperRow | null>(null)
  const [membership, setMembership] = useState<MembershipRow | null>(null)
  const [staff, setStaff] = useState<StaffReporter[]>([])
  const [recentStories, setRecentStories] = useState<SubmissionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [savingDigest, setSavingDigest] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const [paperRes, membershipRes, storiesRes] = await Promise.all([
        supabase.from('papers').select('*').eq('id', params.id).single(),
        supabase.from('memberships').select('*').eq('paper_id', params.id).eq('user_id', user.id).single(),
        supabase.from('submissions').select('*').eq('paper_id', params.id).order('submitted_at', { ascending: false }).limit(20),
      ])

      if (!paperRes.data) { router.push('/dashboard'); return }
      setPaper(paperRes.data)
      setMembership(membershipRes.data)
      setRecentStories(storiesRes.data || [])

      // Load staff reporters
      const { data: staffMemberships } = await supabase
        .from('memberships')
        .select('*')
        .eq('paper_id', params.id)
        .eq('status', 'active')

      if (staffMemberships) {
        const reporters: StaffReporter[] = []
        for (const m of staffMemberships) {
          const [userRes, countRes] = await Promise.all([
            supabase.from('users').select('*').eq('id', m.user_id).single(),
            supabase.from('submissions').select('id').eq('paper_id', params.id).eq('user_id', m.user_id),
          ])
          if (userRes.data) {
            reporters.push({ membership: m, user: userRes.data, storyCount: countRes.data?.length || 0 })
          }
        }
        setStaff(reporters)
      }

      setLoading(false)
    }
    load()
  }, [params.id, router])

  async function toggleDigest() {
    if (!paper) return
    setSavingDigest(true)
    const newVal = !paper.digest_enabled
    const res = await fetch(`/api/papers/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ digest_enabled: newVal }),
    })
    if (res.ok) {
      setPaper(prev => prev ? { ...prev, digest_enabled: newVal } : prev)
    }
    setSavingDigest(false)
  }

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <p className="font-garamond italic text-text-secondary">Loading…</p>
      </div>
    )
  }

  if (!paper) return null

  return (
    <div className="bg-background min-h-screen">
      <nav className="max-w-broadsheet mx-auto px-6 md:px-12 py-5 flex items-center justify-between">
        <Link href="/dashboard"><RagtagLogo className="h-7 w-auto" /></Link>
        <Link href={`/paper/${paper.id}/submit`} className="font-garamond italic text-text-secondary text-sm hover:text-text-primary">
          File a story
        </Link>
      </nav>
      <hr className="rule-thin mx-6 md:mx-12" />

      <main className="max-w-broadsheet mx-auto px-6 md:px-12 py-12">
        {/* Paper header */}
        <div className="mb-8">
          <h1 className="masthead-name text-5xl md:text-6xl mb-2">{paper.name}</h1>
          {paper.masthead_tagline && (
            <p className="font-garamond italic text-text-secondary text-lg">&ldquo;{paper.masthead_tagline}&rdquo;</p>
          )}
        </div>

        <hr className="rule-thick mb-10" />

        <div className="grid md:grid-cols-3 gap-12">
          {/* Main — recent stories */}
          <div className="md:col-span-2 space-y-10">
            <div>
              <p className="section-header mb-3">Recent Stories</p>
              <hr className="rule-thin mb-6" />

              {recentStories.length === 0 ? (
                <p className="font-garamond italic text-text-secondary">
                  No stories yet. File the first one.
                </p>
              ) : (
                <div className="space-y-4">
                  {recentStories.map(sub => (
                    <div key={sub.id} className="pb-4 border-b border-rules/20">
                      <p className="font-playfair font-bold text-text-primary leading-tight mb-1">
                        {sub.og_title || sub.url}
                      </p>
                      <p className="font-courier text-xs text-text-secondary">
                        {sub.og_site_name || (() => { try { return new URL(sub.url).hostname } catch { return sub.url } })()}
                        {' '}—{' '}
                        {new Date(sub.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                      {sub.note && (
                        <p className="font-garamond italic text-text-secondary text-sm mt-1">&ldquo;{sub.note}&rdquo;</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6">
                <Link href={`/paper/${paper.id}/submit`} className="btn-primary inline-block">
                  File a story →
                </Link>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-10">
            {/* Staff reporters */}
            <div>
              <p className="section-header mb-3">Staff Reporters</p>
              <hr className="rule-thin mb-4" />
              <div className="space-y-3 mb-6">
                {staff.map(({ membership: m, user, storyCount }) => (
                  <div key={m.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-garamond text-text-primary">
                        {user.display_name || user.email}
                        {m.role === 'eic' && (
                          <span className="font-courier text-xs text-accent ml-2">EIC</span>
                        )}
                      </p>
                      {user.role_title && (
                        <p className="font-courier text-[0.6rem] tracking-wide text-text-secondary uppercase">
                          {user.role_title}
                        </p>
                      )}
                      <p className="font-courier text-xs text-text-secondary">
                        {storyCount} {storyCount === 1 ? 'story' : 'stories'} filed
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-text-primary text-background flex items-center justify-center font-arvo font-bold text-sm shrink-0">
                      {user.avatar_initial || user.email?.[0]?.toUpperCase() || '?'}
                    </div>
                  </div>
                ))}
              </div>

              {membership?.role === 'eic' && (
                <InviteForm paperId={paper.id} />
              )}
            </div>

            {/* Paper info + settings */}
            <div>
              <p className="section-header mb-3">Paper</p>
              <hr className="rule-thin mb-4" />

              <div className="space-y-3">
                <div>
                  <p className="font-courier text-xs text-text-secondary mb-1">URL</p>
                  <Link
                    href={`/p/${paper.slug}`}
                    target="_blank"
                    className="font-garamond text-sm text-text-primary hover:text-accent"
                  >
                    ragtag.is/p/{paper.slug}
                  </Link>
                </div>

                {paper.twilio_number && (
                  <div>
                    <p className="font-courier text-xs text-text-secondary mb-1">SMS — File a story</p>
                    <p className="font-courier text-sm text-text-primary">{paper.twilio_number}</p>
                  </div>
                )}

                {paper.email_address && (
                  <div>
                    <p className="font-courier text-xs text-text-secondary mb-1">Email — File a story</p>
                    <p className="font-courier text-sm text-text-primary">{paper.email_address}</p>
                  </div>
                )}

                {membership?.role === 'eic' && (
                  <>
                    <hr className="rule-thin" />
                    {/* Digest toggle */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-courier text-xs uppercase tracking-widest text-text-secondary">Weekly edition</p>
                        <p className="font-garamond text-sm text-text-primary">{paper.digest_enabled ? 'On' : 'Off'}</p>
                      </div>
                      <button
                        onClick={toggleDigest}
                        disabled={savingDigest}
                        className={`relative w-10 h-5 rounded-full transition-colors ${paper.digest_enabled ? 'bg-text-primary' : 'bg-rules/40'}`}
                        aria-label="Toggle weekly edition"
                      >
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-background transition-transform ${paper.digest_enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                    </div>

                    {/* Style */}
                    <div>
                      <p className="font-courier text-xs uppercase tracking-widest text-text-secondary mb-1">Editorial style</p>
                      <select className="input-editorial bg-transparent text-sm py-1" disabled>
                        <option value="standard">Standard</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
