import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { SubmissionWithUser, UserRow } from '@/types'
import EditionMasthead from '@/components/edition/EditionMasthead'
import LeadSection from '@/components/edition/LeadSection'
import StandardSection from '@/components/edition/StandardSection'
import BriefSection from '@/components/edition/BriefSection'
import Recommendations from '@/components/edition/Recommendations'
import Link from 'next/link'

export async function generateMetadata({
  params,
}: {
  params: { slug: string; edition_number: string }
}): Promise<Metadata> {
  const supabase = await createClient()
  const { data: paper } = await supabase
    .from('papers')
    .select('name, masthead_tagline')
    .eq('slug', params.slug)
    .single()

  if (!paper) return { title: 'Ragtag' }

  return {
    title: `${paper.name} — Edition #${params.edition_number}`,
    description: paper.masthead_tagline || `${paper.name}, a collaborative newspaper on Ragtag.`,
    openGraph: {
      title: `${paper.name} — Edition #${params.edition_number}`,
      description: paper.masthead_tagline || undefined,
    },
  }
}

export default async function EditionPage({
  params,
}: {
  params: { slug: string; edition_number: string }
}) {
  const supabase = await createClient()

  // Get paper
  const { data: paper } = await supabase
    .from('papers')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (!paper) notFound()

  const editionNumber = parseInt(params.edition_number, 10)
  if (isNaN(editionNumber)) notFound()

  // Get published edition
  const { data: edition } = await supabase
    .from('editions')
    .select('*')
    .eq('paper_id', paper.id)
    .eq('edition_number', editionNumber)
    .eq('status', 'published')
    .single()

  if (!edition || !edition.ai_sections) notFound()

  // Get submissions for this edition
  const { data: rawSubmissions } = await supabase
    .from('submissions')
    .select('*')
    .eq('edition_id', edition.id)

  // Enrich with user data
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

  // Get contributors (active members)
  const { data: memberships } = await supabase
    .from('memberships')
    .select('user_id')
    .eq('paper_id', paper.id)
    .eq('status', 'active')

  const contributors: Pick<UserRow, 'id' | 'display_name'>[] = []
  for (const m of memberships || []) {
    const user = userCache.get(m.user_id)
    if (user) {
      contributors.push({ id: user.id, display_name: user.display_name })
    } else {
      const { data: u } = await supabase
        .from('users')
        .select('id, display_name')
        .eq('id', m.user_id)
        .single()
      if (u) contributors.push(u)
    }
  }

  const aiSections = edition.ai_sections as import("@/types").AISections

  return (
    <div className="bg-background min-h-screen">
      <main className="max-w-broadsheet mx-auto px-6 md:px-12 py-8 md:py-12">
        {/* Masthead */}
        <EditionMasthead paper={paper} edition={edition} contributors={contributors} />

        {/* Sections */}
        {aiSections.sections.map((section, i) => (
          <div key={i}>
            <hr className="rule-thick mt-10 mb-0" />
            {section.weight === 'lead' && (
              <LeadSection section={section} submissions={submissions} />
            )}
            {section.weight === 'standard' && (
              <StandardSection section={section} submissions={submissions} />
            )}
            {section.weight === 'brief' && (
              <BriefSection section={section} submissions={submissions} />
            )}
          </div>
        ))}

        {/* Recommendations */}
        {aiSections.recommendations?.length > 0 && (
          <>
            <hr className="rule-thick mt-10" />
            <Recommendations recommendations={aiSections.recommendations} />
          </>
        )}

        {/* Footer */}
        <hr className="rule-thick mt-10 mb-6" />
        <footer className="flex flex-col md:flex-row items-center justify-between gap-4 pb-10">
          <span className="masthead-name text-xl">{paper.name}</span>
          <p className="edition-badge text-text-secondary">
            Edition #{String(edition.edition_number).padStart(4, '0')} &nbsp;&middot;&nbsp;{' '}
            {edition.publish_at
              ? new Date(edition.publish_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
              : ''}
          </p>
          <Link href="/" className="font-garamond italic text-text-secondary text-sm hover:text-text-primary">
            ragtag.is
          </Link>
        </footer>
      </main>
    </div>
  )
}
