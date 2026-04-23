'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface ToastItem {
  id: string
  title: string
  linkUrl: string | null
}

export function NotificationToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('notification-toasts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_notifications' }, (payload) => {
        const row = payload.new as { id: string; title: string; link_url: string | null }
        setToasts((curr) => [{ id: row.id, title: row.title, linkUrl: row.link_url }, ...curr].slice(0, 3))
      })
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    if (toasts.length === 0) return
    const id = window.setTimeout(() => {
      setToasts((curr) => curr.slice(0, -1))
    }, 5000)
    return () => window.clearTimeout(id)
  }, [toasts])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-5 right-5 z-[100] space-y-2">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          onClick={() => {
            if (toast.linkUrl) router.push(toast.linkUrl)
            setToasts((curr) => curr.filter((t) => t.id !== toast.id))
          }}
          className="block w-[320px] rounded-xl border border-border bg-card px-4 py-3 text-left shadow-lg hover:bg-muted/30"
        >
          <p className="text-sm font-semibold text-card-foreground">Sudar update</p>
          <p className="text-xs text-muted-foreground mt-1">{toast.title}</p>
          {toast.linkUrl && <p className="text-xs text-primary mt-2">Open</p>}
        </button>
      ))}
    </div>
  )
}
