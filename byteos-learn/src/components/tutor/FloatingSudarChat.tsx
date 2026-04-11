'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, ExternalLink, Maximize2, Minimize2 } from 'lucide-react'
import { SudarInlineLoader } from '@/components/branding/SudarBrandLoader'
import { cn, stripTutorActionsFromText } from '@/lib/utils'
import type { TutorAction, TutorBlock } from '@/types/tutor'
import { GenerativeBlockRenderer } from './GenerativeBlockRenderer'
import { ChatMarkdown } from './ChatMarkdown'
import { SudarLogoMark } from '@/components/branding/SudarLogo'
import { MascotAvatar } from '@/components/mascot/MascotAvatar'
import { buildMascotResponse, normalizeMascotPreferences, pickActiveMascot } from '@/lib/mascot/engine'
import { trackMascotEvent } from '@/lib/mascot/tracking'
import { MascotModeBadge } from '@/components/mascot/MascotModeBadge'
import type { MascotPreferences } from '@/types/mascot'
import { MASCOT_ROLLOUT } from '@/lib/mascot/rollout'

interface Message {
  role: 'user' | 'assistant'
  content: string
  actions?: TutorAction[]
  blocks?: TutorBlock[]
}

const STARTUP_QUESTIONS = [
  'Are there any courses I can take?',
  'What should I learn next?',
  'Recommend a course for me',
  'Show me my progress',
  'Are there any courses on improving skills?',
]


