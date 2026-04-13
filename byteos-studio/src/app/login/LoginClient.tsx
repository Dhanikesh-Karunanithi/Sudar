'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
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
    <div className="min-h-screen flex bg-[#050505]">
      <div className="relative hidden lg:flex lg:w-[480px] shrink-0 flex-col justify-between border-r border-white/[0.06] bg-[#080808] p-12">
        <AuthMarketingDecor />

        <div className="relative flex items-center gap-3">
          <SudarLogoMark className="h-10 w-10 shrink-0 text-white" starFill="#080808" animated />
          <div>
            <p className="font-display text-base font-semibold leading-tight text-white">Sudar Studio</p>
            <p className="text-xs font-medium tracking-wide text-[#FF4500]/80">Admin &amp; creator</p>
          </div>
        </div>

        <div className="relative space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#FF4500]/20 bg-[#FF4500]/[0.06] px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF4500]" />
              <span className="text-xs font-medium tracking-widest text-[#FF4500]/90">AI-native authoring</span>
            </div>
            <p className="font-display text-2xl font-light leading-snug text-white text-balance">
              Build adaptive courses once. Deliver across seven modalities—with a tutor that remembers.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Visual templates', value: '14' },
              { label: 'Modalities', value: '7' },
              { label: 'Learner model', value: 'Twin' },
              { label: 'Exports', value: 'SCORM' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-white/[0.06] bg-black/30 p-4 backdrop-blur-sm"
              >
                <p className="text-2xl font-semibold tabular-nums text-white">{stat.value}</p>
                <p className="mt-0.5 text-xs text-zinc-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-zinc-600">© 2026 Sudar · Learns with you, for you.</p>
      </div>

      <div className="relative flex flex-1 items-center justify-center p-8">
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]" aria-hidden style={{
          backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        <div className="relative w-full max-w-sm space-y-8">
          <div className="flex items-center justify-center gap-3 lg:hidden">
            <SudarLogoMark className="h-10 w-10 shrink-0 text-white" starFill="#050505" />
            <p className="font-display text-base font-semibold text-white">Sudar Studio</p>
          </div>

          <div className="space-y-1.5">
            <h1 className="font-display text-2xl font-semibold text-white">Welcome back</h1>
            <p className="text-sm text-zinc-500">Sign in to your Studio workspace</p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
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
                placeholder="you@company.com"
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

          <div className="my-2 flex items-center gap-3">
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

          <p className="text-center text-sm text-zinc-500">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-medium text-[#FF4500]/90 transition-colors hover:text-[#FF5722]">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
