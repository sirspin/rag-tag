'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import InviteForm from '@/components/forms/InviteForm'
import type { PaperRow, MembershipRow, SubmissionRow, UserRow, EditionRow } from '@/types'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

type Contributor = { membership: MembershipRow; user: UserRow; submissionCount: number }

export default function PaperManagePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [paper, setPaper] = useState<PaperRow | null>(null)
  const [membership, setMembership] = useState<MembershipRow | null>(null)
  const [contributors, setContributors] = useState<Contributor[]>([])
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([])
  const [latestEdition, setLatestEdition] = useState<EditionRow | null>(null)
  const [compiling, setCompiling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const [paperRes, membershipRes, submissionsRes, editionsRes] = await Promise.all([
        supabase.from('papers').select('*').eq('id', params.id).single(),
        supabase.from('memberships').select('*').eq('paper_id', params.id).eq('user_id', user.id).single(),
        supabase.from('submissions').select('*').eq('paper_id', params.id).is('edition_id', null).order('submitted_at', { ascending: false }),
        supabase.from('editions').select('*').eq('paper_id', params.id).order('edition_number', { ascending: false }).limit(5),
      ])

      if (!paperRes.data) { router.push('/dashboard'); return }
      setPaper(paperRes.data)
      setMembership(membershipRes.data)
      setSubmissions(submissionsRes.data || [])
      setLatestEdition(editionsRes.data?.[0] || null)

      // Load contributors
      const { data: memberships } = await supabase
        .from('memberships')
        .select('*')
        .eq('paper_id', params.id)
        .eq('status', 'active')

      if (memberships) {
        const contribs: Contributor[] = []
        for (const m of memberships) {
          const [userRes, countRes] = await Promise.all([
            supabase.from('users').select('*').eq('id', m.user_id).single(),
            supabase.from('submissions').select('id').eq('paper_id', params.id).eq('user_id', m.user_id).is('edition_id', null),
          ])
          if (userRes.data) {
            contribs.push({ membership: m, user: userRes.data, submissionCount: countRes.data?.length || 0 })
          }
        }
        setContributors(contribs)
      }

      setLoading(false)
    }
    load()
  }, [params.id, router])

  async function handleCompile() {
    setCompiling(true)
    setError(null)
    const res = await fetch('/api/editions/compile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paper_id: params.id }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Compilation failed. Please try again.')
      setCompiling(false)
      return
    }
    router.push(`/paper/${params.id}/edition/${data.edition_id}/preview`)
  }

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <p className="font-garamond italic text-text-secondary">Loading…</p>
      </div>
    )
  }

  if (!paper) return null

  const editionNum = latestEdition
    ? latestEdition.edition_number + (latestEdition.status === 'published' ? 1 : 0)
    : 1

  return (
    <div className="bg-background min-h-screen">
      <nav className="max-w-broadsheet mx-auto px-6 md:px-12 py-5 flex items-center justify-between">
        <Link href="/dashboard" className="masthead-name text-2xl">Commonplace</Link>
        <div className="flex gap-6 items-center">
          <Link href={`/paper/${paper.id}/submit`} className="font-garamond italic text-text-secondary text-sm hover:text-text-primary">
            Submit a link
          </Link>
        </div>
      </nav>
      <hr className="rule-thin mx-6 md:mx-12" />

      <main className="max-w-broadsheet mx-auto px-6 md:px-12 py-12">
        {/* Paper header */}
        <div className="mb-8">
          <p className="edition-badge text-text-secondary mb-1">
            {paper.cadence} · {DAYS[paper.publish_day]}s
          </p>
          <h1 className="masthead-name text-5xl md:text-6xl mb-2">{paper.name}</h1>
          {paper.masthead_tagline && (
            <p className="font-garamond italic text-text-secondary text-lg">&ldquo;{paper.masthead_tagline}&rdquo;</p>
          )}
        </div>

        <hr className="rule-thick mb-10" />

        <div className="grid md:grid-cols-3 gap-12">
          {/* Main content */}
          <div className="md:col-span-2 space-y-10">
            {/* Current edition status */}
            <div>
              <p className="section-header mb-3">
                Edition #{String(editionNum).padStart(4, '0')}
              </p>
              <hr className="rule-thin mb-6" />

              {submissions.length === 0 && latestEdition?.status !== 'draft' ? (
                <p className="font-garamond italic text-text-secondary">
                  No submissions yet this week. The floor is yours.
                </p>
              ) : latestEdition?.status === 'draft' ? (
                <div>
                  <p className="font-garamond italic text-text-secondary mb-4">
                    A draft edition is ready. Preview and publish when you&rsquo;re ready.
                  </p>
                  <Link href={`/paper/${paper.id}/edition/${latestEdition.id}/preview`} className="btn-primary inline-block">
                    Preview edition →
                  </Link>
                </div>
              ) : (
                <>
                  <p className="font-garamond text-text-primary mb-6">
                    {submissions.length} {submissions.length === 1 ? 'submission' : 'submissions'} waiting to be compiled.
                  </p>

                  {/* Submission list */}
                  <div className="space-y-4 mb-8">
                    {submissions.map(sub => (
                      <div key={sub.id} className="pb-4 border-b border-rules/20">
                        <p className="font-playfair font-bold text-text-primary leading-tight mb-1">
                          {sub.og_title || sub.url}
                        </p>
                        <p className="font-courier text-xs text-text-secondary">
                          {sub.og_site_name || new URL(sub.url).hostname} — submitted {new Date(sub.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                        {sub.note && (
                          <p className="font-garamond italic text-text-secondary text-sm mt-1">&ldquo;{sub.note}&rdquo;</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {membership?.role === 'eic' && (
                    <div>
                      {error && <p className="font-garamond italic text-accent mb-4">{error}</p>}
                      <button onClick={handleCompile} disabled={compiling} className="btn-primary">
                        {compiling ? 'Compiling…' : 'Compile edition →'}
                      </button>
                      <p className="font-garamond italic text-text-secondary text-sm mt-2">
                        We&rsquo;ll extract article text and organize everything into a paper.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Published editions */}
            {latestEdition?.status === 'published' && (
              <div>
                <p className="section-header mb-3">Published editions</p>
                <hr className="rule-thin mb-4" />
                <Link
                  href={`/p/${paper.slug}/${latestEdition.edition_number}`}
                  target="_blank"
                  className="font-garamond italic text-text-secondary hover:text-text-primary"
                >
                  Edition #{latestEdition.edition_number} — {new Date(latestEdition.publish_at!).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} →
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-10">
            {/* Contributors */}
            <div>
              <p className="section-header mb-3">Contributors</p>
              <hr className="rule-thin mb-4" />
              <div className="space-y-3 mb-6">
                {contributors.map(({ membership: m, user, submissionCount }) => (
                  <div key={m.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-garamond text-text-primary">
                        {user.display_name || user.email}
                        {m.role === 'eic' && (
                          <span className="font-courier text-xs text-accent ml-2">EIC</span>
                        )}
                      </p>
                      <p className="font-courier text-xs text-text-secondary">
                        {submissionCount} this window
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-text-primary text-background flex items-center justify-center font-playfair font-bold text-sm">
                      {user.avatar_initial || user.email[0].toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>

              {membership?.role === 'eic' && (
                <InviteForm paperId={paper.id} />
              )}
            </div>

            {/* Paper settings link */}
            <div>
              <p className="section-header mb-3">Paper</p>
              <hr className="rule-thin mb-4" />
              <p className="font-courier text-xs text-text-secondary mb-1">URL</p>
              <p className="font-garamond text-text-primary text-sm break-all">
                commonplace.is/p/{paper.slug}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