export function FloatingSudarChat() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [pastedText, setPastedText] = useState('')
  const [thinking, setThinking] = useState(false)
  const [prefs, setPrefs] = useState<MascotPreferences | null>(null)
  const [openTracked, setOpenTracked] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const activeMascot = pickActiveMascot('chat_open', prefs)
  const greetingCopy = buildMascotResponse('chat_open', prefs).text

  if (!MASCOT_ROLLOUT.surfaces.tutor_chat) return null

  useEffect(() => {
    if (isOpen && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [isOpen, messages])

  useEffect(() => {
    fetch('/api/learner/preferences')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!data) return
        setPrefs(normalizeMascotPreferences({
          mascot_mode: data.mascot_mode,
          mascot_style: data.mascot_style,
          mascot_intensity: data.mascot_intensity,
          mascot_companions: data.mascot_companions,
        }))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!isOpen || openTracked) return
    setOpenTracked(true)
    void trackMascotEvent({
      eventType: 'mascot_impression',
      mascotId: activeMascot,
      source: 'tutor_chat',
      detail: { trigger: 'chat_open' },
    })
  }, [activeMascot, isOpen, openTracked])

  async function handleSendWithMessage(msg: string) {
    const trimmed = msg.trim()
    if (!trimmed || thinking) return
    setInput('')
    const newMessages: Message[] = [...messages, { role: 'user', content: trimmed }]
    setMessages(newMessages)
    setThinking(true)
    void trackMascotEvent({
      eventType: 'mascot_interaction',
      mascotId: pickActiveMascot('chat_query', prefs),
      source: 'tutor_chat',
      detail: { trigger: 'chat_query' },
    })

    try {
      const res = await fetch('/api/tutor/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          conversation_history: newMessages.slice(0, -1),
          route: pathname ?? undefined,
          ...(pastedText.trim() ? { pasted_text: pastedText.trim().slice(0, 15000) } : {}),
        }),
      })
      const text = await res.text()
      let data: { response?: string; error?: string; actions?: TutorAction[]; blocks?: TutorBlock[] } = {}
      if (text) {
        try {
          data = JSON.parse(text)
        } catch {
          data = { error: 'Invalid response from tutor' }
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
          content: data.response ?? 'Sorry, I had trouble answering that. Please try again.',
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
      setPastedText('')
    }
  }

  async function handleSend() {
    const msg = input.trim()
    if (!msg || thinking) return
    await handleSendWithMessage(msg)
  }

  return (
    <>
      {/* Hide FAB and panel on course learn page (inline tutor is shown there) */}
      {!/\/courses\/[^/]+\/learn/.test(pathname ?? '') && (
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
        onClick={() => {
          if (isOpen) {
            void trackMascotEvent({
              eventType: 'mascot_dismiss',
              mascotId: activeMascot,
              source: 'tutor_chat',
              detail: { trigger: 'chat_open' },
            })
          } else {
            setOpenTracked(false)
          }
          setIsOpen(!isOpen)
        }}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-full border border-primary/35 bg-primary/15 text-primary shadow-2xl backdrop-blur-md transition-[box-shadow,background-color,border-color] duration-300 hover:border-primary/55 hover:bg-primary/28 hover:shadow-[0_18px_50px_-12px_color-mix(in_oklab,var(--primary)_42%,transparent)] motion-reduce:backdrop-blur-none motion-reduce:hover:shadow-2xl"
        aria-label={isOpen ? 'Close Sudar chat' : 'Open Sudar chat'}
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
            <div className="p-5 border-b border-border flex items-center justify-between gap-2 shrink-0 bg-card/80">
              <div className="flex items-center gap-3 min-w-0">
                <MascotAvatar mascotId={activeMascot} size="lg" className="rounded-2xl shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-display text-lg font-bold text-card-foreground">Sudar</h3>
                  <div className="mt-1">
                    <MascotModeBadge mascotId={activeMascot} />
                  </div>
                </div>
              </div>
              <div className="flex items-center shrink-0">
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 text-muted-foreground hover:text-card-foreground transition-colors rounded-lg"
                  aria-label={isExpanded ? 'Collapse chat' : 'Expand chat'}
                  title={isExpanded ? 'Collapse chat' : 'Larger chat panel'}
                >
                  {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void trackMascotEvent({
                      eventType: 'mascot_dismiss',
                      mascotId: activeMascot,
                      source: 'tutor_chat',
                      detail: { trigger: 'chat_open' },
                    })
                    setIsOpen(false)
                  }}
                  className="p-2 text-muted-foreground hover:text-card-foreground transition-colors rounded-lg"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div
              ref={listRef}
              className="flex-1 overflow-y-auto p-5 space-y-4"
            >
              {messages.length === 0 && (
                <>
                  <div className="chat-bubble bg-muted/80 text-card-foreground border border-border">
                    {`Hi! I'm Sudar. ${greetingCopy}`}
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Try asking</p>
                  <div className="flex flex-wrap gap-2">
                    {STARTUP_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => {
                          void trackMascotEvent({
                            eventType: 'mascot_nudge_outcome',
                            mascotId: activeMascot,
                            source: 'tutor_chat',
                            detail: { nudge_type: 'startup_question', accepted: true },
                          })
                          void handleSendWithMessage(q)
                        }}
                        className="rounded-full bg-card/80 border border-border px-4 py-2 text-sm text-card-foreground hover:bg-primary/10 hover:border-primary/30 transition-colors text-left"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
                >
                  <div className="flex flex-col gap-2 max-w-[85%]">
                    <div
                      className={cn(
                        'chat-bubble',
                        m.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/80 text-card-foreground border border-border'
                      )}
                    >
                      {m.role === 'assistant' && m.blocks?.length ? (
                        <GenerativeBlockRenderer
                          blocks={m.blocks}
                          onActionClick={(action) => {
                            fetch('/api/tutor/outcome', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                course_id: action.course_id ?? undefined,
                                path_id: action.path_id ?? undefined,
                                action_label: action.label,
                              }),
                            }).catch(() => {})
                          }}
                          onQuizRetry={() => handleSendWithMessage('Give me another quiz question')}
                        />
                      ) : (
                        <>
                          {m.role === 'assistant' ? <ChatMarkdown text={stripTutorActionsFromText(m.content)} /> : m.content}
                          {m.role === 'assistant' && m.actions && m.actions.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {m.actions.map((action, aIdx) => (
                                <Link
                                  key={aIdx}
                                  href={action.href}
                                  onClick={() => {
                                    fetch('/api/tutor/outcome', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        course_id: action.course_id ?? undefined,
                                        path_id: action.path_id ?? undefined,
                                        action_label: action.label,
                                      }),
                                    }).catch(() => {})
                                  }}
                                  className="inline-flex items-center gap-1.5 rounded-full bg-primary/90 px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary transition-colors"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  {action.label}
                                </Link>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {thinking && (
                <div className="flex justify-start">
                  <div className="chat-bubble bg-muted/80 text-card-foreground border border-border flex items-center gap-2">
                    <SudarInlineLoader size="sm" className="shrink-0" />
                    <span>Thinking…</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-border bg-card/80 shrink-0">
              {pastedText.length > 0 && (
                <div className="mb-2 rounded-lg border border-border bg-card/80 p-2">
                  <p className="text-[10px] text-muted-foreground mb-1">Pasted text ({pastedText.length} chars) — will be sent with your message</p>
                  <button
                    type="button"
                    onClick={() => setPastedText('')}
                    className="text-xs text-primary hover:underline"
                  >
                    Clear
                  </button>
                </div>
              )}
              <div className="relative flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ask Sudar anything..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  className="w-full bg-card/80 border border-border rounded-full py-3 px-5 pr-14 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!input.trim() || thinking}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                  aria-label="Send"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-2">
                <textarea
                  placeholder="Paste text here to summarize or extract key terms (then type e.g. &quot;Summarize this&quot; and send)"
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  className="w-full min-h-[56px] max-h-[120px] resize-y rounded-lg border border-border bg-card/80 px-3 py-2 text-xs text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  rows={2}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                Sudar is for learning. Do not paste passwords, card numbers, or private keys.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </>
      )}
    </>
  )
}
