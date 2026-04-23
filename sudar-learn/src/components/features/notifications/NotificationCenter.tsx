'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { Bell, CheckCheck, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UserNotificationRow } from '@/types/notifications'
import { createClient } from '@/lib/supabase/client'
import { EnablePrimer } from '@/components/features/notifications/EnablePrimer'

interface ApiNotificationsPayload {
  items: UserNotificationRow[]
  unreadCount: number
}

function formatTimeAgo(iso: string): string {
  const t = new Date(iso).getTime()
  const diff = Date.now() - t
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function categoryBadge(category: string): string {
  switch (category) {
    case 'achievement':
      return 'Achievement'
    case 'course_assigned':
      return 'Course'
    case 'path_assigned':
      return 'Path'
    case 'mission_daily':
      return 'Mission'
    case 'mission_streak_risk':
      return 'Streak'
    case 'coin_drop':
      return 'Coins'
    case 'level_up':
      return 'Level'
    case 'checkin_today':
      return 'Check-in'
    case 'tutor_proactive':
      return 'Sudar'
    case 'compliance_overdue':
      return 'Compliance'
    case 'org_announcement':
      return 'Org'
    case 'creator_campaign':
      return 'Campaign'
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

interface NotificationCenterProps {
  variant?: 'default' | 'compact'
}

export function NotificationCenter({ variant = 'default' }: NotificationCenterProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<UserNotificationRow[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [gPressedAt, setGPressedAt] = useState<number | null>(null)

  const refresh = useCallback(async (soft?: boolean) => {
    if (!soft) setLoading(true)
    try {
      const res = await fetch('/api/notifications?limit=25')
      const json = (await res.json()) as { success?: boolean; data?: ApiNotificationsPayload }
      if (json.success && json.data) {
        setItems(json.data.items as UserNotificationRow[])
        setUnreadCount(json.data.unreadCount)
      }
    } finally {
      if (!soft) setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh(false)
  }, [refresh])

  useEffect(() => {
    const id = window.setInterval(() => {
      void refresh(true)
    }, 120000)
    return () => window.clearInterval(id)
  }, [refresh])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('notification-center')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_notifications' }, () => {
        void refresh(true)
      })
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [refresh])

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') void refresh(true)
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [refresh])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return
      }

      const key = event.key.toLowerCase()
      const now = Date.now()

      if (key === 'g' && !event.metaKey && !event.ctrlKey && !event.altKey) {
        setGPressedAt(now)
        return
      }

      if (
        key === 'n' &&
        gPressedAt &&
        now - gPressedAt < 1000 &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey
      ) {
        setOpen((v) => !v)
        setGPressedAt(null)
        event.preventDefault()
        return
      }

      if (gPressedAt && now - gPressedAt >= 1000) {
        setGPressedAt(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [gPressedAt])

  async function markRead(ids: string[]) {
    if (ids.length === 0) return
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark_read', ids }),
    })
    await refresh(true)
    router.refresh()
  }

  async function markAllRead() {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark_all_read' }),
    })
    await refresh(true)
    router.refresh()
  }

  async function onItemActivate(n: UserNotificationRow) {
    if (!n.read_at) {
      await markRead([n.id])
    }
    setOpen(false)
    if (n.link_url) {
      router.push(n.link_url)
    }
  }

  const compact = variant === 'compact'

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v)
          if (!open) void refresh(true)
        }}
        className={cn(
          'relative inline-flex items-center justify-center rounded-full border border-border bg-muted/80 text-card-foreground hover:bg-muted transition-colors',
          compact ? 'h-9 w-9' : 'h-10 w-10'
        )}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
      >
        {loading && items.length === 0 ? (
          <Loader2 className={cn('animate-spin text-muted-foreground', compact ? 'h-4 w-4' : 'h-5 w-5')} />
        ) : (
          <Bell className={cn(compact ? 'h-4 w-4' : 'h-5 w-5')} />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/5 dark:bg-black/20 backdrop-blur-[2px]" onClick={() => setOpen(false)} aria-hidden />
          <div
            className={cn(
              'absolute z-50 mt-2 max-h-[min(70vh,520px)] overflow-hidden rounded-2xl border border-border/80 bg-card/95 dark:bg-card/98 shadow-xl shadow-black/5 dark:shadow-black/20 flex flex-col',
              compact ? 'right-0 w-[min(100vw-2rem,380px)]' : 'right-0 w-[min(100vw-2rem,420px)]'
            )}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-semibold text-card-foreground">Notifications</p>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => void markAllRead()}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              )}
            </div>
            <div className="px-3 py-3 border-b border-border">
              <EnablePrimer />
            </div>

            <div className="overflow-y-auto flex-1">
              {items.length === 0 && !loading ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                  You&apos;re all caught up. Enrollments, quests, and achievements appear here.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {items.map((n) => {
                    const unread = !n.read_at
                    return (
                      <li key={n.id}>
                        <button
                          type="button"
                          onClick={() => void onItemActivate(n)}
                          className={cn(
                            'w-full text-left px-4 py-3 transition-colors hover:bg-muted/80',
                            unread && 'bg-primary/[0.06]'
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                              {categoryBadge(n.category)}
                            </span>
                            <span className="shrink-0 text-[11px] text-muted-foreground">
                              {formatTimeAgo(n.created_at)}
                            </span>
                          </div>
                          <p className="mt-1 text-sm font-medium text-card-foreground">{n.title}</p>
                          {n.body && <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.body}</p>}
                          {n.link_url && (
                            <span className="mt-2 inline-block text-xs font-medium text-primary">
                              {unread ? 'Open' : 'View again'} →
                            </span>
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            <div className="border-t border-border px-4 py-2.5 bg-muted/30">
              <Link
                href="/notifications"
                className="block text-center text-xs font-medium text-primary hover:underline"
                onClick={() => setOpen(false)}
              >
                View all notifications
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
