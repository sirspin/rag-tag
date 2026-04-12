import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { compileEdition } from '@/lib/ai'
import type { UserRow } from '@/types'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const secret = request.headers.get('x-internal-secret')
  if (!secret || secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const service = createServiceClient()

  // Get paper
  const { data: paper } = await service
    .from('papers')
    .select('id, name')
    .eq('id', params.id)
    .single()

  if (!paper) return NextResponse.json({ error: 'Paper not found.' }, { status: 404 })

  // Get all submissions for this paper, newest first
  const { data: rawSubmissions } = await service
    .from('submissions')
    .select('*')
    .eq('paper_id', params.id)
    .order('submitted_at', { ascending: false })

  if (!rawSubmissions || rawSubmissions.length === 0) {
    return NextResponse.json({ success: true, skipped: true })
  }

  // Enrich with user data
  const userCache = new Map<string, Pick<UserRow, 'id' | 'display_name' | 'avatar_initial' | 'role_title'>>()
  const submissions = []

  for (const sub of rawSubmissions) {
    if (!userCache.has(sub.user_id)) {
      const { data: u } = await service
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

  // Run AI organization
  const aiSections = await compileEdition(paper.name, 0, submissions)

  // Store on paper
  const { error } = await service
    .from('papers')
    .update({ ai_sections: aiSections })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, aiSections })
}
