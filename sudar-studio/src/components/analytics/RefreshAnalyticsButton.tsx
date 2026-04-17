'use client'

import { useState } from 'react'
import { RotateCw } from 'lucide-react'

export function RefreshAnalyticsButton() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onRefresh() {
    setLoading(true)
    setMessage(null)
    setError(null)
    try {
      const res = await fetch('/api/analytics/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = (await res.json().catch(() => ({}))) as { success?: boolean; refreshed_for?: string; error?: string }
      if (!res.ok || !data.success) {
        setError(data.error ?? 'Failed to refresh analytics')
        return
      }
      setMessage(`Refreshed for ${data.refreshed_for ?? 'today'}`)
    } catch {
      setError('Failed to refresh analytics')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        className="text-xs px-3 py-2 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
      >
        <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Refreshing…' : 'Refresh now'}
      </button>
      {message && <span className="text-xs text-green-400">{message}</span>}
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  )
}
