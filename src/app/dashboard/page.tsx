import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import RagtagLogo from '@/components/RagtagLogo'
import type { PaperRow, MembershipRow, UserRow } from '@/types'

type StaffReporter = {
  user: Pick<UserRow, 'id' | 'display_name' | 'avatar_initial' | 'role_title'>
  membership: MembershipRow
}

type PaperData = {
  paper: PaperRow
  membership: MembershipRow
  storyCount: number
  staff: StaffReporter[]
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

  const paperDataList: PaperData[] = []

  for (const m of memberships || []) {
    const [paperRes, storiesRes, staffMembershipsRes] = await Promise.all([
      supabase.from('papers').select('*').eq('id', m.paper_id).single(),
      supabase.from('submissions').select('id').eq('paper_id', m.paper_id),
      supabase.from('memberships').select('*').eq('paper_id', m.paper_id).eq('status', 'active'),
    ])

    if (!paperRes.data) continue

    // Load staff users
    const staff: StaffReporter[] = []
    for (const sm of staffMembershipsRes.data || []) {
      const { data: u } = await supabase
        .from('users')
        .select('id, display_name, avatar_initial, role_title')
        .eq('id', sm.user_id)
        .single()
      if (u) staff.push({ user: u, membership: sm })
    }

    paperDataList.push({
      paper: paperRes.data,
      membership: m,
      storyCount: storiesRes.data?.length || 0,
      staff,
    })
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
        <Link href="/"><RagtagLogo className="h-7 w-auto" /></Link>
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
            {paperDataList.map(({ paper, membership, storyCount, staff }) => (
              <div key={paper.id} className="pb-12 border-b border-rules/20">
                <div className="flex flex-col md:flex-row md:items-start gap-8">
                  {/* Paper info */}
                  <div className="flex-1">
                    <h2 className="masthead-name text-4xl mb-1">{paper.name}</h2>
                    {paper.masthead_tagline && (
                      <p className="font-garamond italic text-text-secondary mb-3">&ldquo;{paper.masthead_tagline}&rdquo;</p>
                    )}

                    {/* Story count + digest */}
                    <div className="flex flex-wrap gap-4 items-center mb-4">
                      <p className="font-courier text-xs text-text-secondary uppercase tracking-widest">
                        {storyCount} {storyCount === 1 ? 'story' : 'stories'} filed
                      </p>
                      <p className="font-courier text-xs text-text-secondary uppercase tracking-widest">
                        Weekly edition: {paper.digest_enabled ? 'On' : 'Off'}
                      </p>
                      <p className="font-courier text-xs text-text-secondary uppercase tracking-widest">
                        Style: {paper.style === 'standard' ? 'Standard' : paper.style}
                      </p>
                    </div>

                    {/* SMS / Email submission channels */}
                    <div className="space-y-1 mb-4">
                      {paper.twilio_number && (
                        <p className="font-garamond text-sm text-text-primary">
                          <span className="font-courier text-xs uppercase tracking-widest text-text-secondary mr-2">SMS</span>
                          File a story: <span className="font-courier">{paper.twilio_number}</span>
                        </p>
                      )}
                      {paper.email_address && (
                        <p className="font-garamond text-sm text-text-primary">
                          <span className="font-courier text-xs uppercase tracking-widest text-text-secondary mr-2">Email</span>
                          File a story: <span className="font-courier">{paper.email_address}</span>
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3 items-center mt-4">
                      <Link href={`/paper/${paper.id}/submit`} className="btn-primary">
                        File a story →
                      </Link>
                      {membership.role === 'eic' && (
                        <Link href={`/paper/${paper.id}`} className="btn-secondary">
                          Manage paper
                        </Link>
                      )}
                      <Link
                        href={`/p/${paper.slug}`}
                        className="font-garamond italic text-text-secondary text-sm hover:text-text-primary"
                        target="_blank"
                      >
                        View paper →
                      </Link>
                    </div>
                  </div>

                  {/* Staff reporters */}
                  {staff.length > 0 && (
                    <div className="md:w-56">
                      <p className="section-header mb-3">Staff Reporters</p>
                      <hr className="rule-thin mb-3" />
                      <div className="space-y-2">
                        {staff.map(({ user: u, membership: sm }) => (
                          <div key={sm.id} className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-text-primary text-background flex items-center justify-center font-arvo font-bold text-xs shrink-0">
                              {u.avatar_initial || u.display_name?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className="font-garamond text-sm text-text-primary leading-tight">
                                {u.display_name || '—'}
                                {sm.role === 'eic' && (
                                  <span className="font-courier text-[0.6rem] text-accent ml-1">EIC</span>
                                )}
                              </p>
                              {u.role_title && (
                                <p className="font-courier text-[0.6rem] tracking-wide text-text-secondary uppercase">
                                  {u.role_title}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

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
