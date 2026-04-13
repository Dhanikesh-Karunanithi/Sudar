'use client'

import { useCallback, useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { AssistTextareaWithAiToolbar } from '@/components/content/AssistTextareaWithAiToolbar'
import type { ScormContent } from '@/types/content'
import { isScormContent } from '@/types/content'
import { cn } from '@/lib/utils'

interface ScormExtractedTextEditorProps {
  courseId: string
  moduleId: string
  content: ScormContent
  onSaved: (next: ScormContent) => void
  className?: string
}

/**
 * Editable plain-text extracted from SCORM HTML at import time. This does not change the packaged
 * interactive lesson in the iframe; it updates Sudar Search and AI tutor context for this module.
 */
export function ScormExtractedTextEditor({
  courseId,
  moduleId,
  content,
  onSaved,
  className,
}: ScormExtractedTextEditorProps) {
  const [draft, setDraft] = useState(content.scorm_text_content ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setDraft(content.scorm_text_content ?? '')
  }, [content.scorm_text_content, moduleId])

  const save = useCallback(async () => {
    if (!isScormContent(content)) return
    setSaving(true)
    setError(null)
    const next: ScormContent = { ...content, scorm_text_content: draft }
    try {
      const res = await fetch(`/api/courses/${courseId}/modules/${moduleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: next }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Save failed')
      onSaved(next)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }, [courseId, moduleId, content, draft, onSaved])

  return (
    <section
      className={cn(
        'mt-8 rounded-xl border border-border bg-card/40 p-4 shadow-sm',
        className
      )}
      aria-label="Extracted text for AI and search"
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Extracted lesson text</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            The SCORM player above shows the packaged lesson as imported. Edit this copy to tune what the AI tutor
            and in-app search use for this module. It does not change the interactive package in storage.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || draft === (content.scorm_text_content ?? '')}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-primary/35 bg-primary/15 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/25 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" aria-hidden />
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
      <AssistTextareaWithAiToolbar
        value={draft}
        onTextChange={setDraft}
        rows={14}
        toolbarLabel="AI assist for extracted SCORM text"
        textareaClassName="w-full rounded-lg border border-slate-700 bg-slate-900/80 p-3 font-mono text-sm leading-relaxed text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-y min-h-[200px]"
        wrapClassName="w-full"
      />
      {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}
    </section>
  )
}
