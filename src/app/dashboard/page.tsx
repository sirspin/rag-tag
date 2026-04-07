import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { PaperRow, MembershipRow, SubmissionRow, EditionRow } from '@/types'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

type PaperData = {
  paper: PaperRow
  membership: MembershipRow
  submissionCount: number
  latestEdition: EditionRow | null
  contributorCount: number
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Get user's memberships
  const { data: memberships } = await supabase
    .from('memberships')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')

  // Get papers for each membership
  const paperDataList: PaperData[] = []

  for (const m of memberships || []) {
    const [paperRes, submissionsRes, editionsRes, membersRes] = await Promise.all([
      supabase.from('papers').select('*').eq('id', m.paper_id).single(),
      supabase.from('submissions').select('id').eq('paper_id', m.paper_id).is('edition_id', null),
      supabase.from('editions').select('*').eq('paper_id', m.paper_id).order('edition_number', { ascending: false }).limit(1),
      supabase.from('memberships').select('id').eq('paper_id', m.paper_id).eq('status', 'active'),
    ])

    if (paperRes.data) {
      paperDataList.push({
        paper: paperRes.data,
        membership: m,
        submissionCount: submissionsRes.data?.length || 0,
        latestEdition: editionsRes.data?.[0] || null,
        contributorCount: membersRes.data?.length || 0,
      })
    }
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', user.id)
    .single()

  return (
    <div className="bg-background min-h-screen">
      <nav className="max-w-broadsheet mx-auto px-6 md:px-12 py-5 flex items-center justify-between">
        <Link href="/" className="masthead-name text-2xl">Commonplace</Link>
        <form action="/auth/signout" method="post">
          <button className="font-garamond italic text-text-secondary text-sm hover:text-text-primary">
            Sign out
          </button>
        </form>
      </nav>
      <hr className="rule-thin mx-6 md:mx-12" />

      <main className="max-w-broadsheet mx-auto px-6 md:px-12 py-12">
        <div className="mb-12">
          <p className="section-header mb-2">Dashboard</p>
          <h1 className="masthead-name text-5xl leading-none">
            {profile?.display_name ? `Good morning, ${profile.display_name.split(' ')[0]}.` : 'Your papers.'}
          </h1>
        </div>

        <hr className="rule-thick mb-12" />

        {paperDataList.length === 0 ? (
          <div className="py-20 text-center">
            <p className="font-garamond italic text-text-secondary text-xl mb-8">
              You haven&rsquo;t started a paper yet. The floor is yours.
            </p>
            <Link href="/paper/new" className="btn-primary inline-block">
              Start your paper →
            </Link>
          </div>
        ) : (
          <div className="space-y-12">
            {paperDataList.map(({ paper, membership, submissionCount, latestEdition, contributorCount }) => {
              const editionNum = latestEdition ? latestEdition.edition_number + (latestEdition.status === 'published' ? 1 : 0) : 1
              const status = latestEdition?.status === 'draft' ? 'draft' : submissionCount > 0 ? 'in_progress' : 'empty'

              return (
                <div key={paper.id} className="pb-12 border-b border-rules/20">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                    {/* Paper info */}
                    <div className="flex-1">
                      <p className="edition-badge text-text-secondary mb-1">
                        {paper.cadence} · {DAYS[paper.publish_day]}s · {contributorCount} {contributorCount === 1 ? 'contributor' : 'contributors'}
                      </p>
                      <h2 className="masthead-name text-4xl mb-1">{paper.name}</h2>
                      {paper.masthead_tagline && (
                        <p className="font-garamond italic text-text-secondary">&ldquo;{paper.masthead_tagline}&rdquo;</p>
                      )}
                    </div>

                    {/* Edition status */}
                    <div className="md:text-right">
                      <p className="edition-badge text-text-secondary mb-1">
                        Edition #{String(editionNum).padStart(4, '0')}
                      </p>
                      <p className="font-garamond text-text-primary">
                        {latestEdition?.status === 'draft' ? (
                          <span className="text-accent italic">Draft — ready to publish</span>
                        ) : submissionCount > 0 ? (
                          <span className="italic">In progress — {submissionCount} {submissionCount === 1 ? 'submission' : 'submissions'}</span>
                        ) : (
                          <span className="text-text-secondary italic">No submissions yet. The floor is yours.</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex flex-wrap gap-3 items-center">
                    {membership.role === 'eic' && (
                      <>
                        {latestEdition?.status === 'draft' ? (
                          <Link href={`/paper/${paper.id}/edition/${latestEdition.id}/preview`} className="btn-primary">
                            Preview edition →
                          </Link>
                        ) : submissionCount > 0 ? (
                          <Link href={`/paper/${paper.id}`} className="btn-primary">
                            Compile edition →
                          </Link>
                        ) : null}
                        <Link href={`/paper/${paper.id}`} className="btn-secondary">
                          Manage paper
                        </Link>
                      </>
                    )}
                    {membership.role === 'contributor' && (
                      <Link href={`/paper/${paper.id}/submit`} className="btn-primary">
                        Submit a link →
                      </Link>
                    )}
                    {latestEdition?.status === 'published' && (
                      <Link
                        href={`/p/${paper.slug}/${latestEdition.edition_number}`}
                        className="font-garamond italic text-text-secondary text-sm hover:text-text-primary"
                        target="_blank"
                      >
                        View latest edition →
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}

            {/* New paper CTA */}
            <div className="pt-4">
              <Link href="/paper/new" className="btn-secondary inline-block">
                Start another paper →
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
