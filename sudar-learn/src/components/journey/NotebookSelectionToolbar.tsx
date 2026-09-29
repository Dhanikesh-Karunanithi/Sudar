'use client'

import { useCallback, useEffect, useState, type RefObject } from 'react'
import { MessageSquarePlus } from 'lucide-react'
import { SudarLogoMark } from '@/components/branding/SudarLogo'

type SelectionPopup = { text: string; x: number; y: number }

const SELECTION_ACTIONS = [
  { label: 'Explain this' },
  { label: 'Give me an example' },
  { label: 'Simplify this' },
  { label: 'Summarise' },
] as const

function isInteractiveTarget(node: Node | null, root: HTMLElement): boolean {
  let el: Element | null =
    node?.nodeType === Node.ELEMENT_NODE ? (node as Element) : node?.parentElement ?? null
  while (el && el !== root) {
    const tag = el.tagName
    if (
      tag === 'TEXTAREA' ||
      tag === 'INPUT' ||
      tag === 'BUTTON' ||
      tag === 'SELECT' ||
      tag === 'A' ||
      el.getAttribute('contenteditable') === 'true' ||
      el.hasAttribute('data-notebook-no-select')
    ) {
      return true
    }
    el = el.parentElement
  }
  return false
}

export interface NotebookSelectionToolbarProps {
  containerRef: RefObject<HTMLElement | null>
  onAction: (action: string, selectedText: string) => void
  onCustomAsk: (selectedText: string) => void
}

export function NotebookSelectionToolbar({
  containerRef,
  onAction,
  onCustomAsk,
}: NotebookSelectionToolbarProps) {
  const [popup, setPopup] = useState<SelectionPopup | null>(null)

  const showPopup = useCallback(
    (clientX?: number, clientY?: number) => {
      const root = containerRef.current
      if (!root) {
        setPopup(null)
        return false
      }
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed || !selection.toString().trim()) {
        setPopup(null)
        return false
      }
      const text = selection.toString().trim()
      if (text.length < 5 || text.length > 500) {
        setPopup(null)
        return false
      }
      let range: Range
      try {
        range = selection.getRangeAt(0)
      } catch {
        setPopup(null)
        return false
      }
      if (!root.contains(range.commonAncestorContainer)) {
        setPopup(null)
        return false
      }
      if (isInteractiveTarget(range.commonAncestorContainer, root)) {
        setPopup(null)
        return false
      }

      const rect = range.getBoundingClientRect()
      const estimatedHalfWidth = 200
      let x: number
      let y: number
      if (clientX !== undefined && clientY !== undefined) {
        x = Math.max(
          estimatedHalfWidth + 8,
          Math.min(window.innerWidth - estimatedHalfWidth - 8, clientX),
        )
        y = clientY - 8
      } else {
        const centerX = rect.left + rect.width / 2
        x = Math.max(
          estimatedHalfWidth + 8,
          Math.min(window.innerWidth - estimatedHalfWidth - 8, centerX),
        )
        y = rect.top - 8
      }
      setPopup({ text, x, y })
      return true
    },
    [containerRef],
  )

  useEffect(() => {
    const onMouseUp = () => {
      window.setTimeout(() => showPopup(), 0)
    }
    const onTouchEnd = () => {
      window.setTimeout(() => showPopup(), 0)
    }
    const onContextMenu = (e: MouseEvent) => {
      const root = containerRef.current
      if (!root) return
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed || !selection.toString().trim()) return
      try {
        const range = selection.getRangeAt(0)
        if (!root.contains(range.commonAncestorContainer)) return
        if (isInteractiveTarget(range.commonAncestorContainer, root)) return
      } catch {
        return
      }
      e.preventDefault()
      showPopup(e.clientX, e.clientY)
    }
    const onScroll = () => setPopup(null)
    document.addEventListener('mouseup', onMouseUp)
    document.addEventListener('touchend', onTouchEnd)
    document.addEventListener('contextmenu', onContextMenu)
    const root = containerRef.current
    root?.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      document.removeEventListener('mouseup', onMouseUp)
      document.removeEventListener('touchend', onTouchEnd)
      document.removeEventListener('contextmenu', onContextMenu)
      root?.removeEventListener('scroll', onScroll)
    }
  }, [containerRef, showPopup])

  if (!popup) return null

  const flipBelow = popup.y < 120
  return (
    <div
      className="fixed z-[9999] overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
      style={{
        left: popup.x,
        top: popup.y,
        transform: flipBelow ? 'translate(-50%, 8px)' : 'translate(-50%, -100%)',
        minWidth: '260px',
        maxWidth: '420px',
      }}
      onMouseDown={(e) => e.preventDefault()}
      role="dialog"
      aria-label="Ask Sudar about selection"
    >
      <div className="flex items-start gap-2 border-b border-border/60 px-3 pb-1.5 pt-2.5">
        <SudarLogoMark
          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary opacity-70"
          starFill="var(--card)"
        />
        <p className="line-clamp-2 text-[10px] italic leading-relaxed text-muted-foreground">
          &ldquo;{popup.text.slice(0, 120)}
          {popup.text.length > 120 ? '…' : ''}&rdquo;
        </p>
      </div>
      <div className="flex flex-wrap gap-0.5 p-1">
        {SELECTION_ACTIONS.map(({ label }) => (
          <button
            key={label}
            type="button"
            onClick={() => {
              onAction(label, popup.text)
              setPopup(null)
            }}
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-card-foreground transition-colors hover:bg-muted"
          >
            {label}
          </button>
        ))}
        <div className="my-0.5 h-px w-full bg-border/60" />
        <button
          type="button"
          onClick={() => {
            onCustomAsk(popup.text)
            setPopup(null)
          }}
          className="flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
        >
          <MessageSquarePlus className="h-3.5 w-3.5" aria-hidden />
          Ask Sudar a custom question about this
        </button>
      </div>
    </div>
  )
}
