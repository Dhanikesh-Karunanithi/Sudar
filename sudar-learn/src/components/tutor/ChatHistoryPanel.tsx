'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  History,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DEFAULT_THREAD_TITLE,
  threadDateGroupLabel,
  type TutorThread,
} from '@/lib/cache/localTutorCache'

export interface ChatHistoryPanelProps {
  open: boolean
  onClose: () => void
  threads: TutorThread[]
  activeThreadId: string | null
  onSelect: (threadId: string) => void
  onNewChat: () => void
  onRename: (threadId: string, title: string) => void
  onDelete: (threadId: string) => void
  onTogglePin: (threadId: string, pinned: boolean) => void
  className?: string
}

function formatRelativeTime(iso: string): string {
  try {
    const d = new Date(iso)
    const diff = Date.now() - d.getTime()
    const mins = Math.floor(diff / 60_000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

export function ChatHistoryPanel({
  open,
  onClose,
  threads,
  activeThreadId,
  onSelect,
  onNewChat,
  onRename,
  onDelete,
  onTogglePin,
  className,
}: ChatHistoryPanelProps) {
  const [query, setQuery] = useState('')
  const [menuId, setMenuId] = useState<string | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  useEffect(() => {
    if (!open) {
      setQuery('')
      setMenuId(null)
      setRenamingId(null)
    }
  }, [open])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return threads
    return threads.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.preview.toLowerCase().includes(q) ||
        t.messages.some((m) => m.content.toLowerCase().includes(q)),
    )
  }, [threads, query])

  const groups = useMemo(() => {
    const map = new Map<string, TutorThread[]>()
    for (const t of filtered) {
      const label = t.pinned ? 'Pinned' : threadDateGroupLabel(t.updatedAt)
      const list = map.get(label) ?? []
      list.push(t)
      map.set(label, list)
    }
    const order = ['Pinned', 'Today', 'Yesterday', 'Previous 7 days', 'Previous 30 days', 'Older']
    return order
      .filter((label) => map.has(label))
      .map((label) => ({ label, items: map.get(label) ?? [] }))
  }, [filtered])

  if (!open) return null

  return (
    <div
      className={cn(
        'absolute inset-0 z-30 flex flex-col bg-card',
        className,
      )}
      role="dialog"
      aria-label="Chat history"
    >
      <header className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-3">
        <History className="h-4 w-4 text-primary" aria-hidden />
        <h2 className="flex-1 text-sm font-semibold text-card-foreground">Chats</h2>
        <button
          type="button"
          onClick={() => {
            onNewChat()
            onClose()
          }}
          className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-card-foreground hover:bg-muted"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          New chat
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-card-foreground"
          aria-label="Close chat history"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="shrink-0 border-b border-border px-3 py-2">
        <label className="relative block">
          <span className="sr-only">Search chats</span>
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats…"
            className="w-full rounded-lg border border-border bg-background py-2 pl-8 pr-3 text-sm text-card-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center text-sm text-muted-foreground">
            <History className="h-8 w-8 text-primary/40" aria-hidden />
            <p className="font-medium text-card-foreground">
              {query.trim() ? 'No matching chats' : 'No chats yet'}
            </p>
            <p className="text-xs">
              {query.trim()
                ? 'Try a different search term.'
                : 'Start a conversation — it will show up here with a title.'}
            </p>
            {!query.trim() && (
              <button
                type="button"
                onClick={() => {
                  onNewChat()
                  onClose()
                }}
                className="mt-2 inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
                New chat
              </button>
            )}
          </div>
        ) : (
          groups.map((group) => (
            <section key={group.label} className="mb-3">
              <h3 className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {group.label}
              </h3>
              <ul className="space-y-0.5">
                {group.items.map((thread) => {
                  const active = thread.id === activeThreadId
                  const isRenaming = renamingId === thread.id
                  return (
                    <li key={thread.id} className="relative">
                      <div
                        className={cn(
                          'group flex items-start gap-1 rounded-lg px-2 py-2 transition-colors',
                          active ? 'bg-primary/10' : 'hover:bg-muted/70',
                        )}
                      >
                        {isRenaming ? (
                          <form
                            className="min-w-0 flex-1"
                            onSubmit={(e) => {
                              e.preventDefault()
                              onRename(thread.id, renameValue)
                              setRenamingId(null)
                            }}
                          >
                            <input
                              autoFocus
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onBlur={() => {
                                onRename(thread.id, renameValue)
                                setRenamingId(null)
                              }}
                              className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm text-card-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                              aria-label="Rename chat"
                            />
                          </form>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              onSelect(thread.id)
                              onClose()
                            }}
                            className="min-w-0 flex-1 text-left"
                          >
                            <p
                              className={cn(
                                'truncate text-sm font-medium',
                                active ? 'text-primary' : 'text-card-foreground',
                              )}
                            >
                              {thread.title || DEFAULT_THREAD_TITLE}
                            </p>
                            {thread.preview ? (
                              <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
                                {thread.preview}
                              </p>
                            ) : null}
                            <p className="mt-0.5 text-[10px] text-muted-foreground">
                              {formatRelativeTime(thread.updatedAt)}
                              {thread.messageCount > 0
                                ? ` · ${thread.messageCount} message${thread.messageCount === 1 ? '' : 's'}`
                                : ''}
                            </p>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setMenuId((id) => (id === thread.id ? null : thread.id))
                          }
                          className="shrink-0 rounded-md p-1 text-muted-foreground opacity-70 hover:bg-muted hover:text-card-foreground group-hover:opacity-100"
                          aria-label={`Actions for ${thread.title}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                      {menuId === thread.id && (
                        <div className="absolute right-2 top-10 z-10 min-w-[10rem] overflow-hidden rounded-lg border border-border bg-card shadow-lg">
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-muted"
                            onClick={() => {
                              setRenameValue(thread.title)
                              setRenamingId(thread.id)
                              setMenuId(null)
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden />
                            Rename
                          </button>
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-muted"
                            onClick={() => {
                              onTogglePin(thread.id, !thread.pinned)
                              setMenuId(null)
                            }}
                          >
                            {thread.pinned ? (
                              <PinOff className="h-3.5 w-3.5" aria-hidden />
                            ) : (
                              <Pin className="h-3.5 w-3.5" aria-hidden />
                            )}
                            {thread.pinned ? 'Unpin' : 'Pin'}
                          </button>
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                            onClick={() => {
                              if (
                                typeof window !== 'undefined' &&
                                window.confirm(`Delete “${thread.title}”? This cannot be undone.`)
                              ) {
                                onDelete(thread.id)
                              }
                              setMenuId(null)
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden />
                            Delete
                          </button>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  )
}
