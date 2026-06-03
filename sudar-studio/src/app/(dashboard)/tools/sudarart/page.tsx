import { Ban, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function SudarArtPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-neutral-950 text-neutral-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-900/70 p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15 text-amber-300">
          <Ban className="h-7 w-7" aria-hidden />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">SudarArt is temporarily disabled</h1>
        <p className="mt-3 text-sm text-neutral-300 leading-relaxed">
          This feature has been turned off for now while we reassess quality. We will revisit and relaunch SudarArt in
          a future update.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
          >
            Back to Dashboard
          </Link>
          <span className="inline-flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-neutral-300">
            <Sparkles className="h-4 w-4 text-indigo-300" aria-hidden />
            Revisit planned
          </span>
        </div>
      </div>
    </div>
  )
}
