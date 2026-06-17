'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'

import { buildAuthCallbackUrl, safeNextPath } from '@shared-access/authIntent'
import { AuthMarketingDecor } from '@/components/auth/AuthMarketingDecor'
import { setPendingInvite } from '@/components/auth/PendingInviteHandler'
import { SudarLogoMark } from '@/components/branding/SudarLogo'
import { GoogleIcon } from '@/components/ui/GoogleIcon'
import { EARLY_ACCESS_COPY } from '@/constants/earlyAccess'
import { createClient } from '@/lib/supabase/client'

function SignupForm() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [inviteValid, setInviteValid] = useState<boolean | null>(null)
  const [inviteMessage, setInviteMessage] = useState<string | null>(null)
  const [inviteGatePassed, setInviteGatePassed] = useState(false)
  const [validatingInvite, setValidatingInvite] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [completeInviteMode, setCompleteInviteMode] = useState(false)
  const [sessionChecked, setSessionChecked] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const nextParam = safeNextPath(searchParams?.get('next') ?? undefined)
  const inviteRequiredError = searchParams?.get('error') === 'invite_required'
  const newAccountError = searchParams?.get('error') === 'new_account_use_signup'

  const validateInvite = useCallback(async (code: string, advanceOnSuccess = false) => {
    if (!code.trim()) {
      setInviteValid(null)
      setInviteMessage(null)
      return false
    }

    setValidatingInvite(true)
    try {
      const res = await fetch('/api/invite/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      })
      const data = await res.json()
      const isValid = data.valid === true
      setInviteValid(isValid)
      if (isValid) {
        setInviteMessage(EARLY_ACCESS_COPY.inviteAccepted)
        if (advanceOnSuccess) setInviteGatePassed(true)
      } else {
        setInviteMessage(data.error || 'Invalid invite code')
        setInviteGatePassed(false)
      }
      return isValid
    } catch {
      setInviteValid(false)
      setInviteMessage('Could not validate invite code')
      setInviteGatePassed(false)
      return false
    } finally {
      setValidatingInvite(false)
    }
  }, [])

  useEffect(() => {
    if (inviteRequiredError) setError(EARLY_ACCESS_COPY.inviteRequiredError)
    if (newAccountError) setError(EARLY_ACCESS_COPY.newAccountError)
  }, [inviteRequiredError, newAccountError])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user && (inviteRequiredError || newAccountError)) {
        setCompleteInviteMode(true)
      }
      setSessionChecked(true)
    })
  }, [inviteRequiredError, newAccountError, supabase.auth])

  function getCallbackUrl() {
    return buildAuthCallbackUrl({
      origin: window.location.origin,
      next: nextParam,
      intent: 'signup',
    })
  }

  async function handleInviteContinue(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const isValid = await validateInvite(inviteCode, true)
    if (!isValid) setError('Enter a valid invite code to continue.')
  }

  async function handleCompleteInvite(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const isValid = await validateInvite(inviteCode)
    if (!isValid) {
      setError('Enter a valid invite code to activate your account.')
      setLoading(false)
      return
    }

    const res = await fetch('/api/invite/apply-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: inviteCode.trim() }),
    })
    const data = await res.json()

    if (!res.ok || !data.ok) {
      setError(data.error || 'Could not apply invite code. Please try again.')
      setLoading(false)
      return
    }

    router.push(nextParam)
    router.refresh()
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    setCompleteInviteMode(false)
    setInviteCode('')
    setInviteValid(null)
    setInviteMessage(null)
    setError(null)
    router.refresh()
  }

  function handleChangeInvite() {
    setInviteGatePassed(false)
    setInviteValid(null)
    setInviteMessage(null)
    setError(null)
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      setLoading(false)
      return
    }

    if (!inviteCode.trim() || !inviteValid) {
      setError('An invite code is required.')
      setLoading(false)
      return
    }

    const validationRes = await fetch('/api/invite/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: inviteCode.trim() }),
    })
    const validation = await validationRes.json()
    if (!validation.valid) {
      setError(validation.error || 'Invalid invite code.')
      setLoading(false)
      return
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          invite_code: validation.code ?? inviteCode.trim(),
        },
        emailRedirectTo: getCallbackUrl(),
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
    } else {
      setPendingInvite(inviteCode.trim())
      if (signUpData.session) {
        await fetch('/api/invite/redeem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: inviteCode.trim() }),
        }).catch(() => {})
      }
      setSuccess(true)
      setLoading(false)
    }
  }

  async function handleGoogleSignUp() {
    if (!inviteCode.trim() || !inviteValid) {
      setError('Enter a valid invite code before continuing with Google.')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const prepareRes = await fetch('/api/invite/prepare-oauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: inviteCode.trim() }),
      })
      const prepareData = await prepareRes.json()
      if (!prepareRes.ok || !prepareData.ok) {
        setError(prepareData.error || 'Invalid invite code.')
        setLoading(false)
        return
      }

      setPendingInvite(inviteCode.trim())

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: getCallbackUrl() },
      })

      if (oauthError) {
        setError('Unable to sign up with Google. Please try again.')
        setLoading(false)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  if (!sessionChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] p-6">
        <div className="h-32 w-full max-w-md animate-pulse rounded-2xl bg-white/[0.04]" />
      </div>
    )
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
              <span className="font-medium text-zinc-300">{email}</span>. Open it to activate your account.
            </p>
          </div>
          <Link href="/login" className="inline-block text-sm font-medium text-[#FF4500]/90 hover:text-[#FF5722]">
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  const formShell = (children: React.ReactNode, title: string, subtitle: string, footer?: React.ReactNode) => (
    <div className="flex min-h-screen bg-[#050505]">
      <div className="relative hidden shrink-0 flex-col justify-between border-r border-white/[0.06] bg-[#080808] p-12 lg:flex lg:w-[480px]">
        <AuthMarketingDecor />
        <div className="relative flex items-center gap-3">
          <SudarLogoMark className="h-10 w-10 shrink-0 text-white" starFill="#080808" animated />
          <div>
            <p className="font-display text-base font-semibold leading-tight text-white">Sudar Learn</p>
            <p className="text-xs font-medium tracking-wide text-[#FF4500]/80">Early access</p>
          </div>
        </div>
        <p className="relative text-sm text-zinc-400">{EARLY_ACCESS_COPY.inviteGateSubtitle}</p>
        <p className="relative text-xs text-zinc-600">© 2026 Sudar · Learns with you, for you.</p>
      </div>
      <div className="relative flex flex-1 flex-col items-center justify-center p-6 sm:p-8">
        <div className="relative w-full max-w-md space-y-8">
          <div className="mb-6 space-y-1 text-center">
            <h1 className="font-display text-2xl font-semibold text-white">{title}</h1>
            <p className="text-sm text-zinc-500">{subtitle}</p>
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-zinc-950/60 p-8 backdrop-blur-sm">
            {children}
            {footer}
          </div>
        </div>
      </div>
    </div>
  )

  if (completeInviteMode) {
    return formShell(
      <>
        <form onSubmit={handleCompleteInvite} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-400" htmlFor="inviteCodeComplete">
              Invite code
            </label>
            <input
              id="inviteCodeComplete"
              type="text"
              required
              autoFocus
              value={inviteCode}
              onChange={(e) => {
                setInviteCode(e.target.value)
                setInviteValid(null)
                setInviteMessage(null)
              }}
              placeholder="Enter your invite code"
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-[#FF4500]/50 focus:outline-none focus:ring-1 focus:ring-[#FF4500]/30"
            />
            {inviteMessage && (
              <p className={`text-xs ${inviteValid ? 'text-emerald-400' : 'text-red-400'}`}>{inviteMessage}</p>
            )}
          </div>
          {error && (
            <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
          )}
          <button
            type="submit"
            disabled={loading || validatingInvite || !inviteCode.trim()}
            className="w-full rounded-full bg-[#FF4500] py-2.5 text-sm font-medium text-white hover:bg-[#FF5722] disabled:opacity-40"
          >
            {loading ? 'Activating…' : 'Activate account'}
          </button>
        </form>
      </>,
      EARLY_ACCESS_COPY.completeInviteTitle,
      EARLY_ACCESS_COPY.completeInviteSubtitle,
      (
        <button
          type="button"
          onClick={() => void handleSignOut()}
          className="mt-6 block w-full text-center text-sm text-[#FF4500]/90 hover:text-[#FF5722]"
        >
          Sign out and use a different account
        </button>
      )
    )
  }

  if (!inviteGatePassed) {
    return formShell(
      <>
        <form onSubmit={handleInviteContinue} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-400" htmlFor="inviteCode">
              Invite code
            </label>
            <input
              id="inviteCode"
              type="text"
              required
              autoFocus
              value={inviteCode}
              onChange={(e) => {
                setInviteCode(e.target.value)
                setInviteValid(null)
                setInviteMessage(null)
              }}
              placeholder="Enter your early access code"
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-[#FF4500]/50 focus:outline-none focus:ring-1 focus:ring-[#FF4500]/30"
            />
            {inviteMessage && (
              <p className={`text-xs ${inviteValid ? 'text-emerald-400' : 'text-red-400'}`}>{inviteMessage}</p>
            )}
          </div>
          {error && (
            <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
          )}
          <button
            type="submit"
            disabled={validatingInvite || !inviteCode.trim()}
            className="w-full rounded-full bg-[#FF4500] py-2.5 text-sm font-medium text-white hover:bg-[#FF5722] disabled:opacity-40"
          >
            {validatingInvite ? 'Checking code…' : 'Continue'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-zinc-500">
          No code yet?{' '}
          <Link href="/signup/waitlist" className="font-medium text-[#FF4500]/90 hover:text-[#FF5722]">
            {EARLY_ACCESS_COPY.waitlistLink}
          </Link>
        </p>
      </>,
      EARLY_ACCESS_COPY.inviteGateTitle,
      EARLY_ACCESS_COPY.inviteGateSubtitle,
      (
        <p className="mt-6 text-center text-sm text-zinc-500">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-[#FF4500]/90 hover:text-[#FF5722]">
            Sign in
          </Link>
        </p>
      )
    )
  }

  return formShell(
    <>
      <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs text-zinc-500">Invite code</p>
          <p className="truncate text-sm text-emerald-400">{inviteCode}</p>
        </div>
        <button type="button" onClick={handleChangeInvite} className="shrink-0 text-xs text-[#FF4500]/90 hover:text-[#FF5722]">
          Change
        </button>
      </div>
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
      )}
      <button
        type="button"
        onClick={() => void handleGoogleSignUp()}
        disabled={loading || inviteValid !== true}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border border-white/[0.1] bg-white/[0.04] py-2.5 text-sm font-medium text-zinc-200 hover:bg-white/[0.07] disabled:opacity-60"
      >
        <GoogleIcon size={18} className="shrink-0" />
        <span>Sign up with Google</span>
      </button>
      <div className="relative my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/[0.08]" />
        <span className="text-xs text-zinc-600">or</span>
        <div className="h-px flex-1 bg-white/[0.08]" />
      </div>
      <form onSubmit={handleSignup} className="space-y-4">
        <input
          type="text"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Full name"
          className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-[#FF4500]/50 focus:outline-none focus:ring-1 focus:ring-[#FF4500]/30"
        />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-[#FF4500]/50 focus:outline-none focus:ring-1 focus:ring-[#FF4500]/30"
        />
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min. 8 characters"
          className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-[#FF4500]/50 focus:outline-none focus:ring-1 focus:ring-[#FF4500]/30"
        />
        <button
          type="submit"
          disabled={loading || inviteValid !== true}
          className="w-full rounded-full bg-[#FF4500] py-2.5 text-sm font-medium text-white hover:bg-[#FF5722] disabled:opacity-40"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </>,
    EARLY_ACCESS_COPY.inviteGateTitle,
    'Complete your account details below.',
    (
      <p className="mt-6 text-center text-sm text-zinc-500">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-[#FF4500]/90 hover:text-[#FF5722]">
          Sign in
        </Link>
      </p>
    )
  )
}

export function SignupClient() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#050505] p-6">
          <div className="h-32 w-full max-w-md animate-pulse rounded-2xl bg-white/[0.04]" />
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  )
}
