'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname, useParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, ExternalLink, Download, Maximize2, Minimize2 } from 'lucide-react'
import { SudarInlineLoader } from '@/components/branding/SudarBrandLoader'
import { cn } from '@/lib/utils'
import { SudarLogoMark } from '@/components/branding/SudarLogo'

interface Message {
  role: 'user' | 'assistant'
  content: string
  actions?: Array<{ type: string; label: string; href: string }>
  blocks?: Array<{ id: string; type: string; payload: Record<string, unknown> }>
}

const QUICK_PROMPTS = [
  'Add a user',
  'Assign a course to someone',
  'Show analytics summary',
  'Export users CSV',
  'How do I embed Sudar?',
  'What are our org KPIs?',
]

export function SudarStudioChat({ orgRole }: { orgRole: 'ADMIN' | 'MANAGER' | 'CREATOR' | 'LEARNER' }) {
  const pathname = usePathname()
  const params = useParams()
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  const route = pathname ?? ''
  const focusUserId = route.startsWith('/users/') && params?.id && typeof params.id === 'string' ? params.id : undefined

  useEffect(() => {
    if (isOpen && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [isOpen, messages])

  async function handleSendWithMessage(msg: string) {
    const trimmed = msg.trim()
    if (!trimmed || thinking) return
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
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: data.response ?? 'Sorry, I had trouble answering that.',
          actions: data.actions?.length ? data.actions : undefined,
          blocks: data.blocks,
        },
      ])
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
      <motion.button
        type="button"
        whileHover={{
          y: -5,
          scale: 1.06,
          transition: { type: 'spring', stiffness: 420, damping: 24 },
        }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: 'spring', stiffness: 460, damping: 28 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-full border border-primary/35 bg-primary/15 text-primary shadow-2xl backdrop-blur-md transition-[box-shadow,background-color,border-color] duration-300 hover:border-primary/55 hover:bg-primary/28 hover:shadow-[0_18px_50px_-12px_color-mix(in_oklab,var(--primary)_42%,transparent)] motion-reduce:backdrop-blur-none motion-reduce:hover:shadow-2xl"
        aria-label={isOpen ? 'Close Sudar' : 'Open Sudar'}
      >
        <SudarLogoMark className="h-8 w-auto md:h-9" starFill="var(--background)" animated />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'fixed z-[60] liquid-glass flex flex-col overflow-hidden rounded-[2rem] shadow-2xl transition-all duration-200',
              isExpanded
                ? 'top-4 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[calc(100vw-3rem)] max-w-[720px] h-[calc(100vh-6rem)]'
                : 'bottom-24 right-6 w-[calc(100vw-3rem)] max-w-[420px] h-[520px]'
            )}
          >
            <div className="p-5 border-b border-border flex items-center justify-between gap-2 shrink-0 bg-card/90">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center">
                  <SudarLogoMark className="h-8 w-auto text-primary" starFill="var(--card)" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-card-foreground">Sudar</h3>
                  <p className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">Studio assistant</p>
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

            <div ref={listRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-background/40">
              {messages.length === 0 && (
                <>
                  <div className="chat-bubble bg-muted text-foreground border border-border">
                    Hi! I&apos;m Sudar. I can help with users, courses, paths, analytics, integrations, and anything in Sudar Studio. Ask me anything.
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Try</p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_PROMPTS.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => handleSendWithMessage(q)}
                        className="rounded-full bg-muted border border-border px-4 py-2 text-sm text-foreground hover:bg-primary/15 hover:border-primary/35 transition-colors text-left"
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
                          : 'bg-muted text-foreground border border-border'
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
                                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-500 px-3 py-1.5 text-xs text-white"
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
                            className="inline-flex items-center gap-2 rounded-lg bg-slate-700 hover:bg-slate-600 px-3 py-2 text-xs text-white"
                          >
                            <Download className="w-4 h-4" />
                            Download {filename}
                          </button>
                        )
                      }
                      return null
                    })}
                  </div>
                </div>
              ))}
              {thinking && (
                <div className="flex justify-start">
                  <div className="chat-bubble bg-muted text-muted-foreground border border-border flex items-center gap-2">
                    <SudarInlineLoader size="sm" className="shrink-0 text-violet-400" starFill="var(--background)" />
                    <span>Thinking…</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-border bg-card/90 shrink-0">
              <div className="relative flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                  placeholder="Ask Sudar..."
                  className="w-full bg-muted border border-border rounded-full py-3 px-5 pr-14 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  disabled={thinking}
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={thinking || !input.trim()}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                  aria-label="Send"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
