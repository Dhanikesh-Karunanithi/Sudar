'use client'

import { useCallback, useRef, useState } from 'react'
import Image from 'next/image'
import { ImagePlus, Link2, Loader2, Send, X } from 'lucide-react'
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_CATEGORY_LABELS,
  type FeedbackCategory,
  type FeedbackSurface,
} from '@shared-feedback/schemas'
import { cn } from '@/lib/utils'

type Props = {
  surface: FeedbackSurface
  pageRoute: string
  courseId?: string
  moduleId?: string
  onSubmitted: (thankYouMessage: string) => void
  onCancel: () => void
  className?: string
}

function parseUrlInput(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

export function EarlyAccessFeedbackPanel({
  surface,
  pageRoute,
  courseId,
  moduleId,
  onSubmitted,
  onCancel,
  className,
}: Props) {
  const [category, setCategory] = useState<FeedbackCategory>('bug')
  const [message, setMessage] = useState('')
  const [urlInput, setUrlInput] = useState('')
  const [attachments, setAttachments] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/feedback/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? 'Upload failed')
      }
      setAttachments((prev) => [...prev, data.url as string])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }, [])

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const file = item.getAsFile()
          if (file) void uploadFile(file)
          return
        }
      }
    },
    [uploadFile],
  )

  const submit = async () => {
    setSubmitting(true)
    setError(null)
    const urls = parseUrlInput(urlInput).filter((u) => {
      try {
        const parsed = new URL(u)
        return parsed.protocol === 'http:' || parsed.protocol === 'https:'
      } catch {
        return false
      }
    })

    try {
      const res = await fetch('/api/feedback/early-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          message,
          page_route: pageRoute,
          urls,
          attachment_urls: attachments,
          surface,
          context: {
            course_id: courseId,
            module_id: moduleId,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Submit failed')
      }
      onSubmitted(
        'Thank you for sharing feedback as an early tester. Your report helps us improve Sudar — we read every submission.',
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submit failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className={cn('rounded-xl border border-primary/25 bg-primary/5 p-3 space-y-3', className)}
      onPaste={handlePaste}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">Early access feedback</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Describe the issue, paste links, or attach screenshots (Ctrl+V).
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md p-1 text-muted-foreground hover:text-foreground"
          aria-label="Close feedback form"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <select
        value={category}
        onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        aria-label="Feedback category"
      >
        {FEEDBACK_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {FEEDBACK_CATEGORY_LABELS[c]}
          </option>
        ))}
      </select>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="What happened? What did you expect? Steps to reproduce help."
        className="w-full min-h-[100px] rounded-lg border border-border bg-background px-3 py-2 text-sm resize-y"
        aria-label="Feedback message"
      />

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          <Link2 className="h-3.5 w-3.5" aria-hidden />
          Related URLs (one per line)
        </label>
        <textarea
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="https://..."
          className="w-full min-h-[52px] rounded-lg border border-border bg-background px-3 py-2 text-xs resize-y"
        />
      </div>

      {attachments.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {attachments.map((url) => (
            <div key={url} className="relative h-16 w-16 rounded-md overflow-hidden border border-border">
              <Image src={url} alt="Feedback attachment" fill className="object-cover" unoptimized />
              <button
                type="button"
                className="absolute top-0 right-0 bg-black/60 text-white p-0.5"
                onClick={() => setAttachments((prev) => prev.filter((u) => u !== url))}
                aria-label="Remove attachment"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void uploadFile(file)
            e.target.value = ''
          }}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
          Add screenshot
        </button>
        <button
          type="button"
          disabled={submitting || message.trim().length < 10}
          onClick={() => void submit()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
        >
          {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          Submit feedback
        </button>
      </div>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}
