import { Suspense } from 'react'
import { LoginClient } from './LoginClient'

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-slate-900/60 rounded-2xl border border-slate-800 p-8">
            <div className="h-6 w-40 bg-slate-800 rounded animate-pulse mb-3" />
            <div className="h-4 w-56 bg-slate-800 rounded animate-pulse mb-8" />
            <div className="space-y-4">
              <div className="h-10 bg-slate-800 rounded animate-pulse" />
              <div className="h-10 bg-slate-800 rounded animate-pulse" />
              <div className="h-10 bg-slate-800 rounded animate-pulse" />
            </div>
          </div>
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  )
}
