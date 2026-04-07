import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { extractArticle } from '@/lib/extraction'
import { compileEdition } from '@/lib/ai'
import type { SubmissionWithUser } from '@/types'

export const maxDuration = 120

export async function POST(request: NextRequest) {
  const { paper_id } = await request.json()

  if (!paper_id) {
    return NextResponse.json({ error: 'paper_id is required.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  // Verify EIC
  const { data: membership } = await supabase
    .from('memberships')
    .select('*')
    .eq('paper_id', paper_id)
    .eq('user_id', user.id)
    .eq('role', 'eic')
    .eq('status', 'active')
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'Only the EIC can compile editions.' }, { status: 403 })
  }

  // Get paper
  const { data: paper } = await supabase
    .from('papers')
    .select('*')
    .eq('id', paper_id)
    .single()

  if (!paper) {
    return NextResponse.json({ error: 'Paper not found.' }, { status: 404 })
  }

  // Get submissions without an edition
  const { data: rawSubmissions } = await supabase
    .from('submissions')
    .select('*')
    .eq('paper_id', paper_id)
    .is('edition_id', null)

  if (!rawSubmissions || rawSubmissions.length === 0) {
    return NextResponse.json({ error: 'No submissions to compile.' }, { status: 400 })
  }

  // Enrich with user data
  const serviceSupabase = await createServiceClient()
  const submissions: SubmissionWithUser[] = []

  for (const sub of rawSubmissions) {
    const { data: userRow } = await serviceSupabase
      .from('users')
      .select('id, display_name, avatar_initial')
      .eq('id', sub.user_id)
      .single()

    submissions.push({
      ...sub,
      user: userRow || { id: sub.user_id, display_name: null, avatar_initial: null },
    })
  }

  // Determine next edition number
  const { data: existingEditions } = await supabase
    .from('editions')
    .select('edition_number')
    .eq('paper_id', paper_id)
    .order('edition_number', { ascending: false })
    .limit(1)

  const editionNumber = (existingEditions?.[0]?.edition_number || 0) + 1

  // Create edition record (draft)
  const { data: edition, error: editionError } = await serviceSupabase
    .from('editions')
    .insert({
      paper_id,
      edition_number: editionNumber,
      status: 'draft',
    })
    .select()
    .single()

  if (editionError || !edition) {
    return NextResponse.json({ error: 'Failed to create edition.' }, { status: 500 })
  }

  // Extract articles in parallel (with concurrency limit)
  const CONCURRENCY = 3
  const updatedSubmissions: SubmissionWithUser[] = [...submissions]

  for (let i = 0; i < submissions.length; i += CONCURRENCY) {
    const batch = submissions.slice(i, i + CONCURRENCY)
    await Promise.all(
      batch.map(async (sub, batchIndex) => {
        const result = await extractArticle(sub.url)
        const globalIndex = i + batchIndex

        // Update in DB
        await serviceSupabase
          .from('submissions')
          .update({
            extracted_text: result.text,
            extraction_status: result.status,
            edition_id: edition.id,
          })
          .eq('id', sub.id)

        updatedSubmissions[globalIndex] = {
          ...sub,
          extracted_text: result.text,
          extraction_status: result.status,
          edition_id: edition.id,
        }
      })
    )
  }

  // Run AI compilation
  let aiSections
  try {
    aiSections = await compileEdition(paper.name, editionNumber, updatedSubmissions)
  } catch (err) {
    console.error('AI compilation error:', err)
    // Clear FK references first, then delete draft edition
    await serviceSupabase.from('submissions').update({ edition_id: null }).eq('edition_id', edition.id)
    await serviceSupabase.from('editions').delete().eq('id', edition.id)
    return NextResponse.json({ error: 'AI compilation failed. Please try again.' }, { status: 500 })
  }

  // Save AI sections to edition
  await serviceSupabase
    .from('editions')
    .update({ ai_sections: aiSections })
    .eq('id', edition.id)

  return NextResponse.json({ success: true, edition_id: edition.id })
}
