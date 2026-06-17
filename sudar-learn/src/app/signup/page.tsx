import { Suspense } from 'react'
import { PendingInviteHandler } from '@/components/auth/PendingInviteHandler'
import { SignupClient } from './SignupClient'

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#050505] p-6">
          <div className="w-full max-w-md rounded-2xl border border-white/[0.06] bg-zinc-950/50 p-8">
            <div className="h-6 w-48 animate-pulse rounded bg-white/[0.06]" />
            <div className="mt-3 h-4 w-72 animate-pulse rounded bg-white/[0.05]" />
            <div className="mt-6 h-10 w-full animate-pulse rounded-lg bg-white/[0.05]" />
            <div className="mt-3 h-10 w-full animate-pulse rounded-lg bg-white/[0.05]" />
            <div className="mt-3 h-10 w-full animate-pulse rounded-lg bg-white/[0.05]" />
          </div>
        </div>
      }
    >
      <PendingInviteHandler />
      <SignupClient />
    </Suspense>
  )
}
