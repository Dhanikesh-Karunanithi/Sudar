'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname, useParams } from 'next/navigation'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Send, ExternalLink, Download, Maximize2, Minimize2 } from 'lucide-react'
import { SudarInlineLoader } from '@/components/branding/SudarBrandLoader'
import { cn } from '@/lib/utils'
import { SudarLogoMark } from '@/components/branding/SudarLogo'
import { SudarChatLaunchButton } from '@/components/agent/SudarChatLaunchButton'
import { EarlyAccessFeedbackPanel } from '@/components/feedback/EarlyAccessFeedbackPanel'

interface Message {
  role: 'user' | 'assistant'
  content: string
  actions?: Array<{ type: string; label: string; href: string }>
  blocks?: Array<{ id: string; type: string; payload: Record<string, unknown> }>
}

interface StudioAuthoringContext {
  courseId: string | null
  activeModuleId: string | null
  activeKey: string | null
}

function buildDiffRows(beforeText: string, afterText: string): Array<{ kind: 'same' | 'add' | 'remove'; text: string }> {
  const before = beforeText.split('\n')
  const after = afterText.split('\n')
  const rows: Array<{ kind: 'same' | 'add' | 'remove'; text: string }> = []
  let i = 0
  let j = 0
  while (i < before.length || j < after.length) {
    const b = before[i]
    const a = after[j]
    if (b === a) {
      rows.push({ kind: 'same', text: b ?? '' })
      i += 1
      j += 1
      continue
    }
    if (a !== undefined && !before.slice(i, i + 4).includes(a)) {
      rows.push({ kind: 'add', text: a })
      j += 1
      continue
    }
    if (b !== undefined) {
      rows.push({ kind: 'remove', text: b })
      i += 1
      continue
    }
  }
  return rows
}

const QUICK_PROMPTS = [
  'Add a user',
  'Assign a course to someone',
  'Show analytics summary',
  'Export users CSV',
  'How do I embed Sudar?',
  'What are our org KPIs?',
  'Share early access feedback',
]

