'use client'

import { forwardRef, useCallback, useRef, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { SudarInlineLoader } from '@/components/branding/SudarBrandLoader'
import { cn } from '@/lib/utils'
import { assistEditSelectedText, ASSIST_INSTRUCTION_OPTIONS } from '@/lib/assistEditClient'

export interface AssistTextareaWithAiToolbarProps {
  value: string
  /** Fires on every change (typing and after AI revision). */
  onTextChange: (next: string) => void
  /**
   * Optional: run after AI replaces a selection (e.g. flush parent state immediately).
   * If omitted, only `onTextChange` runs.
   */
  onAiRevisionApplied?: (next: string) => void
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void
  onContextMenu?: (e: React.MouseEvent<HTMLTextAreaElement>) => void
  disabled?: boolean
  rows?: number
  placeholder?: string
  textareaClassName?: string
  wrapClassName?: string
  /** Screen-reader label for the toolbar */
  toolbarLabel?: string
}

/**
 * Textarea with a toolbar that appears when text is selected, offering the same AI assist
 * actions as the right-click menu in the module editor.
 */
export const AssistTextareaWithAiToolbar = forwardRef<HTMLTextAreaElement, AssistTextareaWithAiToolbarProps>(
  function AssistTextareaWithAiToolbar(
    {
      value,
      onTextChange,
      onAiRevisionApplied,
      onBlur,
      onContextMenu,
      disabled,
      rows = 10,
      placeholder,
      textareaClassName,
      wrapClassName,
      toolbarLabel = 'AI assist for selected text',
    },
    ref
  ) {
    const innerRef = useRef<HTMLTextAreaElement | null>(null)
    const selectionRangeRef = useRef<{ start: number; end: number } | null>(null)
    const [assistLoading, setAssistLoading] = useState(false)
    const [showBar, setShowBar] = useState(false)

    const setRefs = useCallback(
      (el: HTMLTextAreaElement | null) => {
        innerRef.current = el
        if (typeof ref === 'function') ref(el)
        else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = el
      },
      [ref]
    )

    const syncSelection = useCallback(() => {
      const ta = innerRef.current
      if (!ta) return
      const start = ta.selectionStart
      const end = ta.selectionEnd
      selectionRangeRef.current = { start, end }
      const slice = value.slice(start, end)
      setShowBar(start !== end && slice.trim().length > 0)
    }, [value])

    const applyRevision = useCallback(
      (instruction: string) => {
        const range = selectionRangeRef.current
        if (!range || assistLoading || disabled) return
        const { start, end } = range
        const selected = value.slice(start, end)
        if (!selected.trim()) return
        setAssistLoading(true)
        void (async () => {
          try {
            const revised = await assistEditSelectedText(selected, instruction)
            const next = value.slice(0, start) + revised + value.slice(end)
            onTextChange(next)
            onAiRevisionApplied?.(next)
            selectionRangeRef.current = { start, end: start + revised.length }
            setShowBar(false)
            requestAnimationFrame(() => {
              const ta = innerRef.current
              if (!ta) return
              ta.focus()
              const s = start
              const e = start + revised.length
              ta.setSelectionRange(s, e)
            })
          } catch {
            // Match ModuleBlockEditor: no toast yet
          } finally {
            setAssistLoading(false)
          }
        })()
      },
      [value, onTextChange, onAiRevisionApplied, assistLoading, disabled]
    )

    return (
      <div className={cn('relative', wrapClassName)}>
        <textarea
          ref={setRefs}
          value={value}
          onChange={(e) => onTextChange(e.target.value)}
          onBlur={onBlur}
          onContextMenu={onContextMenu}
          onMouseUp={syncSelection}
          onKeyUp={syncSelection}
          onSelect={syncSelection}
          disabled={disabled}
          rows={rows}
          placeholder={placeholder}
          className={textareaClassName}
        />
        {showBar && !disabled ? (
          <div
            className="mt-1 flex flex-wrap items-center gap-1 rounded-lg border border-slate-600/80 bg-slate-800/95 px-2 py-1.5 shadow-lg shadow-black/30 backdrop-blur-sm"
            role="toolbar"
            aria-label={toolbarLabel}
            onMouseDown={(e) => e.preventDefault()}
          >
            <span className="flex items-center gap-1 pr-1 text-[10px] font-medium uppercase tracking-wider text-violet-400/90">
              {assistLoading ? (
                <SudarInlineLoader size="sm" className="text-violet-400" starFill="var(--background)" />
              ) : (
                <Sparkles className="h-3 w-3" aria-hidden />
              )}
              AI
            </span>
            {ASSIST_INSTRUCTION_OPTIONS.map(({ label, instruction }) => (
              <button
                key={instruction}
                type="button"
                disabled={assistLoading}
                onClick={() => applyRevision(instruction)}
                className="rounded-md border border-slate-600/60 bg-slate-900/80 px-2 py-1 text-[11px] font-medium text-slate-200 transition-colors hover:bg-slate-700/90 disabled:opacity-50"
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    )
  }
)
