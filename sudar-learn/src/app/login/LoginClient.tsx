'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { AuthMarketingDecor } from '@/components/auth/AuthMarketingDecor'
import { SudarLogoMark } from '@/components/branding/SudarLogo'
import { GoogleIcon } from '@/components/ui/GoogleIcon'
import { createClient } from '@/lib/supabase/client'

export function LoginClient() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const searchParams = useSearchParams()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Invalid email or password. Please try again.')
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  async function handleGoogleSignIn() {
    try {
      setLoading(true)
      setError(null)

      const nextParam = searchParams?.get('next') ?? '/'
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextParam)}`

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      })

      if (error) {
        setError('Unable to sign in with Google. Please try again.')
        setLoading(false)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
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

        <div className="relative space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#FF4500]/20 bg-[#FF4500]/[0.06] px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF4500]" />
              <span className="text-xs font-medium tracking-widest text-[#FF4500]/90">Adaptive learning</span>
            </div>
            <p className="font-display text-2xl font-light leading-snug text-white text-balance">
              Six modalities, one tutor that remembers you — pick up exactly where you left off.
            </p>
          </div>

          <ul className="space-y-3">
            {[
              'Personalized paths from your Digital Learner Twin',
              'Read, Listen, Watch, Podcast, Map, and Cards from one course',
              'Sudar tutor: proactive help with governed memory',
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
              <h1 className="font-display text-xl font-semibold text-white">Sudar Learn</h1>
              <p className="mt-1 text-sm text-zinc-500">Your personalized learning experience</p>
            </div>
          </div>

          <div className="mb-6 space-y-1 text-center">
            <h1 className="font-display text-2xl font-semibold text-white">Welcome back</h1>
            <p className="text-sm text-zinc-500">Sign in to continue your learning.</p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-zinc-950/60 p-8 backdrop-blur-sm">

            {error && (
              <div className="mb-4 rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
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
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-zinc-400" htmlFor="password">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-[#FF4500]/85 transition-colors hover:text-[#FF5722]"
                  >
                    Forgot password?
                  </Link>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 transition-colors focus:border-[#FF4500]/50 focus:outline-none focus:ring-1 focus:ring-[#FF4500]/30"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-full bg-[#FF4500] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#FF5722] disabled:cursor-not-allowed disabled:bg-[#FF4500]/40"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/[0.08]" />
              <span className="text-xs text-zinc-600">or</span>
              <div className="h-px flex-1 bg-white/[0.08]" />
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/[0.1] bg-white/[0.04] py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:border-white/[0.16] hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <GoogleIcon size={18} className="shrink-0" />
              <span>Sign in with Google</span>
            </button>

            <p className="mt-6 text-center text-sm text-zinc-500">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-medium text-[#FF4500]/90 transition-colors hover:text-[#FF5722]">
                Create one
              </Link>
            </p>
          </div>

          <p className="text-center text-xs text-zinc-600">© 2026 Sudar · Learns with you, for you.</p>
        </div>
      </div>
    </div>
  )
}
