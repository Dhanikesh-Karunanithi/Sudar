'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight,
  BookOpen, List, X, Sparkles, Send, Loader2, Bot,
  ChevronDown, FileText, Video, Headphones, Network,
  Layers, Zap, MessageSquarePlus, Code, Quote, Pin, PinOff, PanelLeftClose
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { QuizCard } from './QuizCard'
import { FlashcardsCard, type FlashcardPair } from './FlashcardsCard'
import { RichModuleContent } from '@/components/learn/RichModuleContent'
import { isRichContent, type RichContent } from '@/types/content'

// ─── Types ──────────────────────────────────────────────────────────────────

interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correct: number
  explanation: string
  topic: string
}

interface Module {
  id: string
  title: string
  content: ({ type: string; body?: string } & Partial<RichContent>) | null
  order_index: number
  quiz?: { questions: QuizQuestion[] } | null
}

interface Course {
  id: string
  title: string
  modules: Module[]
  settings?: {
    module_completion?: Record<string, { type: 'mark_button' | 'min_time'; min_time_secs?: number }>
  } | null
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface PersonalizedWelcome {
  message: string
  first_name: string
  course_title: string
  prior_courses: number
  relevant_concepts: string[]
}

interface SelectionPopup {
  text: string
  x: number
  y: number
}

interface Props {
  course: Course
  activeModuleId: string
  completedModuleIds: string[]
  enrollmentProgress: number
  personalizedWelcome?: Record<string, unknown> | null
  learnerName?: string
}

/** Get plain text body from module content for flashcards or fallback */
function getContentBodyForFlashcards(content: Module['content']): string {
  if (!content) return ''
  if (content.type === 'text' && typeof (content as { body?: string }).body === 'string')
    return (content as { body: string }).body
  if (isRichContent(content)) {
    const parts: string[] = []
    if (content.introduction) parts.push(content.introduction)
    content.sections?.forEach((s) => { parts.push(s.heading, s.content) })
    if (content.summary) parts.push(content.summary)
    return parts.join('\n\n')
  }
  return ''
}

// ─── Markdown renderer ───────────────────────────────────────────────────────
// Converts the AI-generated markdown text to clean, styled React elements.

function renderMarkdown(body: string): React.ReactNode {
  if (!body?.trim()) return (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-3">
      <BookOpen className="w-10 h-10 opacity-50" />
      <p className="text-sm">This module has no content yet.</p>
    </div>
  )

  const lines = body.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0
  let key = 0

  function nextKey() { return key++ }

  // Inline formatting: bold, italic, inline code, links
  function parseInline(text: string): React.ReactNode {
    const parts: React.ReactNode[] = []
    // Regex: **bold**, *italic*, `code`
    const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g
    let last = 0
    let match: RegExpExecArray | null

    while ((match = regex.exec(text)) !== null) {
      if (match.index > last) parts.push(text.slice(last, match.index))
      if (match[0].startsWith('**')) {
        parts.push(<strong key={match.index} className="font-semibold text-card-foreground">{match[2]}</strong>)
      } else if (match[0].startsWith('*')) {
        parts.push(<em key={match.index} className="italic text-card-foreground">{match[3]}</em>)
      } else if (match[0].startsWith('`')) {
        parts.push(
          <code key={match.index} className="bg-muted text-primary text-xs px-1.5 py-0.5 rounded font-mono border border-border">
            {match[4]}
          </code>
        )
      }
      last = match.index + match[0].length
    }
    if (last < text.length) parts.push(text.slice(last))
    return parts.length === 1 ? parts[0] : <>{parts}</>
  }

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    // Skip empty lines (whitespace only)
    if (!trimmed) { i++; continue }

    // Fenced code block ```
    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim() || 'code'
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      elements.push(
        <div key={nextKey()} className="my-4 rounded-xl overflow-hidden border border-border shadow-sm">
          <div className="flex items-center gap-2 px-4 py-2 bg-muted border-b border-border">
            <Code className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-mono">{lang}</span>
          </div>
          <pre className="bg-card p-4 overflow-x-auto">
            <code className="text-sm text-card-foreground font-mono leading-relaxed">
              {codeLines.join('\n')}
            </code>
          </pre>
        </div>
      )
      i++ // skip closing ```
      continue
    }

