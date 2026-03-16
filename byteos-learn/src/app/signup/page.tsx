'use client'

import { useState } from 'react'
import Link from 'next/link'
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-green-100 border border-green-200 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-900">Almost there!</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              We sent a confirmation link to{' '}
              <span className="text-slate-800 font-medium">{email}</span>.
              Click it to activate your account and start learning.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-block text-primary hover:opacity-90 text-sm font-medium transition-colors"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="relative w-16 h-16 mx-auto">
            <span className="sr-only">Sudar</span>
            <div
              className="absolute inset-0 bg-primary block dark:hidden logo-mask-light"
              aria-hidden
            />
            <div
              className="absolute inset-0 bg-primary hidden dark:block logo-mask-dark"
              aria-hidden
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Sudar Learn</h1>
            <p className="text-slate-500 text-sm mt-1">Start your learning journey</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-900">Create your account</h2>
            <p className="text-slate-500 text-sm">Join thousands of learners on Sudar.</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="fullName">
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Jane Smith"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Min. 8 characters"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all text-sm shadow-sm shadow-indigo-500/20 mt-2"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-2">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400">or</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-white hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed border border-slate-300 rounded-lg text-slate-800 text-sm font-medium transition-colors"
          >
            <GoogleIcon size={18} className="shrink-0" />
            <span>Sign up with Google</span>
          </button>

          <p className="text-center text-slate-500 text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:opacity-90 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-slate-400 text-xs">
          © 2026 Sudar · Learns with you, for you.
        </p>
      </div>
    </div>
  )
}
