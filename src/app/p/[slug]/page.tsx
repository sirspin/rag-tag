import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { SubmissionWithUser, UserRow, AISections } from '@/types'
import Link from 'next/link'
import LivingPaperMasthead from '@/components/edition/LivingPaperMasthead'
import LeadSection from '@/components/edition/LeadSection'
import StandardSection from '@/components/edition/StandardSection'
import BriefSection from '@/components/edition/BriefSection'

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const supabase = await createClient()
  const { data: paper } = await supabase
    .from('papers')
    .select('name, masthead_tagline')
    .eq('slug', params.slug)
    .single()

  if (!paper) return { title: 'Ragtag' }

  return {
    title: paper.name,
    description: paper.masthead_tagline || `${paper.name}, a living newspaper on Ragtag.`,
    openGraph: {
      title: paper.name,
      description: paper.masthead_tagline || undefined,
    },
  }
}

export default async function LivingPaperPage({
  params,
}: {
  params: { slug: string }
}) {
  const supabase = await createClient()

  const { data: paper } = await supabase
    .from('papers')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (!paper) notFound()

  // All submissions, newest first
  const { data: rawSubmissions } = await supabase
    .from('submissions')
    .select('*')
    .eq('paper_id', paper.id)
    .order('submitted_at', { ascending: false })

  // Enrich with user data (including role_title)
  const submissions: SubmissionWithUser[] = []
  const userCache = new Map<string, Pick<UserRow, 'id' | 'display_name' | 'avatar_initial' | 'role_title'>>()

  for (const sub of rawSubmissions || []) {
    if (!userCache.has(sub.user_id)) {
      const { data: u } = await supabase
        .from('users')
        .select('id, display_name, avatar_initial, role_title')
        .eq('id', sub.user_id)
        .single()
      if (u) userCache.set(sub.user_id, u)
    }
    submissions.push({
      ...sub,
      user: userCache.get(sub.user_id) || { id: sub.user_id, display_name: null, avatar_initial: null, role_title: null },
    })
  }

  // Get latest published edition's AI sections for organization (optional)
  const { data: latestEdition } = await supabase
    .from('editions')
    .select('ai_sections')
    .eq('paper_id', paper.id)
    .eq('status', 'published')
    .order('edition_number', { ascending: false })
    .limit(1)
    .single()

  const aiSections = latestEdition?.ai_sections as AISections | null | undefined

  // Only use AI sections if they reference submissions that still exist
  const submissionIds = new Set(submissions.map(s => s.id))
  const validSections = aiSections?.sections?.filter(
    s => s.submission_ids.some(id => submissionIds.has(id))
  ) || []

  return (
    <div className="bg-background min-h-screen">
      <main className="max-w-broadsheet mx-auto px-4 md:px-8 pt-4 md:pt-6 pb-0">
        <LivingPaperMasthead paper={paper} />

        {submissions.length === 0 ? (
          <>
            <hr className="rule-broadsheet-thick" />
            <div className="py-20 text-center">
              <p className="font-garamond italic text-text-secondary text-xl">
                No stories yet. File the first one.
              </p>
            </div>
          </>
        ) : validSections.length > 0 ? (
          // AI-organized view
          validSections.map((section, i) => (
            <div key={i}>
              <hr className="rule-broadsheet-thick" />
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
          ))
        ) : (
          // Chronological fallback
          <>
            <hr className="rule-broadsheet-thick" />
            <div className="py-8">
              <div className="space-y-0">
                {submissions.map((sub, i) => (
                  <ChronologicalStory key={sub.id} submission={sub} isLast={i === submissions.length - 1} />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <div className="bg-text-primary text-background mt-4 py-2 px-0 flex items-center justify-between">
          <span
            className="font-quattrocento font-bold text-background"
            style={{ fontSize: 'clamp(0.9rem, 2vw, 1.2rem)', letterSpacing: '0.04em' }}
          >
            {paper.name}
          </span>
          <Link
            href={`/p/${paper.slug}/staff`}
            className="font-arvo text-[0.58rem] tracking-[0.14em] uppercase text-background/70 hover:text-background transition-colors"
          >
            Our Staff
          </Link>
          <Link href="/" className="font-arvo text-[0.58rem] tracking-[0.12em] uppercase text-background/60 hover:text-background transition-colors">
            ragtag.is
          </Link>
        </div>
        <div className="pb-6" />
      </main>
    </div>
  )
}

function ChronologicalStory({ submission, isLast }: { submission: SubmissionWithUser; isLast: boolean }) {
  const siteName = submission.og_site_name || (() => {
    try { return new URL(submission.url).hostname.replace('www.', '') }
    catch { return 'Source' }
  })()

  const byline = submission.user.display_name
    ? submission.user.role_title
      ? `${submission.user.display_name}, ${submission.user.role_title}`
      : submission.user.display_name
    : null

  return (
    <div className={`py-6 ${!isLast ? 'border-b border-rules/30' : ''}`}>
      <div className="mb-1">
        <span className="font-arvo text-[0.6rem] tracking-[0.16em] uppercase text-text-secondary mr-3">{siteName}</span>
        {byline && (
          <span className="font-arvo text-[0.6rem] tracking-[0.12em] uppercase text-text-secondary">by {byline}</span>
        )}
      </div>
      <h2 className="font-quattrocento font-bold text-2xl md:text-3xl text-text-primary leading-tight mb-2">
        {submission.og_title || submission.url}
      </h2>
      {submission.note && (
        <p className="font-garamond italic text-text-secondary mb-2">&ldquo;{submission.note}&rdquo;</p>
      )}
      {submission.og_description && !submission.extracted_text && (
        <p className="font-quattrocento text-text-primary mb-2">{submission.og_description}</p>
      )}
      {submission.extracted_text && (
        <div className="prose-broadsheet">
          {submission.extracted_text.split(/\n\n+/).filter(p => p.trim()).slice(0, 3).map((para, i) => (
            <p key={i}>{para.trim()}</p>
          ))}
        </div>
      )}
      <a
        href={submission.url}
        target="_blank"
        rel="noopener noreferrer"
        className="font-arvo text-[0.65rem] tracking-[0.1em] uppercase text-text-secondary hover:text-accent transition-colors block mt-2"
      >
        ↗ Read at {siteName}
      </a>
    </div>
  )
}
