import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { UserRow, MembershipRow } from '@/types'
import Link from 'next/link'

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const supabase = await createClient()
  const { data: paper } = await supabase
    .from('papers')
    .select('name')
    .eq('slug', params.slug)
    .single()

  if (!paper) return { title: 'Ragtag' }
  return { title: `${paper.name} — Staff` }
}

type StaffMember = {
  user: Pick<UserRow, 'id' | 'display_name' | 'avatar_initial' | 'role_title' | 'bio'>
  membership: Pick<MembershipRow, 'id' | 'role'>
}

export default async function StaffPage({
  params,
}: {
  params: { slug: string }
}) {
  const supabase = await createClient()

  const { data: paper } = await supabase
    .from('papers')
    .select('id, name, masthead_tagline, slug')
    .eq('slug', params.slug)
    .single()

  if (!paper) notFound()

  const { data: memberships } = await supabase
    .from('memberships')
    .select('id, role, user_id')
    .eq('paper_id', paper.id)
    .eq('status', 'active')

  const staff: StaffMember[] = []
  for (const m of memberships || []) {
    const { data: u } = await supabase
      .from('users')
      .select('id, display_name, avatar_initial, role_title, bio')
      .eq('id', m.user_id)
      .single()
    if (u) {
      staff.push({ user: u, membership: { id: m.id, role: m.role } })
    }
  }

  // EIC first, then alphabetical
  staff.sort((a, b) => {
    if (a.membership.role === 'eic' && b.membership.role !== 'eic') return -1
    if (b.membership.role === 'eic' && a.membership.role !== 'eic') return 1
    return (a.user.display_name || '').localeCompare(b.user.display_name || '')
  })

  return (
    <div className="bg-background min-h-screen">
      <main className="max-w-broadsheet mx-auto px-4 md:px-8 pt-4 md:pt-6 pb-0">
        {/* Masthead header */}
        <hr className="rule-broadsheet-double mb-0" />
        <div className="flex items-center justify-between py-1 border-b border-rules">
          <Link
            href={`/p/${paper.slug}`}
            className="font-arvo text-[0.58rem] tracking-[0.18em] uppercase text-text-secondary hover:text-text-primary transition-colors"
          >
            ← {paper.name}
          </Link>
          <p className="font-arvo text-[0.58rem] tracking-[0.18em] uppercase text-text-secondary">
            The Staff
          </p>
        </div>

        <div className="bg-text-primary text-background text-center py-4 px-2">
          <h1
            className="font-quattrocento font-bold text-background leading-none tracking-tight"
            style={{
              fontSize: 'clamp(3rem, 10vw, 8rem)',
              letterSpacing: '0.02em',
              lineHeight: '0.9',
            }}
          >
            {paper.name}
          </h1>
        </div>

        {paper.masthead_tagline && (
          <div className="border-b border-rules py-1.5 text-center">
            <p
              className="font-quattrocento italic text-text-secondary"
              style={{ fontSize: 'clamp(0.72rem, 1.4vw, 0.95rem)' }}
            >
              &ldquo;{paper.masthead_tagline}&rdquo;
            </p>
          </div>
        )}

        {/* Staff list */}
        <hr className="rule-broadsheet-thick" />
        <div className="py-8">
          <p className="section-header mb-6">Our Staff</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {staff.map(({ user, membership }) => (
              <div key={membership.id} className="border-t border-rules/40 pt-4">
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-10 h-10 bg-text-primary text-background flex items-center justify-center font-arvo font-bold text-base shrink-0">
                    {user.avatar_initial || user.display_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-quattrocento font-bold text-text-primary text-lg leading-tight">
                      {user.display_name || 'Staff Reporter'}
                    </p>
                    {user.role_title ? (
                      <p className="font-arvo text-[0.65rem] tracking-[0.1em] uppercase text-text-secondary">
                        {user.role_title}
                      </p>
                    ) : membership.role === 'eic' ? (
                      <p className="font-arvo text-[0.65rem] tracking-[0.1em] uppercase text-accent">
                        Editor in Chief
                      </p>
                    ) : null}
                  </div>
                </div>
                {user.bio && (
                  <p className="font-garamond text-text-secondary text-sm leading-relaxed">
                    {user.bio}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-text-primary text-background mt-4 py-2 px-0 flex items-center justify-between">
          <Link
            href={`/p/${paper.slug}`}
            className="font-quattrocento font-bold text-background hover:text-background/80 transition-colors"
            style={{ fontSize: 'clamp(0.9rem, 2vw, 1.2rem)', letterSpacing: '0.04em' }}
          >
            {paper.name}
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
