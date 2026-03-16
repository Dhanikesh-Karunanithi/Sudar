'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2 } from 'lucide-react'
import { GoogleIcon } from '@/components/ui/GoogleIcon'

export default function SignupPage() {
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-white">Check your email</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              We sent a confirmation link to{' '}
              <span className="text-slate-200 font-medium">{email}</span>.
              Click it to activate your Sudar Studio account.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-block text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[480px] flex-col justify-between p-12 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 border-r border-slate-800 relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.12),transparent_60%)] pointer-events-none" />

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

        <div className="relative space-y-6">
          <h2 className="text-2xl font-light text-white leading-relaxed">
            Start building adaptive learning experiences in minutes.
          </h2>
          <ul className="space-y-3">
            {[
              'Generate courses from PDFs, URLs, or a text prompt',
              'Deliver content in 7 modalities — text, video, game and more',
              'AI Tutor "Sudar" learns each learner over time',
              'Full analytics: completions, skill gaps, drop-off',
            ].map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                <span className="text-slate-300 text-sm">{feature}</span>
              </li>
            ))}
          </ul>
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
            <h1 className="text-2xl font-semibold text-white">Create your account</h1>
            <p className="text-slate-400 text-sm">Get started with Sudar Studio — free to begin.</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300" htmlFor="fullName">
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Jane Smith"
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 text-sm transition-all"
              />
            </div>

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
                placeholder="Min. 8 characters"
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 text-sm transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-sm mt-2"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-2">
            <div className="h-px flex-1 bg-slate-800" />
            <span className="text-xs text-slate-500">or</span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-900/70 disabled:cursor-not-allowed border border-slate-700 rounded-lg text-slate-100 text-sm font-medium transition-colors"
          >
            <GoogleIcon size={18} className="shrink-0" />
            <span>Sign up with Google</span>
          </button>

          <p className="text-center text-slate-500 text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
