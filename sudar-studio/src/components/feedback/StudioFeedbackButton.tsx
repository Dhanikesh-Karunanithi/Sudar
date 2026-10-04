'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { CheckCircle2, MessageSquareWarning } from 'lucide-react'
import { EarlyAccessFeedbackPanel } from '@/components/feedback/EarlyAccessFeedbackPanel'
import { STUDIO_FEEDBACK_COPY } from '@/constants/earlyAccess'

const THANK_YOU_VISIBLE_MS = 4000

export function StudioFeedbackButton() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [thankYou, setThankYou] = useState<string | null>(null)

  useEffect(() => {
    if (!thankYou) return
    const t = window.setTimeout(() => setThankYou(null), THANK_YOU_VISIBLE_MS)
    return () => window.clearTimeout(t)
  }, [thankYou])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={STUDIO_FEEDBACK_COPY.buttonAria}
        aria-expanded={open}
        className="fixed bottom-7 right-24 z-50 inline-flex items-center gap-1.5 rounded-full border border-border bg-card/90 px-3 py-2 text-xs font-medium text-foreground shadow-lg backdrop-blur hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <MessageSquareWarning className="h-4 w-4" aria-hidden />
        {STUDIO_FEEDBACK_COPY.button}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={STUDIO_FEEDBACK_COPY.buttonAria}
          className="fixed bottom-20 right-6 z-[61] w-[min(380px,calc(100vw-2rem))] rounded-xl bg-card shadow-2xl"
        >
          <EarlyAccessFeedbackPanel
            surface="studio"
            pageRoute={pathname ?? '/'}
            onSubmitted={(msg) => {
              setOpen(false)
              setThankYou(msg)
            }}
            onCancel={() => setOpen(false)}
          />
        </div>
      ) : null}

      {thankYou ? (
        <div
          role="status"
          className="fixed bottom-20 right-6 z-[61] flex max-w-sm items-start gap-2 rounded-xl border border-emerald-500/30 bg-card p-3 text-xs text-foreground shadow-xl"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
          <span>{thankYou}</span>
        </div>
      ) : null}
    </>
  )
}
