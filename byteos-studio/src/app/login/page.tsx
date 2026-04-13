import { Suspense } from 'react'
import { LoginClient } from './LoginClient'

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#050505] p-6">
          <div className="w-full max-w-md rounded-2xl border border-white/[0.06] bg-zinc-950/50 p-8">
            <div className="mb-3 h-6 w-40 animate-pulse rounded bg-white/[0.06]" />
            <div className="mb-8 h-4 w-56 animate-pulse rounded bg-white/[0.05]" />
            <div className="space-y-4">
              <div className="h-10 animate-pulse rounded-lg bg-white/[0.05]" />
              <div className="h-10 animate-pulse rounded-lg bg-white/[0.05]" />
              <div className="h-10 animate-pulse rounded-lg bg-white/[0.05]" />
            </div>
          </div>
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  )
}
