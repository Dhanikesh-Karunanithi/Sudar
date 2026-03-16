'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/change-password`,
    })

    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="relative w-16 h-16 mx-auto">
            <span className="sr-only">Sudar</span>
            <div className="absolute inset-0 bg-primary block dark:hidden logo-mask-light rounded-2xl" aria-hidden />
            <div className="absolute inset-0 bg-primary hidden dark:block logo-mask-dark rounded-2xl" aria-hidden />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Check your email</h1>
          <p className="text-slate-600 text-sm">
            We&apos;ve sent a password reset link to <strong>{email}</strong>. Click the link to set a new password.
          </p>
          <Link
            href="/login"
            className="inline-block text-primary font-medium hover:opacity-90 text-sm"
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
        <div className="text-center space-y-3">
          <div className="relative w-16 h-16 mx-auto">
            <span className="sr-only">Sudar</span>
            <div className="absolute inset-0 bg-primary block dark:hidden logo-mask-light rounded-2xl" aria-hidden />
            <div className="absolute inset-0 bg-primary hidden dark:block logo-mask-dark rounded-2xl" aria-hidden />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Reset password</h1>
          <p className="text-slate-500 text-sm">Enter your email and we&apos;ll send you a link to reset your password.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all text-sm shadow-sm shadow-indigo-500/20"
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm">
            <Link href="/login" className="text-primary hover:opacity-90 font-medium transition-colors">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