    // Headings
    if (trimmed.startsWith('#### ')) {
      elements.push(<h4 key={nextKey()} className="text-base font-semibold text-card-foreground mt-5 mb-1.5">{parseInline(trimmed.slice(5))}</h4>)
      i++; continue
    }
    if (trimmed.startsWith('### ')) {
      elements.push(<h3 key={nextKey()} className="text-lg font-semibold text-card-foreground mt-6 mb-2">{parseInline(trimmed.slice(4))}</h3>)
      i++; continue
    }
    if (trimmed.startsWith('## ')) {
      elements.push(
        <h2 key={nextKey()} className="text-xl font-bold text-card-foreground mt-8 mb-3 pb-2 border-b border-border">
          {parseInline(trimmed.slice(3))}
        </h2>
      )
      i++; continue
    }
    if (trimmed.startsWith('# ')) {
      elements.push(<h1 key={nextKey()} className="text-2xl font-bold text-card-foreground mt-6 mb-3">{parseInline(trimmed.slice(2))}</h1>)
      i++; continue
    }

    // Horizontal rule
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      elements.push(<hr key={nextKey()} className="my-6 border-border" />)
      i++; continue
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('> ')) {
        quoteLines.push(lines[i].trim().slice(2))
        i++
      }
      elements.push(
        <blockquote key={nextKey()} className="my-4 border-l-4 border-primary/30 bg-primary/10/60 rounded-r-lg pl-4 pr-3 py-3 flex gap-3">
          <Quote className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-card-foreground italic leading-relaxed">{parseInline(quoteLines.join(' '))}</p>
        </blockquote>
      )
      continue
    }

    // Unordered list
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const items: React.ReactNode[] = []
      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
        const itemText = lines[i].trim().slice(2)
        // Sub-items (indented)
        const subItems: React.ReactNode[] = []
        i++
        while (i < lines.length && (lines[i].startsWith('  - ') || lines[i].startsWith('  * '))) {
          subItems.push(
            <li key={i} className="flex items-start gap-2 text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground shrink-0 mt-2" />
              <span>{parseInline(lines[i].trim().slice(2))}</span>
            </li>
          )
          i++
        }
        items.push(
          <li key={i} className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/100 shrink-0 mt-2" />
            <span className="flex-1">
              {parseInline(itemText)}
              {subItems.length > 0 && <ul className="mt-1.5 ml-2 space-y-1">{subItems}</ul>}
            </span>
          </li>
        )
      }
      elements.push(
        <ul key={nextKey()} className="my-3 space-y-2 text-card-foreground text-sm leading-relaxed">
          {items}
        </ul>
      )
      continue
    }

    // Ordered list
    if (/^\d+\.\s/.test(trimmed)) {
      const items: React.ReactNode[] = []
      let num = 1
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        const itemText = lines[i].trim().replace(/^\d+\.\s/, '')
        items.push(
          <li key={i} className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{num}</span>
            <span className="flex-1 text-card-foreground">{parseInline(itemText)}</span>
          </li>
        )
        num++; i++
      }
      elements.push(
        <ol key={nextKey()} className="my-3 space-y-2.5 text-sm leading-relaxed">
          {items}
        </ol>
      )
      continue
    }

    // Regular paragraph
    elements.push(
      <p key={nextKey()} className="text-card-foreground text-sm leading-relaxed my-3">
        {parseInline(trimmed)}
      </p>
    )
    i++
  }

  return <div className="space-y-0.5">{elements}</div>
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CourseViewer({
  course,
  activeModuleId,
  completedModuleIds,
  enrollmentProgress,
  personalizedWelcome,
  learnerName,
}: Props) {
  const router = useRouter()
  const [currentModuleId, setCurrentModuleId] = useState(activeModuleId)
  const [completed, setCompleted] = useState(new Set(completedModuleIds))
  const [progress, setProgress] = useState(enrollmentProgress)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const SIDEBAR_STORAGE_KEY = 'byteos-learn-course-sidebar'
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarPinned, setSidebarPinned] = useState(true)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SIDEBAR_STORAGE_KEY)
      const parsed = raw ? JSON.parse(raw) : {}
      setSidebarCollapsed(!!parsed.collapsed)
      setSidebarPinned(parsed.pinned !== false)
    } catch {}
  }, [])
  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify({ collapsed: sidebarCollapsed, pinned: sidebarPinned }))
    } catch {}
  }, [sidebarCollapsed, sidebarPinned])
  const [markingComplete, setMarkingComplete] = useState(false)
  const startTimeRef = useRef(Date.now())
  // Time tracking: active (tab visible) vs idle (tab hidden or tab not focused)
  const activeMsRef = useRef(0)
  const lastVisibleAtRef = useRef<number>(Date.now())
  const isVisibleRef = useRef(typeof document !== 'undefined' ? document.visibilityState === 'visible' : true)
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Welcome card
  const [showWelcome, setShowWelcome] = useState(!!personalizedWelcome?.message)
  const welcome = personalizedWelcome as PersonalizedWelcome | null

  // Quiz state
  const [showQuiz, setShowQuiz] = useState(false)
  const [quizCompletedModules, setQuizCompletedModules] = useState<Set<string>>(new Set())

  // Modality
  const [activeModality, setActiveModality] = useState<string>('text')
  const [flashcardsByModule, setFlashcardsByModule] = useState<Record<string, FlashcardPair[]>>({})
  const [flashcardsLoading, setFlashcardsLoading] = useState(false)

  // Tutor state
  const [tutorOpen, setTutorOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Text selection popup
  const [selectionPopup, setSelectionPopup] = useState<SelectionPopup | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const modules = course.modules
  const currentModule = modules.find((m) => m.id === currentModuleId) ?? modules[0]
  const currentIndex = modules.findIndex((m) => m.id === currentModuleId)
  const prevModule = modules[currentIndex - 1]
  const nextModule = modules[currentIndex + 1]
  const isCompleted = completed.has(currentModuleId)
  const hasQuiz = !!(currentModule?.quiz?.questions?.length)
  const quizDoneForModule = quizCompletedModules.has(currentModuleId)

  // Completion rule from course settings (admin can require min time per section)
  const completionRule = course.settings?.module_completion?.[currentModuleId]
  const minTimeSecs = completionRule?.type === 'min_time' ? (completionRule.min_time_secs ?? 0) : 0
  const [elapsedActiveSecs, setElapsedActiveSecs] = useState(0)
  const canMarkCompleteByTime = minTimeSecs <= 0 || elapsedActiveSecs >= minTimeSecs

  // ── Effects ──────────────────────────────────────────────────────────
  // Visibility: only count time as "active" when tab is visible
  useEffect(() => {
    function handleVisibility() {
      const now = Date.now()
      if (document.visibilityState === 'visible') {
        lastVisibleAtRef.current = now
        isVisibleRef.current = true
      } else {
        if (isVisibleRef.current) activeMsRef.current += now - lastVisibleAtRef.current
        isVisibleRef.current = false
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  // Heartbeat every 30s for section time (so admin sees time even if learner leaves without completing)
  useEffect(() => {
    heartbeatIntervalRef.current = setInterval(() => {
      const totalMs = Date.now() - startTimeRef.current
      const activeSecs = Math.round(activeMsRef.current / 1000)
      const totalSecs = Math.round(totalMs / 1000)
      if (totalSecs < 2) return
      fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'section_heartbeat',
          course_id: course.id,
          module_id: currentModuleId,
          modality: 'text',
          duration_secs: totalSecs,
          payload: { active_secs: activeSecs, total_secs: totalSecs },
        }),
      }).catch(() => {})
    }, 30000)
    return () => {
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = null
    }
  }, [course.id, currentModuleId])

  useEffect(() => {
    startTimeRef.current = Date.now()
    activeMsRef.current = 0
    lastVisibleAtRef.current = Date.now()
    isVisibleRef.current = typeof document !== 'undefined' ? document.visibilityState === 'visible' : true
    setElapsedActiveSecs(0)
    setShowQuiz(false)
    fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: 'module_start', course_id: course.id, module_id: currentModuleId, modality: 'text' }),
    })
    setMessages([])
  }, [currentModuleId, course.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Sync elapsed active time for min-time completion rule (so button enables when threshold met)
  useEffect(() => {
    if (minTimeSecs <= 0) return
    const interval = setInterval(() => {
      setElapsedActiveSecs(Math.round(activeMsRef.current / 1000))
    }, 2000)
    return () => clearInterval(interval)
  }, [currentModuleId, minTimeSecs])

  // Fetch flashcards when switching to flashcards modality and we don't have cards for this module
  useEffect(() => {
    if (activeModality !== 'flashcards' || !currentModuleId || !currentModule?.content?.body) return
    if (flashcardsByModule[currentModuleId]) return
    setFlashcardsLoading(true)
    fetch('/api/ai/generate-flashcards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: currentModule.content.body,
        module_title: currentModule.title,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        const cards = Array.isArray(data.cards) ? data.cards : []
        setFlashcardsByModule((prev) => ({ ...prev, [currentModuleId]: cards }))
      })
      .catch(() => setFlashcardsByModule((prev) => ({ ...prev, [currentModuleId]: [] })))
      .finally(() => setFlashcardsLoading(false))
  }, [activeModality, currentModuleId, currentModule?.content?.body, currentModule?.title])

  // Text selection handler
  const handleSelection = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      setSelectionPopup(null)
      return
    }
    const text = selection.toString().trim()
    if (text.length < 5 || text.length > 500) { setSelectionPopup(null); return }

    // Only trigger if inside the content area
    if (contentRef.current) {
      const range = selection.getRangeAt(0)
      const container = range.commonAncestorContainer
      if (!contentRef.current.contains(container)) { setSelectionPopup(null); return }

      const rect = range.getBoundingClientRect()
      // Use viewport coordinates for fixed positioning
      // Clamp x so the popup never overflows the screen edges
      const centerX = rect.left + rect.width / 2
      const estimatedHalfWidth = 340
      const clampedX = Math.max(
        estimatedHalfWidth + 8,
        Math.min(window.innerWidth - estimatedHalfWidth - 8, centerX)
      )
      setSelectionPopup({
        text,
        x: clampedX,
        y: rect.top - 8,
      })
    }
  }, [])

  useEffect(() => {
    document.addEventListener('mouseup', handleSelection)
    document.addEventListener('touchend', handleSelection)
    return () => {
      document.removeEventListener('mouseup', handleSelection)
      document.removeEventListener('touchend', handleSelection)
    }
  }, [handleSelection])

  // ── Handlers ─────────────────────────────────────────────────────────
  function navigateTo(moduleId: string) {
    setCurrentModuleId(moduleId)
    setSidebarOpen(false)
    setSelectionPopup(null)
    router.replace(`/courses/${course.id}/learn?module=${moduleId}`, { scroll: false })
  }

  async function handleMarkComplete() {
    if (isCompleted) return
    setMarkingComplete(true)
    const now = Date.now()
    const totalMs = now - startTimeRef.current
    if (isVisibleRef.current) activeMsRef.current += now - lastVisibleAtRef.current
    const activeSecs = Math.round(activeMsRef.current / 1000)
    const totalSecs = Math.round(totalMs / 1000)
    const idleSecs = Math.max(0, totalSecs - activeSecs)
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'module_complete',
        course_id: course.id,
        module_id: currentModuleId,
        modality: 'text',
        duration_secs: totalSecs,
        payload: { active_secs: activeSecs, idle_secs: idleSecs },
      }),
    })
    const newCompleted = new Set(completed)
    newCompleted.add(currentModuleId)
    setCompleted(newCompleted)
    const newProgress = Math.min(100, Math.round((newCompleted.size / modules.length) * 100))
    setProgress(newProgress)
    setMarkingComplete(false)

    // Show quiz if available and not yet done for this module
    if (hasQuiz && !quizDoneForModule) {
      setShowQuiz(true)
    } else if (nextModule) {
      setTimeout(() => navigateTo(nextModule.id), 600)
    }
  }

  async function handleQuizComplete(score: number, wrongTopics: string[]) {
    setQuizCompletedModules((s) => new Set([...s, currentModuleId]))

    // Fire quiz attempt event — this feeds struggles into learner memory
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'quiz_attempt',
        course_id: course.id,
        module_id: currentModuleId,
        payload: { score, wrong_topics: wrongTopics, module_title: currentModule?.title },
      }),
    })
  }

  function handleQuizAskByte(prompt: string) {
    setInput(prompt)
    setTutorOpen(true)
    setShowQuiz(false)
    // Auto-send after a tick so state settles
    setTimeout(() => {
      const sendBtn = document.getElementById('byte-send-btn')
      sendBtn?.click()
    }, 100)
  }

  async function handleTutorSend(overrideInput?: string) {
    const msg = (overrideInput ?? input).trim()
    if (!msg || thinking) return
    setInput('')
    setSelectionPopup(null)
    const newMessages: Message[] = [...messages, { role: 'user', content: msg }]
    setMessages(newMessages)
    setThinking(true)

    try {
      const res = await fetch('/api/tutor/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, course_id: course.id, module_id: currentModuleId, conversation_history: messages }),
      })
      const text = await res.text()
      let data: { response?: string; error?: string } = {}
      if (text) {
        try {
          data = JSON.parse(text)
        } catch {
          data = { error: 'Invalid response from tutor' }
        }
      }
      if (!res.ok) {
        setMessages([...newMessages, {
          role: 'assistant',
          content: data.error ?? `Something went wrong (${res.status}). Please try again.`,
        }])
        return
      }
      setMessages([...newMessages, {
        role: 'assistant',
        content: data.response ?? 'Sorry, I had trouble answering that. Please try again.',
      }])
    } catch {
      setMessages([...newMessages, {
        role: 'assistant',
        content: 'Unable to reach Sudar. Please check your connection and try again.',
      }])
    } finally {
      setThinking(false)
    }
  }

  function sendToByteFromSelection(action: string) {
    if (!selectionPopup) return
    const prompt = `${action}: "${selectionPopup.text}"`
    setTutorOpen(true)
    setInput(prompt)
    setSelectionPopup(null)
    setTimeout(() => handleTutorSend(prompt), 150)
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex bg-background overflow-hidden -mx-6 -mt-8 -mb-8 h-[calc(100vh-64px)]">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Selection popup — fixed so it floats above overflow-hidden containers */}
      {selectionPopup && (
        <div
          className="fixed z-[9999] bg-card border border-border rounded-xl shadow-2xl p-1 flex items-center gap-0.5 flex-wrap"
          style={{ left: selectionPopup.x, top: selectionPopup.y, transform: 'translate(-50%, -100%)' }}
        >
          {[
            { label: 'Explain this', icon: '💡' },
            { label: 'Give me an example', icon: '🔍' },
            { label: 'Why does this matter?', icon: '🎯' },
            { label: 'Simplify this', icon: '✨' },
          ].map(({ label, icon }) => (
            <button
              key={label}
              onClick={() => sendToByteFromSelection(label)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-muted rounded-lg text-xs text-card-foreground font-medium transition-colors whitespace-nowrap"
            >
              <span>{icon}</span>{label}
            </button>
          ))}
          <div className="w-px h-4 bg-border mx-1" />
          <button
            onClick={() => { setInput(`About "${selectionPopup.text.slice(0, 60)}${selectionPopup.text.length > 60 ? '…' : ''}": `); setTutorOpen(true); setSelectionPopup(null) }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-primary/50 rounded-lg text-xs text-primary font-medium transition-colors"
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />Custom question
          </button>
        </div>
      )}

      {/* Collapsed: show expand tab on desktop */}
      {sidebarCollapsed && (
        <div className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-30">
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="flex items-center gap-1.5 pl-2 pr-3 py-2 rounded-r-lg bg-muted border border-l-0 border-border shadow-sm text-xs font-medium text-muted-foreground hover:text-card-foreground hover:bg-card transition-colors"
          >
            <List className="w-4 h-4" /> Sections
          </button>
        </div>
      )}

      {/* Module list sidebar */}
      <div className={cn(
        'fixed lg:relative inset-y-0 left-0 z-30 w-72 bg-muted border-r border-border flex flex-col transition-transform duration-200',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        sidebarCollapsed && 'lg:!-translate-x-full lg:!w-0 lg:!min-w-0 lg:!overflow-hidden lg:!border-0 lg:!invisible'
      )}>
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Link href={`/courses/${course.id}`} className="flex items-center gap-2 text-muted-foreground hover:text-card-foreground text-xs transition-colors shrink-0">
              <ArrowLeft className="w-3.5 h-3.5" />Course details
            </Link>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setSidebarPinned(!sidebarPinned)}
                className={cn(
                  'p-1.5 rounded-md transition-colors hidden lg:flex',
                  sidebarPinned ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:bg-muted'
                )}
                title={sidebarPinned ? 'Unpin sections' : 'Pin sections'}
              >
                {sidebarPinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="p-1.5 rounded-md text-muted-foreground hover:bg-muted transition-colors hidden lg:flex"
                title="Collapse sections"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
              <button className="lg:hidden p-1.5 rounded-md text-muted-foreground hover:bg-muted" onClick={() => setSidebarOpen(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <h2 className="text-sm font-semibold text-card-foreground leading-snug line-clamp-2">{course.title}</h2>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Progress</span>
              <span className="text-xs font-semibold text-primary">{progress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div className="bg-primary h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {modules.map((mod, idx) => {
            const isDone = completed.has(mod.id)
            const isCurrent = mod.id === currentModuleId
            const hasModQuiz = !!(mod.quiz?.questions?.length)
            return (
              <button key={mod.id} onClick={() => navigateTo(mod.id)}
                className={cn('w-full text-left px-3 py-2.5 rounded-lg flex items-start gap-3 transition-all group',
                  isCurrent ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'
                )}
              >
                <div className={cn('w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-semibold',
                  isDone ? 'bg-green-100 text-green-700' : isCurrent ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                )}>
                  {isDone ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> : idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <span className={cn('text-xs font-medium leading-snug line-clamp-2', isDone && 'line-through opacity-60')}>{mod.title}</span>
                  {hasModQuiz && <span className="text-[9px] text-muted-foreground mt-0.5 block">Includes quiz</span>}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-border bg-background shrink-0 flex-wrap">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 rounded-md hover:bg-muted transition-colors">
            <List className="w-4 h-4 text-muted-foreground" />
          </button>
          <span className="text-xs text-muted-foreground">{currentIndex + 1} / {modules.length}</span>
          <div className="h-4 w-px bg-muted" />
          <h1 className="text-sm font-semibold text-card-foreground truncate flex-1 min-w-0">{currentModule?.title}</h1>

          {/* Modality switcher */}
          <div className="hidden sm:flex items-center gap-0.5 bg-muted rounded-lg p-0.5 shrink-0">
            {[
              { id: 'text', icon: FileText, label: 'Read' },
              { id: 'video', icon: Video, label: 'Watch', soon: true },
              { id: 'audio', icon: Headphones, label: 'Listen', soon: true },
              { id: 'mindmap', icon: Network, label: 'Map', soon: true },
              { id: 'flashcards', icon: Layers, label: 'Cards' },
            ].map(({ id, icon: Icon, label, soon }) => (
              <button key={id} onClick={() => !soon && setActiveModality(id)}
                title={soon ? `${label} — coming in Phase 4` : label}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all',
                  soon ? 'opacity-40 cursor-not-allowed' : '',
                  activeModality === id && !soon ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-card-foreground'
                )}>
                <Icon className="w-3 h-3" />
                <span className="hidden md:inline">{label}</span>
              </button>
            ))}
          </div>

          {isCompleted && (
            <div className="flex items-center gap-1.5 text-green-600 text-xs font-medium shrink-0">
              <CheckCircle2 className="w-4 h-4" />Completed
            </div>
          )}

          {/* Ask Sudar button */}
          <button onClick={() => { setTutorOpen(!tutorOpen); setSelectionPopup(null) }}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0',
              tutorOpen ? 'bg-primary text-white shadow-md shadow-md' : 'bg-primary/5 text-primary hover:bg-primary/10 border border-primary/20'
            )}>
            <Sparkles className="w-3.5 h-3.5" />Ask Sudar
            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', tutorOpen && 'rotate-180')} />
          </button>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Module content + quiz */}
          <div className="flex flex-col min-h-0 overflow-hidden flex-1">
            <div className="flex-1 overflow-y-auto relative bg-background text-foreground" onClick={() => selectionPopup && setSelectionPopup(null)}>
              <div className="max-w-2xl mx-auto px-6 py-8 space-y-10" ref={contentRef}>

                {/* Personalized welcome card */}
                {showWelcome && welcome?.message && (
                  <div className="relative bg-gradient-to-br from-primary/5 via-primary/5 to-background border border-primary/20 rounded-2xl p-6 shadow-sm shadow-sm">
                    <button onClick={() => setShowWelcome(false)}
                      className="absolute top-3 right-3 p-1.5 hover:bg-primary/10 rounded-lg transition-colors">
                      <X className="w-4 h-4 text-primary" />
                    </button>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-md shrink-0">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-card-foreground">Sudar knows you&apos;re here</p>
                        <p className="text-xs text-primary">Personalized just for you</p>
                      </div>
                    </div>
                    <p className="text-card-foreground text-sm leading-relaxed">{welcome.message}</p>
                    {welcome.relevant_concepts?.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-primary" />Concepts you already know that apply here
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {welcome.relevant_concepts.map((concept) => (
                            <span key={concept} className="text-xs px-2.5 py-1 bg-primary/10 text-primary rounded-full font-medium border border-primary/20">{concept}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {welcome.prior_courses > 0 && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                        {welcome.prior_courses} prior course{welcome.prior_courses !== 1 ? 's' : ''} informed this
                      </div>
                    )}
                    <button onClick={() => setShowWelcome(false)}
                      className="mt-4 w-full py-2 bg-primary hover:bg-primary/100 text-white text-xs font-medium rounded-xl transition-colors">
                      Let&apos;s go! Start learning →
                    </button>
                  </div>
                )}

                {/* Module content — text or flashcards */}
                {activeModality === 'flashcards' ? (
                  <FlashcardsCard
                    cards={flashcardsByModule[currentModuleId] ?? []}
                    loading={flashcardsLoading}
                    onRetry={() => {
                      setFlashcardsByModule((prev) => {
                        const next = { ...prev }
                        delete next[currentModuleId]
                        return next
                      })
                      setFlashcardsLoading(true)
                      fetch('/api/ai/generate-flashcards', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          content: getContentBodyForFlashcards(currentModule?.content ?? null),
                          module_title: currentModule?.title ?? '',
                        }),
                      })
                        .then((r) => r.json())
                        .then((data) => {
                          const cards = Array.isArray(data.cards) ? data.cards : []
                          setFlashcardsByModule((prev) => ({ ...prev, [currentModuleId]: cards }))
                        })
                        .finally(() => setFlashcardsLoading(false))
                    }}
                  />
                ) : isRichContent(currentModule?.content) ? (
                  <RichModuleContent
                    content={currentModule.content}
                    renderMarkdown={renderMarkdown}
                    onExplain={(context) => {
                      setInput(context)
                      setTutorOpen(true)
                    }}
                    courseId={course.id}
                    moduleId={currentModuleId}
                    moduleTitle={currentModule?.title ?? ''}
                    learnerName={learnerName}
                    onQuizComplete={handleQuizComplete}
                    onAskByte={handleQuizAskByte}
                  />
                ) : (
                  <div>
                    {renderMarkdown((currentModule?.content as { body?: string })?.body ?? '')}
                  </div>
                )}

                {/* Quiz — shown after Mark Complete */}
                {showQuiz && hasQuiz && currentModule?.quiz && (
                  <div>
                    <QuizCard
                      quiz={currentModule.quiz}
                      courseId={course.id}
                      moduleId={currentModuleId}
                      moduleTitle={currentModule.title}
                      learnerName={learnerName}
                      onComplete={handleQuizComplete}
                      onAskByte={handleQuizAskByte}
                      onSkip={() => { setShowQuiz(false); if (nextModule) setTimeout(() => navigateTo(nextModule.id), 300) }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Bottom nav */}
            {!showQuiz && (
              <div className="shrink-0 border-t border-border bg-background px-6 py-4 flex items-center gap-4">
                <button onClick={() => prevModule && navigateTo(prevModule.id)} disabled={!prevModule}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-card-foreground disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-muted transition-all">
                  <ChevronLeft className="w-4 h-4" />Previous
                </button>
                <div className="flex-1 flex justify-center">
                  <button onClick={handleMarkComplete} disabled={isCompleted || markingComplete || !canMarkCompleteByTime}
                    className={cn('flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all',
                      isCompleted ? 'bg-green-100 text-green-700 cursor-default' : !canMarkCompleteByTime ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-primary hover:bg-primary/100 text-white shadow-md shadow-md'
                    )}>
                    <CheckCircle2 className="w-4 h-4" />
                    {isCompleted ? 'Completed' : markingComplete ? 'Saving...' : !canMarkCompleteByTime
                      ? `Spend at least ${Math.ceil(minTimeSecs / 60)} min here (${Math.floor(elapsedActiveSecs / 60)} min)`
                      : hasQuiz && !quizDoneForModule ? 'Complete & take quiz' : 'Mark complete'}
                  </button>
                </div>
                <button onClick={() => nextModule && navigateTo(nextModule.id)} disabled={!nextModule}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-card-foreground disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-muted transition-all">
                  Next<ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Sudar tutor panel */}
          {tutorOpen && (
            <div className="w-80 border-l border-border bg-muted flex flex-col shrink-0">
              <div className="px-4 py-3 border-b border-border bg-background flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm shadow-md">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-card-foreground">Sudar</p>
                  <p className="text-xs text-muted-foreground">Knows the full course + your history</p>
                </div>
                <button onClick={() => setTutorOpen(false)} className="ml-auto p-1.5 hover:bg-muted rounded-md transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.length === 0 && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-3 h-3 text-white" />
                      </div>
                      <div className="bg-card border border-border rounded-xl rounded-tl-sm px-3 py-2 text-xs text-card-foreground leading-relaxed">
                        {learnerName ? `Hi ${learnerName}! ` : 'Hi! '}I&apos;m Sudar. I know <span className="font-medium text-primary">{currentModule?.title}</span> and your full learning history. Ask me anything.
                        <br /><span className="text-muted-foreground text-[10px] mt-1 block">💡 Tip: highlight any text in the module to get quick explanations.</span>
                      </div>
                    </div>
                    <div className="space-y-1.5 pl-8">
                      {['Give me a quick summary', 'Explain this with an example', 'What are the key takeaways?', 'How does this connect to what I\'ve learned before?'].map((prompt) => (
                        <button key={prompt} onClick={() => { setInput(prompt); setTimeout(() => handleTutorSend(prompt), 50) }}
                          className="w-full text-left px-2.5 py-1.5 bg-card border border-border hover:border-primary/30 hover:bg-primary/10 text-muted-foreground hover:text-primary text-xs rounded-lg transition-all">
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div key={i} className={cn('flex items-start gap-2', msg.role === 'user' ? 'flex-row-reverse' : '')}>
                    {msg.role === 'assistant' && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div className={cn('max-w-[90%] px-3 py-2 rounded-xl text-xs leading-relaxed',
                      msg.role === 'user' ? 'bg-primary text-white rounded-tr-sm' : 'bg-card border border-border text-card-foreground rounded-tl-sm'
                    )}>
                      {msg.content}
                    </div>
                  </div>
                ))}

                {thinking && (
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                    <div className="bg-card border border-border rounded-xl rounded-tl-sm px-3 py-2.5">
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-3 border-t border-border bg-background">
                <div className="flex items-end gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleTutorSend() } }}
                    placeholder="Ask Sudar anything, or highlight text above..."
                    rows={1}
                    className="flex-1 bg-muted border border-border rounded-xl px-3 py-2 text-xs text-card-foreground placeholder-muted-foreground focus:outline-none focus:border-primary resize-none leading-relaxed"
                    style={{ maxHeight: '80px' }}
                  />
                  <button
                    id="byte-send-btn"
                    onClick={() => handleTutorSend()}
                    disabled={!input.trim() || thinking}
                    className="p-2 bg-primary hover:bg-primary/100 disabled:bg-muted disabled:cursor-not-allowed text-white rounded-xl transition-all shrink-0"
                  >
                    {thinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-center text-muted-foreground text-[10px] mt-1.5">Sudar knows the full course + your learning history</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
