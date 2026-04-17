'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Route } from 'lucide-react'
import { SudarInlineLoader } from '@/components/branding/SudarBrandLoader'

export function PathEnrollButton({ pathId }: { pathId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleEnroll() {
    setLoading(true); setError(null)
    const res = await fetch('/api/path-enrollments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path_id: pathId }),
    })
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Failed to enroll'); setLoading(false); return
    }
    router.refresh()
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-destructive text-xs">{error}</p>}
      <button onClick={handleEnroll} disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary hover:opacity-90 disabled:bg-muted text-primary-foreground disabled:text-muted-foreground text-sm font-semibold rounded-button transition-all">
        {loading ? <SudarInlineLoader size="sm" /> : <Route className="w-4 h-4" />}
        {loading ? 'Building your personalised path...' : 'Enrol in this path'}
      </button>
    </div>
  )
}
