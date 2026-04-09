import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })

  // EIC check
  const { data: membership } = await supabase
    .from('memberships')
    .select('role')
    .eq('paper_id', params.id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  if (!membership || membership.role !== 'eic') {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  const body = await request.json()
  const updates: Record<string, unknown> = {}

  if (typeof body.digest_enabled === 'boolean') updates.digest_enabled = body.digest_enabled
  if (typeof body.style === 'string') updates.style = body.style

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 })
  }

  const service = createServiceClient()
  const { error } = await service
    .from('papers')
    .update(updates)
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
