'use client'

import Link from 'next/link'
import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'

import { SudarLogoMark } from '@/components/branding/SudarLogo'

export default function WaitlistPage() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [useCase, setUseCase] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, useCase }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Could not join waitlist.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] p-8">
        <div className="max-w-sm space-y-4 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
          <h1 className="text-xl font-semibold text-white">You&apos;re on the list</h1>
          <p className="text-sm text-zinc-500">We&apos;ll email you an invite code when early access opens.</p>
          <Link href="/signup" className="inline-block text-sm text-[#FF4500]/90">Back to signup</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] p-8">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-white/[0.08] bg-zinc-950/60 p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <SudarLogoMark className="h-10 w-10 text-white" starFill="#050505" />
          <h1 className="font-display text-xl font-semibold text-white">Join the waitlist</h1>
          <p className="text-sm text-zinc-500">Request early access to Sudar Studio.</p>
        </div>
        {error && <p className="text-sm text-red-300">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (optional)" className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white" />
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Work email" className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white" />
          <input type="text" value={useCase} onChange={(e) => setUseCase(e.target.value)} placeholder="Use case (optional)" className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white" />
          <button type="submit" disabled={loading} className="w-full rounded-full bg-[#FF4500] py-2.5 text-sm text-white disabled:opacity-40">
            {loading ? 'Submitting…' : 'Join waitlist'}
          </button>
        </form>
        <p className="text-center text-sm text-zinc-500">
          Have a code? <Link href="/signup" className="text-[#FF4500]/90">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
