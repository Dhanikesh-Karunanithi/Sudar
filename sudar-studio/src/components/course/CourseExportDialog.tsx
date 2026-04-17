'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { Download, Package, X } from 'lucide-react'
import { useState } from 'react'
import { SudarInlineLoader } from '@/components/branding/SudarBrandLoader'
import {
  COURSE_EXPORT_COMING_SOON,
  COURSE_EXPORT_DIALOG_TITLE,
  COURSE_EXPORT_DOWNLOADING,
  COURSE_EXPORT_IMS_CC_DESC,
  COURSE_EXPORT_IMS_CC_LABEL,
  COURSE_EXPORT_SCORM_12_DESC,
  COURSE_EXPORT_SCORM_12_LABEL,
  COURSE_EXPORT_SCORM_2004_DESC,
  COURSE_EXPORT_SCORM_2004_LABEL,
  COURSE_EXPORT_XAPI_DESC,
  COURSE_EXPORT_XAPI_LABEL,
} from '@/constants/courseExport'
import { cn } from '@/lib/utils'

type Props = {
  courseId: string
  disabled?: boolean
}

function parseFilenameFromContentDisposition(header: string | null): string | null {
  if (!header) return null
  const quoted = /filename="([^"]+)"/i.exec(header)
  if (quoted) return quoted[1]
  const star = /filename\*=UTF-8''([^;\s]+)/i.exec(header)
  if (star) return decodeURIComponent(star[1])
  const plain = /filename=([^;\s]+)/i.exec(header)
  return plain ? plain[1].replace(/^"|"$/g, '') : null
}

export function CourseExportDialog({ courseId, disabled }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function downloadScorm12() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/courses/${courseId}/export?format=scorm-1.2`)
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? 'Export failed')
      }
      const blob = await res.blob()
      const name =
        parseFilenameFromContentDisposition(res.headers.get('Content-Disposition')) ?? 'course-scorm12.zip'
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = name
      a.rel = 'noopener'
      a.click()
      URL.revokeObjectURL(url)
      setOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 text-sm text-card-foreground shadow-md',
            'transition-colors hover:bg-muted hover:border-border disabled:opacity-50'
          )}
          aria-label="Open export formats"
        >
          <Package className="h-4 w-4 shrink-0" aria-hidden />
          Export package
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        {/* No backdrop-blur: it softens the whole scene. Dim only. */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/75" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-[51] w-[min(100%,28rem)] max-h-[90vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 p-6',
            'rounded-[var(--radius-chat-panel)] border border-border bg-card text-card-foreground shadow-2xl',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-card'
          )}
        >
          <Dialog.Description className="sr-only">
            Choose an export format. SCORM 1.2 downloads a ZIP; other formats are not yet available.
          </Dialog.Description>
          <div className="flex items-start justify-between gap-3">
            <Dialog.Title className="font-display text-lg font-semibold text-card-foreground">
              {COURSE_EXPORT_DIALOG_TITLE}
            </Dialog.Title>
            <Dialog.Close
              className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-card/60 hover:text-card-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <p className="mt-1 text-xs text-muted-foreground">
            Download a standards-based package for use in another LMS.
          </p>

          {error ? (
            <p
              className="mt-3 rounded-2xl border border-destructive/35 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <ul className="mt-5 space-y-3">
            <li className="rounded-2xl border border-primary/30 bg-muted/50 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-card-foreground">{COURSE_EXPORT_SCORM_12_LABEL}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{COURSE_EXPORT_SCORM_12_DESC}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void downloadScorm12()}
                  disabled={loading || disabled}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-lg shadow-black/25 hover:bg-primary-hover disabled:opacity-50"
                >
                  {loading ? (
                    <SudarInlineLoader size="sm" className="text-primary-foreground" starFill="var(--card)" />
                  ) : (
                    <Download className="h-4 w-4" aria-hidden />
                  )}
                  {loading ? COURSE_EXPORT_DOWNLOADING : 'Download ZIP'}
                </button>
              </div>
            </li>

            <li className="rounded-2xl border border-border bg-muted/30 p-4">
              <p className="font-medium text-muted-foreground">{COURSE_EXPORT_IMS_CC_LABEL}</p>
              <p className="mt-1 text-xs text-muted-foreground/90">{COURSE_EXPORT_IMS_CC_DESC}</p>
              <p className="mt-2 text-xs font-medium text-muted-foreground">{COURSE_EXPORT_COMING_SOON}</p>
            </li>

            <li className="rounded-2xl border border-border bg-muted/30 p-4">
              <p className="font-medium text-muted-foreground">{COURSE_EXPORT_XAPI_LABEL}</p>
              <p className="mt-1 text-xs text-muted-foreground/90">{COURSE_EXPORT_XAPI_DESC}</p>
              <p className="mt-2 text-xs font-medium text-muted-foreground">{COURSE_EXPORT_COMING_SOON}</p>
            </li>

            <li className="rounded-2xl border border-border bg-muted/30 p-4">
              <p className="font-medium text-muted-foreground">{COURSE_EXPORT_SCORM_2004_LABEL}</p>
              <p className="mt-1 text-xs text-muted-foreground/90">{COURSE_EXPORT_SCORM_2004_DESC}</p>
              <p className="mt-2 text-xs font-medium text-muted-foreground">{COURSE_EXPORT_COMING_SOON}</p>
            </li>
          </ul>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
