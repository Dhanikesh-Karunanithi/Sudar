import { Suspense } from 'react'
import { LoginClient } from './LoginClient'

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="h-6 w-40 bg-slate-100 rounded animate-pulse" />
            <div className="h-4 w-64 bg-slate-100 rounded mt-3 animate-pulse" />
            <div className="h-10 w-full bg-slate-100 rounded mt-6 animate-pulse" />
            <div className="h-10 w-full bg-slate-100 rounded mt-3 animate-pulse" />
          </div>
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  )
}
