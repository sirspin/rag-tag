import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import type { SubmissionWithUser, UserRow } from '@/types'
import EditionMasthead from '@/components/edition/EditionMasthead'
import LeadSection from '@/components/edition/LeadSection'
import StandardSection from '@/components/edition/StandardSection'
import BriefSection from '@/components/edition/BriefSection'
import Recommendations from '@/components/edition/Recommendations'
import PublishButton from './PublishButton'
import Link from 'next/link'

export default async function PreviewPage({
  params,
}: {
  params: { id: string; edition_id: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Verify EIC
  const { data: membership } = await supabase
    .from('memberships')
    .select('*')
    .eq('paper_id', params.id)
    .eq('user_id', user.id)
    .eq('role', 'eic')
    .eq('status', 'active')
    .single()

  if (!membership) redirect('/dashboard')

  // Get paper
  const { data: paper } = await supabase
    .from('papers')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!paper) notFound()

  // Get edition (draft or published)
  const { data: edition } = await supabase
    .from('editions')
    .select('*')
    .eq('id', params.edition_id)
    .eq('paper_id', params.id)
    .single()

  if (!edition || !edition.ai_sections) notFound()

  const aiSections = edition.ai_sections as import("@/types").AISections
  if (!aiSections?.sections) notFound()

  // Get submissions
  const { data: rawSubmissions } = await supabase
    .from('submissions')
    .select('*')
    .eq('edition_id', edition.id)

  const submissions: SubmissionWithUser[] = []
  const userCache = new Map<string, Pick<UserRow, 'id' | 'display_name' | 'avatar_initial'>>()

  for (const sub of rawSubmissions || []) {
    if (!userCache.has(sub.user_id)) {
      const { data: u } = await supabase
        .from('users')
        .select('id, display_name, avatar_initial')
        .eq('id', sub.user_id)
        .single()
      if (u) userCache.set(sub.user_id, u)
    }
    submissions.push({
      ...sub,
      user: userCache.get(sub.user_id) || { id: sub.user_id, display_name: null, avatar_initial: null },
    })
  }

  // Get contributors
  const { data: memberships } = await supabase
    .from('memberships')
    .select('user_id')
    .eq('paper_id', paper.id)
    .eq('status', 'active')

  const contributors: Pick<UserRow, 'id' | 'display_name'>[] = []
  for (const m of memberships || []) {
    const cached = userCache.get(m.user_id)
    if (cached) {
      contributors.push({ id: cached.id, display_name: cached.display_name })
    } else {
      const { data: u } = await supabase.from('users').select('id, display_name').eq('id', m.user_id).single()
      if (u) contributors.push(u)
    }
  }

  return (
    <div className="bg-background min-h-screen">
      {/* EIC preview banner */}
      <div
        className="sticky top-0 z-50 px-6 py-3 flex items-center justify-between"
        style={{ background: 'var(--text-primary)', color: 'var(--background)' }}
      >
        <div className="flex items-center gap-4">
          <p className="font-courier text-xs tracking-widest">
            PREVIEW — NOT YET PUBLISHED
          </p>
          <Link
            href={`/paper/${params.id}`}
            className="font-garamond italic text-sm opacity-60 hover:opacity-100"
            style={{ color: 'var(--background)' }}
          >
            ← Back
          </Link>
        </div>
        {edition.status === 'draft' && (
          <PublishButton editionId={edition.id} paperId={params.id} />
        )}
        {edition.status === 'published' && (
          <Link
            href={`/p/${paper.slug}/${edition.edition_number}`}
            target="_blank"
            className="font-garamond italic text-sm"
            style={{ color: 'var(--background)' }}
          >
            View live edition →
          </Link>
        )}
      </div>

      <main className="max-w-broadsheet mx-auto px-4 md:px-8 pt-4 md:pt-6 pb-0">
        <EditionMasthead paper={paper} edition={edition} contributors={contributors} />

        {aiSections.sections.map((section, i) => (
          <div key={i}>
            <hr className="rule-broadsheet-thick" />
            {section.weight === 'lead' && <LeadSection section={section} submissions={submissions} />}
            {section.weight === 'standard' && <StandardSection section={section} submissions={submissions} />}
            {section.weight === 'brief' && <BriefSection section={section} submissions={submissions} />}
          </div>
        ))}

        {aiSections.recommendations?.length > 0 && (
          <>
            <hr className="rule-broadsheet-thick" />
            <Recommendations recommendations={aiSections.recommendations} />
          </>
        )}

        <div className="bg-text-primary text-background mt-4 py-2 flex items-center justify-between">
          <span
            className="font-quattrocento font-bold text-background"
            style={{ fontSize: 'clamp(0.9rem, 2vw, 1.2rem)', letterSpacing: '0.04em' }}
          >
            {paper.name}
          </span>
          <p className="font-arvo text-[0.58rem] tracking-[0.14em] uppercase text-background/70">
            No. {String(edition.edition_number).padStart(4, '0')}
          </p>
          <span className="font-arvo text-[0.58rem] tracking-[0.12em] uppercase text-background/60">ragtag.is</span>
        </div>
        <div className="pb-6" />
      </main>
    </div>
  )
}
