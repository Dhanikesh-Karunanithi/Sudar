'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SudarLogoMark } from '@/components/branding/SudarLogo'
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

    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const next = encodeURIComponent('/reset-password')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=${next}`,
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
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#050505] p-6">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="relative mx-auto flex h-12 w-12 items-center justify-center">
            <span className="sr-only">Sudar</span>
            <SudarLogoMark className="h-full w-full text-white" starFill="#050505" />
          </div>
          <h1 className="font-display text-xl font-semibold text-white">Check your email</h1>
          <p className="text-sm text-zinc-500">
            We&apos;ve sent a password reset link to <strong className="text-zinc-300">{email}</strong>. Click the link
            to set a new password.
          </p>
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#050505] p-6">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        aria-hidden
        style={{
          backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative w-full max-w-md space-y-8">
        <div className="space-y-3 text-center">
          <div className="relative mx-auto flex h-12 w-12 items-center justify-center">
            <span className="sr-only">Sudar</span>
            <SudarLogoMark className="h-full w-full text-white" starFill="#050505" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-white">Reset password</h1>
          <p className="text-sm text-zinc-500">Enter your email and we&apos;ll send you a link to reset your password.</p>
        </div>

        <div className="space-y-6 rounded-2xl border border-white/[0.08] bg-zinc-950/60 p-8 backdrop-blur-sm">
          {error && (
            <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#FF4500] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#FF5722] disabled:cursor-not-allowed disabled:bg-[#FF4500]/40"
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-500">
            <Link href="/login" className="font-medium text-[#FF4500]/90 transition-colors hover:text-[#FF5722]">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
