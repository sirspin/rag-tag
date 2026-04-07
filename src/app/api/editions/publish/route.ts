import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const { edition_id } = await request.json()

  if (!edition_id) {
    return NextResponse.json({ error: 'edition_id is required.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  // Get edition
  const { data: edition } = await supabase
    .from('editions')
    .select('*')
    .eq('id', edition_id)
    .single()

  if (!edition) {
    return NextResponse.json({ error: 'Edition not found.' }, { status: 404 })
  }

  // Verify EIC
  const { data: membership } = await supabase
    .from('memberships')
    .select('*')
    .eq('paper_id', edition.paper_id)
    .eq('user_id', user.id)
    .eq('role', 'eic')
    .eq('status', 'active')
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'Only the EIC can publish editions.' }, { status: 403 })
  }

  const serviceSupabase = await createServiceClient()

  const { error } = await serviceSupabase
    .from('editions')
    .update({ status: 'published', publish_at: new Date().toISOString() })
    .eq('id', edition_id)

  if (error) {
    return NextResponse.json({ error: 'Failed to publish edition.' }, { status: 500 })
  }

  // Get paper slug for redirect
  const { data: paper } = await supabase
    .from('papers')
    .select('slug')
    .eq('id', edition.paper_id)
    .single()

  return NextResponse.json({
    success: true,
    public_url: paper ? `/p/${paper.slug}/${edition.edition_number}` : null,
  })
}
