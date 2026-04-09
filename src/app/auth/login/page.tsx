'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import RagtagLogo from '@/components/RagtagLogo'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'
  const authError = searchParams.get('error')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
      },
    })

    if (error) {
      setError(error.message || 'Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="text-center">
        <hr className="rule-thin mb-8" />
        <p className="font-courier text-sm text-text-secondary tracking-widest uppercase mb-6">
          Check your inbox
        </p>
        <p className="font-garamond text-xl italic text-text-primary mb-2">
          A link is on its way to <strong className="not-italic font-normal">{email}</strong>.
        </p>
        <p className="font-garamond text-base text-text-secondary">
          Click it to sign in. No password needed, ever.
        </p>
        <hr className="rule-thin mt-8" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {authError === 'auth_failed' && (
        <p className="font-garamond italic text-accent text-sm text-center">
          That link has expired or already been used. Request a new one below.
        </p>
      )}
      <div>
        <label className="section-header block mb-3">
          Your email
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="name@example.com"
          className="input-editorial text-lg"
          autoFocus
        />
      </div>
      {error && (
        <p className="font-garamond italic text-accent text-sm">{error}</p>
      )}
      <button
        type="submit"
        disabled={loading || !email}
        className="btn-primary w-full"
      >
        {loading ? 'Sending…' : 'Send me a link'}
      </button>
      <p className="font-garamond italic text-text-secondary text-sm text-center">
        We&rsquo;ll email you a magic link. No passwords, ever.
      </p>
    </form>
  )
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Masthead */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <RagtagLogo className="h-12 w-auto" />
          </div>
          <p className="font-quattrocento italic text-text-secondary">
            The paper your people make.
          </p>
        </div>

        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  )
}