export function SudarStudioChat({ orgRole }: { orgRole: 'ADMIN' | 'MANAGER' | 'CREATOR' | 'LEARNER' }) {
  const pathname = usePathname()
  const params = useParams()
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [feedbackMode, setFeedbackMode] = useState(false)
  const [autoApply, setAutoApply] = useState(false)
  const [authoringContext, setAuthoringContext] = useState<StudioAuthoringContext>({
    courseId: null,
    activeModuleId: null,
    activeKey: null,
  })
  const listRef = useRef<HTMLDivElement>(null)

  const route = pathname ?? ''
  const focusUserId = route.startsWith('/users/') && params?.id && typeof params.id === 'string' ? params.id : undefined

  useEffect(() => {
    if (isOpen && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [isOpen, messages])

  useEffect(() => {
    function onAuthoringContext(event: Event) {
      const detail = (event as CustomEvent<StudioAuthoringContext>).detail
      if (!detail) return
      setAuthoringContext({
        courseId: detail.courseId ?? null,
        activeModuleId: detail.activeModuleId ?? null,
        activeKey: detail.activeKey ?? null,
      })
    }
    window.addEventListener('studio-authoring-context', onAuthoringContext as EventListener)
    return () => window.removeEventListener('studio-authoring-context', onAuthoringContext as EventListener)
  }, [])

  async function applyModuleContent(
    courseId: string,
    moduleId: string,
    content: string,
    mode: 'replace' | 'append' = 'replace',
    source: 'studio_chat_apply' | 'studio_chat_auto_apply' = 'studio_chat_apply'
  ) {
    const courseRes = await fetch(`/api/courses/${courseId}`)
    const courseData = (await courseRes.json().catch(() => ({}))) as { modules?: Array<{ id: string; content?: { body?: string } }> }
    const moduleData = courseData.modules?.find((m) => m.id === moduleId)
    const currentBody =
      mode === 'append' && typeof moduleData?.content?.body === 'string'
        ? `${moduleData.content.body}\n\n${content}`.trim()
        : content
    const nextContent = { type: 'text', body: currentBody }
    await fetch(`/api/courses/${courseId}/modules/${moduleId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: nextContent, source }),
    })
  }

  async function handleSendWithMessage(msg: string) {
    const trimmed = msg.trim()
    if (!trimmed || thinking) return

    if (/share feedback|early access feedback|report a bug|beta feedback|tester feedback/i.test(trimmed)) {
      setFeedbackMode(true)
      setInput('')
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: trimmed },
        {
          role: 'assistant',
          content:
            'Thanks for helping us improve Sudar. Use the form below to describe what you found — screenshots and URLs are welcome.',
        },
      ])
      return
    }

    setInput('')
    const newMessages: Message[] = [...messages, { role: 'user', content: trimmed }]
    setMessages(newMessages)
    setThinking(true)

    try {
      const res = await fetch('/api/agent/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          conversation_history: newMessages.slice(0, -1),
          route,
          authoring_context: authoringContext,
          ...(focusUserId ? { focus_user_id: focusUserId } : {}),
        }),
      })
      const text = await res.text()
      let data: { response?: string; error?: string; actions?: Array<{ type: string; label: string; href: string }>; blocks?: Array<{ id: string; type: string; payload: Record<string, unknown> }> } = {}
      if (text) {
        try {
          data = JSON.parse(text)
        } catch {
          data = { error: 'Invalid response' }
        }
      }
      if (!res.ok) {
        setMessages([
          ...newMessages,
          { role: 'assistant', content: data.error ?? 'Something went wrong. Please try again.' },
        ])
        return
      }
      const assistantMsg: Message = {
        role: 'assistant',
        content: data.response ?? 'Sorry, I had trouble answering that.',
        actions: data.actions?.length ? data.actions : undefined,
        blocks: data.blocks,
      }
      setMessages([
        ...newMessages,
        assistantMsg,
      ])
      if (autoApply && assistantMsg.blocks?.length) {
        for (const block of assistantMsg.blocks) {
          if (block.type === 'module_apply') {
            const payload = block.payload as { courseId?: string; moduleId?: string; content?: string; mode?: 'replace' | 'append' }
            if (payload.courseId && payload.moduleId && payload.content) {
              await applyModuleContent(payload.courseId, payload.moduleId, payload.content, payload.mode ?? 'replace', 'studio_chat_auto_apply')
            }
          }
        }
      }
    } catch {
      setMessages([
        ...newMessages,
        { role: 'assistant', content: 'Unable to reach Sudar. Please check your connection and try again.' },
      ])
    } finally {
      setThinking(false)
    }
  }

  function handleSend() {
    const msg = input.trim()
    if (!msg || thinking) return
    handleSendWithMessage(msg)
  }

  function handleDownload(base64: string, filename: string, mimeType: string) {
    try {
      const bin = atob(base64)
      const bytes = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
      const blob = new Blob([bytes], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // ignore
    }
  }

  if (orgRole === 'LEARNER') return null

  return (
    <>
      <SudarChatLaunchButton
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close Sudar' : 'Open Sudar'}
      />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'fixed z-[60] liquid-glass flex flex-col overflow-hidden rounded-[var(--radius-chat-panel)] shadow-2xl transition-all duration-200',
              isExpanded
                ? 'top-4 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[calc(100vw-3rem)] max-w-[720px] h-[calc(100vh-6rem)]'
                : 'bottom-24 right-6 w-[calc(100vw-3rem)] max-w-[420px] h-[520px]'
            )}
          >
            <div className="p-5 border-b border-border flex items-center justify-between gap-2 shrink-0 bg-card/80">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted/40">
                  <SudarLogoMark className="h-[1.65rem] w-auto text-primary" starFill="var(--card)" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-display text-lg font-bold text-card-foreground">Sudar</h3>
                  <p className="mt-0.5 text-muted-foreground text-xs font-semibold uppercase tracking-widest">
                    Studio assistant
                  </p>
                  {authoringContext.activeModuleId && (
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      Editing module: {authoringContext.activeModuleId.slice(0, 8)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center shrink-0">
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 text-muted-foreground hover:text-card-foreground transition-colors rounded-lg"
                  aria-label={isExpanded ? 'Collapse chat' : 'Expand chat'}
                  title={isExpanded ? 'Collapse chat' : 'Expand chat'}
                >
                  {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-muted-foreground hover:text-card-foreground transition-colors rounded-lg"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div ref={listRef} className="flex-1 overflow-y-auto p-5 space-y-4">
              <label className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={autoApply}
                  onChange={(e) => setAutoApply(e.target.checked)}
                  className="rounded border-border bg-card"
                />
                Auto-apply chat drafts to module
              </label>
              {messages.length === 0 && (
                <>
                  <div className="chat-bubble bg-muted/80 text-card-foreground border border-border">
                    Hi! I&apos;m Sudar. I can help with users, courses, paths, analytics, integrations, and anything in Sudar Studio. Ask me anything.
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Try</p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_PROMPTS.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => handleSendWithMessage(q)}
                        className="rounded-pill bg-card/80 border border-border px-4 py-2 text-sm text-card-foreground hover:bg-primary/10 hover:border-primary/30 transition-colors text-left"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </>
              )}
              {messages.map((m, i) => (
                <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div className="flex flex-col gap-2 max-w-[85%]">
                    <div
                      className={cn(
                        'chat-bubble',
                        m.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/80 text-card-foreground border border-border'
                      )}
                    >
                      <div className="whitespace-pre-wrap break-words">{m.content}</div>
                    </div>
                    {m.blocks?.map((block) => {
                      if (block.type === 'action_group' && block.payload.actions) {
                        const actions = block.payload.actions as Array<{ type: string; label: string; href: string }>
                        return (
                          <div key={block.id} className="flex flex-wrap gap-2">
                            {actions.map((a, j) => (
                              <Link
                                key={j}
                                href={a.href}
                                className="inline-flex items-center gap-1.5 rounded-pill bg-primary/90 px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary"
                              >
                                {a.label}
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                            ))}
                          </div>
                        )
                      }
                      if (block.type === 'download' && block.payload.contentBase64 && block.payload.filename) {
                        const filename = block.payload.filename as string
                        const mimeType = (block.payload.mimeType as string) ?? 'application/octet-stream'
                        const contentBase64 = block.payload.contentBase64 as string
                        return (
                          <button
                            key={block.id}
                            type="button"
                            onClick={() => handleDownload(contentBase64, filename, mimeType)}
                            className="inline-flex items-center gap-2 rounded-button border border-border bg-muted px-3 py-2 text-xs font-medium text-card-foreground hover:bg-muted/80"
                          >
                            <Download className="w-4 h-4" />
                            Download {filename}
                          </button>
                        )
                      }
                      if (block.type === 'module_apply' && block.payload.content && block.payload.moduleId && block.payload.courseId) {
                        const payload = block.payload as {
                          content: string
                          previousContent?: string
                          moduleId: string
                          courseId: string
                          mode?: 'replace' | 'append'
                          label?: string
                        }
                        const diffRows = buildDiffRows(payload.previousContent ?? '', payload.content)
                        return (
                          <div key={block.id} className="rounded-xl border border-border bg-card/70 p-3">
                            <p className="text-xs font-semibold text-card-foreground">
                              {payload.label ?? 'Apply drafted content'}
                            </p>
                            {payload.previousContent ? (
                              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                <div className="rounded-lg border border-border/70 bg-card/70 p-2">
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Before</p>
                                  <pre className="mt-1 max-h-36 overflow-auto whitespace-pre-wrap text-[11px] text-muted-foreground">
                                    {payload.previousContent}
                                  </pre>
                                </div>
                                <div className="rounded-lg border border-border/70 bg-card/70 p-2">
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">After</p>
                                  <pre className="mt-1 max-h-36 overflow-auto whitespace-pre-wrap text-[11px] text-card-foreground">
                                    {payload.content}
                                  </pre>
                                </div>
                              </div>
                            ) : (
                              <pre className="mt-2 max-h-36 overflow-auto whitespace-pre-wrap rounded-lg border border-border/70 bg-card/70 p-2 text-[11px] text-card-foreground">
                                {payload.content}
                              </pre>
                            )}
                            <div className="mt-2 rounded-lg border border-border/70 bg-black/20 p-2">
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Inline diff</p>
                              <div className="mt-1 max-h-28 overflow-auto space-y-0.5">
                                {diffRows.slice(0, 80).map((row, idx) => (
                                  <p
                                    key={`${block.id}-${idx}`}
                                    className={cn(
                                      'whitespace-pre-wrap text-[10px]',
                                      row.kind === 'add'
                                        ? 'text-emerald-300'
                                        : row.kind === 'remove'
                                          ? 'text-rose-300'
                                          : 'text-muted-foreground'
                                    )}
                                  >
                                    {row.kind === 'add' ? '+ ' : row.kind === 'remove' ? '- ' : '  '}
                                    {row.text || ' '}
                                  </p>
                                ))}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => void applyModuleContent(payload.courseId, payload.moduleId, payload.content, payload.mode ?? 'replace', 'studio_chat_apply')}
                              className="mt-2 inline-flex items-center gap-1 rounded-pill bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                            >
                              Apply to module
                            </button>
                          </div>
                        )
                      }
                      return null
                    })}
                  </div>
                </div>
              ))}
              {thinking && (
                <div className="flex justify-start">
                  <div className="chat-bubble bg-muted/80 text-card-foreground border border-border flex items-center gap-2">
                    <SudarInlineLoader size="sm" className="shrink-0 text-primary" starFill="var(--background)" />
                    <span>Thinking…</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-border bg-card/80 shrink-0">
              {feedbackMode ? (
                <EarlyAccessFeedbackPanel
                  surface="studio"
                  pageRoute={route}
                  courseId={authoringContext.courseId ?? undefined}
                  moduleId={authoringContext.activeModuleId ?? undefined}
                  onCancel={() => setFeedbackMode(false)}
                  onSubmitted={(thankYou) => {
                    setFeedbackMode(false)
                    setMessages((prev) => [...prev, { role: 'assistant', content: thankYou }])
                  }}
                />
              ) : (
              <div className="relative flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                  placeholder="Ask Sudar..."
                  className="w-full bg-card/80 border border-border rounded-pill py-3 px-5 pr-14 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  disabled={thinking}
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={thinking || !input.trim()}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 h-10 w-10 shrink-0 bg-primary text-primary-foreground rounded-pill flex items-center justify-center shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                  aria-label="Send"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
