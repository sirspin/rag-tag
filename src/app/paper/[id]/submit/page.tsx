import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SubmissionForm from '@/components/forms/SubmissionForm'
import type { PaperRow } from '@/types'

export default async function SubmitPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { url?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/login?redirect=/paper/${params.id}/submit`)

  // Verify membership
  const { data: membership } = await supabase
    .from('memberships')
    .select('*')
    .eq('paper_id', params.id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  if (!membership) redirect('/dashboard')

  const { data: paper } = await supabase
    .from('papers')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!paper) redirect('/dashboard')

  return (
    <div className="bg-background min-h-screen">
      {/* Minimal nav */}
      <div className="max-w-lg mx-auto px-6 py-5">
        <p className="font-courier text-xs text-text-secondary tracking-widest text-center">
          {paper.name.toUpperCase()}
        </p>
      </div>

      <hr className="rule-thin max-w-lg mx-auto" />

      <main className="max-w-lg mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="masthead-name text-4xl mb-2">Submit a link.</h1>
          <p className="font-garamond italic text-text-secondary">
            Share something worth reading.
          </p>
        </div>

        <hr className="rule-thick mb-10" />

        <SubmissionForm paper={paper as PaperRow} defaultUrl={searchParams.url} />
      </main>
    </div>
  )
}
