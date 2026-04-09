import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const redirect = searchParams.get('redirect') || '/dashboard'
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) return NextResponse.redirect(new URL('/auth/login?error=auth_failed', request.url))
  } else if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as 'email' })
    if (error) return NextResponse.redirect(new URL('/auth/login?error=auth_failed', request.url))
  } else {
    return NextResponse.redirect(new URL('/auth/login?error=auth_failed', request.url))
  }

  // Forward any auth cookies onto the redirect response so the session
  // is visible to the middleware on the very next request.
  const redirectResponse = NextResponse.redirect(new URL(redirect, request.url))
  cookieStore.getAll().forEach(cookie => {
    redirectResponse.cookies.set(cookie.name, cookie.value)
  })
  return redirectResponse
}
