'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { AuthMarketingDecor } from '@/components/auth/AuthMarketingDecor'
import { SudarLogoMark } from '@/components/branding/SudarLogo'
import { GoogleIcon } from '@/components/ui/GoogleIcon'
import { createClient } from '@/lib/supabase/client'

export function SignupClient() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()
  const searchParams = useSearchParams()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
    }
  }

  async function handleGoogleSignUp() {
    try {
      setLoading(true)
      setError(null)
      const nextParam = searchParams?.get('next') ?? '/'
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextParam)}`
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      })
      if (error) {
        setError('Unable to sign up with Google. Please try again.')
        setLoading(false)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] p-6 sm:p-8">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/25 bg-emerald-500/10">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>
          <div className="space-y-2">
            <h2 className="font-display text-xl font-semibold text-white">Almost there</h2>
            <p className="text-sm leading-relaxed text-zinc-500">
              We sent a confirmation link to{' '}
              <span className="font-medium text-zinc-300">{email}</span>. Open it to activate your account and start
              learning.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-block text-sm font-medium text-[#FF4500]/90 transition-colors hover:text-[#FF5722]"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#050505]">
      <div className="relative hidden shrink-0 flex-col justify-between border-r border-white/[0.06] bg-[#080808] p-12 lg:flex lg:w-[480px]">
        <AuthMarketingDecor />

        <div className="relative flex items-center gap-3">
          <SudarLogoMark className="h-10 w-10 shrink-0 text-white" starFill="#080808" animated />
          <div>
            <p className="font-display text-base font-semibold leading-tight text-white">Sudar Learn</p>
            <p className="text-xs font-medium tracking-wide text-[#FF4500]/80">Learner experience</p>
          </div>
        </div>

        <div className="relative space-y-6">
          <h2 className="font-display text-2xl font-light leading-relaxed text-white text-balance">
            Join your organisation on the adaptive learning OS built for how people actually learn.
          </h2>
          <ul className="space-y-3">
            {[
              'Courses that adapt to your pace and preferred modality',
              'Tutor Sudar remembers context across sessions',
              'Progress and skill signals stay private to your org',
            ].map((line) => (
              <li key={line} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#FF4500]/80" />
                <span className="text-sm text-zinc-400">{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-zinc-600">© 2026 Sudar · Learns with you, for you.</p>
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center p-6 sm:p-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          aria-hidden
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative w-full max-w-md space-y-8">
          <div className="flex flex-col items-center gap-3 text-center lg:hidden">
            <SudarLogoMark className="h-10 w-10 shrink-0 text-white" starFill="#050505" />
            <div>
              <p className="font-display text-xl font-semibold text-white">Sudar Learn</p>
              <p className="mt-1 text-sm text-zinc-500">Start your learning journey</p>
            </div>
          </div>

          <div className="mb-6 space-y-1 text-center">
            <h1 className="font-display text-2xl font-semibold text-white">Create your account</h1>
            <p className="text-sm text-zinc-500">Join your team on Sudar Learn.</p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-zinc-950/60 p-8 backdrop-blur-sm">
            {error && (
              <div className="mb-4 rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-400" htmlFor="fullName">
                  Full name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="Jane Smith"
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 transition-colors focus:border-[#FF4500]/50 focus:outline-none focus:ring-1 focus:ring-[#FF4500]/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-400" htmlFor="email">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 transition-colors focus:border-[#FF4500]/50 focus:outline-none focus:ring-1 focus:ring-[#FF4500]/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-400" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Min. 8 characters"
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 transition-colors focus:border-[#FF4500]/50 focus:outline-none focus:ring-1 focus:ring-[#FF4500]/30"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-full bg-[#FF4500] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#FF5722] disabled:cursor-not-allowed disabled:bg-[#FF4500]/40"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/[0.08]" />
              <span className="text-xs text-zinc-600">or</span>
              <div className="h-px flex-1 bg-white/[0.08]" />
            </div>

            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/[0.1] bg-white/[0.04] py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:border-white/[0.16] hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <GoogleIcon size={18} className="shrink-0" />
              <span>Sign up with Google</span>
            </button>

            <p className="mt-6 text-center text-sm text-zinc-500">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-[#FF4500]/90 transition-colors hover:text-[#FF5722]">
                Sign in
              </Link>
            </p>
          </div>

          <p className="text-center text-xs text-zinc-600">© 2026 Sudar · Learns with you, for you.</p>
        </div>
      </div>
    </div>
  )
}
