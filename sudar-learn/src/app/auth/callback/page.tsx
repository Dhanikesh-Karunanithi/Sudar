'use client'

import { AUTH_INTENT_PARAM } from '@shared-access/authIntent'
import { createClient } from '@/lib/supabase/client'
import { SudarLogoMark } from '@/components/branding/SudarLogo'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect } from 'react'

function AuthCallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    async function completeAuth() {
      const oauthError = searchParams?.get('error')
      if (oauthError) {
        router.replace('/login?error=auth_callback_failed')
        return
      }

      const code = searchParams?.get('code')
      if (!code) {
        router.replace('/login?error=auth_callback_failed')
        return
      }

      const supabase = createClient()
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      if (exchangeError) {
        router.replace('/login?error=auth_callback_failed')
        return
      }

      const params = new URLSearchParams()
      const intent = searchParams?.get(AUTH_INTENT_PARAM)
      const next = searchParams?.get('next')
      if (intent) params.set(AUTH_INTENT_PARAM, intent)
      if (next) params.set('next', next)

      const query = params.toString()
      router.replace(query ? `/api/auth/complete?${query}` : '/api/auth/complete')
    }

    void completeAuth()
  }, [router, searchParams])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#050505] p-6">
      <SudarLogoMark className="mb-6 h-10 w-10 text-white" starFill="#050505" animated />
      <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#FF4500]/30 border-t-[#FF4500]" />
      <p className="text-sm text-zinc-500">Completing sign-in…</p>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#050505]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FF4500]/30 border-t-[#FF4500]" />
        </div>
      }
    >
      <AuthCallbackHandler />
    </Suspense>
  )
}
