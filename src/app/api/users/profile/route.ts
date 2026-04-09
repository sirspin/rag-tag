import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })

  const body = await request.json()
  const updates: Record<string, unknown> = { id: user.id, email: user.email! }

  if (typeof body.role_title === 'string') updates.role_title = body.role_title.trim() || null
  if (typeof body.bio === 'string') updates.bio = body.bio.trim() || null

  const service = createServiceClient()
  const { error } = await service
    .from('users')
    .upsert(updates, { onConflict: 'id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
