'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { CheckCheck, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UserNotificationRow } from '@/types/notifications'

interface ApiNotificationsPayload {
  items: UserNotificationRow[]
  unreadCount: number
}

function formatTimeAgo(iso: string): string {
  const t = new Date(iso).getTime()
  const diff = Date.now() - t
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} minutes ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hours ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days} days ago`
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function categoryBadge(category: string): string {
  switch (category) {
    case 'achievement':
      return 'Achievement'
    case 'quest':
      return 'Quest'
    case 'level':
      return 'Level'
    case 'course':
      return 'Course'
    case 'path':
      return 'Path'
    case 'streak':
      return 'Streak'
    case 'checkin':
      return 'Check-in'
    default:
      return 'Sudar'
  }
}

export function NotificationsClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<UserNotificationRow[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications?limit=100')
      const json = (await res.json()) as { success?: boolean; data?: ApiNotificationsPayload }
      if (json.success && json.data) {
        setItems(json.data.items as UserNotificationRow[])
        setUnreadCount(json.data.unreadCount)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function markAllRead() {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark_all_read' }),
    })
    const now = new Date().toISOString()
    setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? now })))
    setUnreadCount(0)
    router.refresh()
  }

  async function onRowClick(n: UserNotificationRow) {
    if (!n.read_at) {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_read', ids: [n.id] }),
      })
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)))
      setUnreadCount((c) => Math.max(0, c - 1))
    }
    if (n.link_url) {
      router.push(n.link_url)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        </p>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => void markAllRead()}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-muted px-4 py-2 text-sm font-medium text-card-foreground hover:bg-background transition-colors"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
        </div>
      ) : items.length === 0 ? (
        <p className="px-4 py-16 text-center text-sm text-muted-foreground">
          No notifications yet. Complete lessons, quests, and enrollments to see updates here.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((n) => {
            const unread = !n.read_at
            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => void onRowClick(n)}
                  className={cn(
                    'w-full text-left px-4 py-4 transition-colors hover:bg-muted/50',
                    unread && 'bg-primary/[0.04]'
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                      {categoryBadge(n.category)}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatTimeAgo(n.created_at)}</span>
                  </div>
                  <p className="mt-1 text-base font-medium text-card-foreground">{n.title}</p>
                  {n.body && <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>}
                  {n.link_url && (
                    <span className="mt-2 inline-block text-sm font-medium text-primary">Open linked page →</span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
