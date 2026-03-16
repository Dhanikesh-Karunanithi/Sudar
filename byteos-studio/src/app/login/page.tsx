'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GoogleIcon } from '@/components/ui/GoogleIcon'

export default function LoginPage() {
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
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[480px] flex-col justify-between p-12 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 border-r border-slate-800 relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.12),transparent_60%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(139,92,246,0.08),transparent_60%)] pointer-events-none" />

        <div className="relative flex items-center gap-3">
          <div className="relative w-9 h-9 shrink-0">
            <Image
              src="/sudar-logo-dark.png"
              alt="Sudar"
              fill
              className="object-contain"
              sizes="36px"
            />
          </div>
          <div>
            <p className="text-white font-semibold text-base leading-tight">Sudar Studio</p>
            <p className="text-indigo-400 text-xs">Admin & Creator</p>
          </div>
        </div>

        <div className="relative space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              <span className="text-indigo-300 text-xs font-medium">AI-powered learning creation</span>
            </div>
            <blockquote className="text-2xl font-light text-white leading-relaxed">
              Build world-class training content without needing a team of designers.
            </blockquote>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Course templates', value: '14' },
              { label: 'Modalities', value: '7' },
              { label: 'AI providers', value: '3' },
              { label: 'Export formats', value: 'SCORM' },
            ].map((stat) => (
              <div key={stat.label} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-slate-400 text-xs mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-slate-600 text-xs">
          © 2026 Sudar · Learns with you, for you.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 justify-center">
            <div className="relative w-9 h-9 shrink-0">
              <Image
                src="/sudar-logo-dark.png"
                alt="Sudar"
                fill
                className="object-contain"
                sizes="36px"
              />
            </div>
            <p className="text-white font-semibold text-base">Sudar Studio</p>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold text-white">Welcome back</h1>
            <p className="text-slate-400 text-sm">Sign in to your Studio workspace</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 text-sm transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 text-sm transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-sm mt-2"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-2">
            <div className="h-px flex-1 bg-slate-800" />
            <span className="text-xs text-slate-500">or</span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-900/70 disabled:cursor-not-allowed border border-slate-700 rounded-lg text-slate-100 text-sm font-medium transition-colors"
          >
            <GoogleIcon size={18} className="shrink-0" />
            <span>Sign in with Google</span>
          </button>

          <p className="text-center text-slate-500 text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
