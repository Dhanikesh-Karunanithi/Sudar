'use client'

import React, { useState, useEffect, useRef, useCallback, type ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight,
  BookOpen, List, X, Sparkles, Send, Loader2,
  ChevronDown, FileText, Video, Network,
  Layers, Zap, MessageSquarePlus, Code, Quote, Pin, PinOff, PanelLeftClose, Mic, Maximize2, Minimize2, Headphones
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { QuizCard } from './QuizCard'
import { FlashcardsCard, type FlashcardPair } from './FlashcardsCard'
import { CourseVideoCard } from './CourseVideoCard'
import { CoursePodcastCard } from './CoursePodcastCard'
import { MindMapCard, type MindMapNode } from './MindMapCard'
import { AudioCard } from './AudioCard'
import { RichModuleContent } from '@/components/learn/RichModuleContent'
import { ReadAlongControls } from '@/components/learn/ReadAlongControls'
import { CourseThemeProvider } from '@/components/learn/CourseThemeProvider'
import { GenerativeBlockRenderer } from '@/components/tutor/GenerativeBlockRenderer'
import { ChatMarkdown } from '@/components/tutor/ChatMarkdown'
import { isRichContent, isScormContent, type RichContent } from '@/types/content'
import type { TutorAction, TutorBlock } from '@/types/tutor'

// --- Types ------------------------------------------------------------------

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
  template?: string | null
  modules: Module[]
  settings?: {
    module_completion?: Record<string, { type: 'mark_button' | 'min_time'; min_time_secs?: number }>
    include_video?: boolean
    include_podcast?: boolean
    video_scenes?: Array<{ sceneNumber: number; title: string; narration: string; visuals?: string; duration?: number; audioDataURL?: string }>
    podcast_dialogue?: Array<{ speaker: 'host' | 'expert'; text: string; audioDataURL?: string }>
  } | null
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  /** When true, this message was sent with text selected on the page — Sudar used it as context */
  referencedSelection?: boolean
  confirmations?: { key: string; value: string; label: string }[]
  summary?: string
  actions?: TutorAction[]
  blocks?: TutorBlock[]
}

interface TutorQueryData {
  response?: string
  error?: string
  actions?: TutorAction[]
  blocks?: TutorBlock[]
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

// --- SCORM iframe viewer -----------------------------------------------------

interface ScormViewerProps {
  launchUrl: string
  courseId: string
  moduleId: string
  moduleTitle: string
  onComplete?: () => void
}

/** Convert a stored launch_url to a same-origin proxy URL.
 *  Handles both legacy full-URL imports and current storage-path imports. */
function scormProxyUrl(launchUrl: string): string {
  if (!launchUrl) return ''
  if (launchUrl.startsWith('/api/scorm/')) return launchUrl
  if (launchUrl.startsWith('http')) {
    const match = launchUrl.match(/\/course-media\/(.+)$/)
    if (match) return `/api/scorm/${match[1]}`
    return launchUrl
  }
  return `/api/scorm/${launchUrl}`
}

function ScormViewer({ launchUrl, courseId, moduleId, moduleTitle, onComplete }: ScormViewerProps) {
  const [scormStatus, setScormStatus] = React.useState<string | null>(null)
  const [scormScore, setScormScore] = React.useState<string | null>(null)
  const startTimeRef = React.useRef(Date.now())
  const completedRef = React.useRef(false)

  React.useEffect(() => {
    startTimeRef.current = Date.now()
    completedRef.current = false
    setScormStatus(null)
    setScormScore(null)
  }, [moduleId])

  React.useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const msg = event.data as {
        type?: string
        lesson_status?: string
        name?: string
        value?: string
        data?: Record<string, string>
      }
      if (!msg?.type) return

      if (msg.type === 'scorm_set_value') {
        const { name, value } = msg

        // Track status
        if (name === 'cmi.core.lesson_status' && value) {
          setScormStatus(value)
          // Fire a progress event so the adaptive engine sees the status
          fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event_type: 'scorm_progress',
              course_id: courseId,
              module_id: moduleId,
              payload: { cmi_key: name, cmi_value: value, module_title: moduleTitle },
            }),
          }).catch(() => {})

          if (value === 'completed' || value === 'passed') {
            if (!completedRef.current) {
              completedRef.current = true
              onComplete?.()
            }
          }
        }

        // Track score for Sudar's memory
        if (name === 'cmi.core.score.raw' && value) {
          setScormScore(value)
          fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event_type: 'scorm_progress',
              course_id: courseId,
              module_id: moduleId,
              payload: { cmi_key: name, cmi_value: value, module_title: moduleTitle },
            }),
          }).catch(() => {})
        }
      }

      if (msg.type === 'scorm_finish') {
        const status = msg.lesson_status ?? 'completed'
        const data = msg.data ?? {}
        setScormStatus(status)
        if (data['cmi.core.score.raw']) setScormScore(data['cmi.core.score.raw'])

        const sessionSecs = Math.round((Date.now() - startTimeRef.current) / 1000)

        // Fire a rich completion event — the intelligence engine reads this
        // to understand the learner's performance on SCORM content
        fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_type: 'module_complete',
            course_id: courseId,
            module_id: moduleId,
            modality: 'scorm',
            duration_secs: sessionSecs,
            payload: {
              module_title: moduleTitle,
              lesson_status: status,
              score_raw: data['cmi.core.score.raw'] ?? null,
              score_min: data['cmi.core.score.min'] ?? null,
              score_max: data['cmi.core.score.max'] ?? null,
              session_time: data['cmi.core.session_time'] ?? null,
              suspend_data: data['cmi.suspend_data'] ?? null,
            },
          }),
        }).catch(() => {})

        if (!completedRef.current && (status === 'completed' || status === 'passed' || status === 'failed')) {
          completedRef.current = true
          onComplete?.()
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [courseId, moduleId, moduleTitle, onComplete])

  const statusColor =
    scormStatus === 'completed' || scormStatus === 'passed' ? 'text-green-500' :
    scormStatus === 'failed' ? 'text-red-400' :
    scormStatus === 'incomplete' ? 'text-amber-400' : 'text-muted-foreground'

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Compact SCORM status bar */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-1.5 bg-muted/40 border-b border-border text-xs">
        <span className="text-muted-foreground">Interactive SCORM module</span>
        {scormStatus && (
          <span className={cn('flex items-center gap-1 font-medium', statusColor)}>
            <CheckCircle2 className="w-3 h-3" />
            {scormStatus}
          </span>
        )}
        {scormScore && (
          <span className="text-muted-foreground ml-auto">
            Score: <span className="font-medium text-card-foreground">{scormScore}</span>
          </span>
        )}
      </div>
      {/* Iframe fills the remaining height exactly */}
      <div className="flex-1 min-h-0 overflow-hidden bg-white">
        <iframe
          src={scormProxyUrl(launchUrl)}
          className="w-full h-full block"
          style={{ border: 'none' } }
          allow="fullscreen"
          title="SCORM content"
        />
      </div>
    </div>
  )
}

// --- Markdown renderer -------------------------------------------------------
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
        <blockquote key={nextKey()} className="my-4 border-l-4 border-primary/30 bg-primary/10 rounded-r-lg pl-4 pr-3 py-3 flex gap-3">
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

    // Markdown table (lines starting with |)
    if (trimmed.startsWith('|')) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim())
        i++
      }
      // Need at least a header + separator row
      if (tableLines.length >= 2) {
        const parseRow = (row: string) =>
          row.replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim())
        const isSeparator = (row: string) => /^\|[-:| ]+\|$/.test(row)

        const headerRow = tableLines[0]
        const sepIdx = tableLines.findIndex(isSeparator)
        if (sepIdx === 1) {
          const headers = parseRow(headerRow)
          const bodyRows = tableLines.slice(2)
          elements.push(
            <div key={nextKey()} className="my-4 overflow-x-auto rounded-xl border border-border shadow-sm">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-muted/70 border-b border-border">
                    {headers.map((h, hi) => (
                      <th key={hi} className="px-4 py-2.5 text-left text-xs font-semibold text-card-foreground uppercase tracking-wide whitespace-nowrap">
                        {parseInline(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bodyRows.map((row, ri) => (
                    <tr key={ri} className={ri % 2 === 0 ? 'bg-card' : 'bg-muted/30'}>
                      {parseRow(row).map((cell, ci) => (
                        <td key={ci} className="px-4 py-2.5 text-card-foreground border-b border-border/50 leading-relaxed align-top">
                          {parseInline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
          continue
        }
      }
      // Fallback: render each table line as a paragraph
      for (const tl of tableLines) {
        elements.push(
          <p key={nextKey()} className="text-card-foreground text-sm leading-relaxed my-3">
            {parseInline(tl)}
          </p>
        )
      }
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

// --- Main component -----------------------------------------------------------

export function CourseViewer({
  course,
  activeModuleId,
  completedModuleIds,
  enrollmentProgress,
  personalizedWelcome,
  learnerName,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
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
  const [mindmapByModule, setMindmapByModule] = useState<Record<string, MindMapNode>>({})
  const [mindmapLoading, setMindmapLoading] = useState(false)
  const [mindmapScope, setMindmapScope] = useState<'module' | 'course'>('module')
  const [mindmapCourse, setMindmapCourse] = useState<MindMapNode | null>(null)
  const [mindmapCourseLoading, setMindmapCourseLoading] = useState(false)
  const [listeningAudioByModule, setListeningAudioByModule] = useState<Record<string, string>>({})
  const [listeningUnavailableByModule, setListeningUnavailableByModule] = useState<Record<string, boolean>>({})
  const [listeningLoading, setListeningLoading] = useState(false)

  // Tutor state
  const [tutorOpen, setTutorOpen] = useState(false)
  const [tutorPanelExpanded, setTutorPanelExpanded] = useState(false)
  const [tutorPanelWidth, setTutorPanelWidth] = useState(384)
  const [tutorPanelResizing, setTutorPanelResizing] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [learnerContext, setLearnerContext] = useState<Record<string, unknown> | null>(null)
  const [contextPanelExpanded, setContextPanelExpanded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const prevCourseIdRef = useRef<string>(course.id)

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

  // -- Effects ----------------------------------------------------------
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
          modality: activeModality,
          duration_secs: totalSecs,
          payload: { active_secs: activeSecs, total_secs: totalSecs },
        }),
      }).catch(() => {})
    }, 30000)
    return () => {
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = null
    }
  }, [course.id, currentModuleId, activeModality])

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
    // Clear chat only when switching to a different course; keep thread when moving between sections
    if (prevCourseIdRef.current !== course.id) {
      prevCourseIdRef.current = course.id
      setMessages([])
      setMindmapCourse(null)
    }
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

  // Fetch mindmap when switching to mindmap modality (module scope)
  useEffect(() => {
    if (activeModality !== 'mindmap' || mindmapScope !== 'module' || !currentModuleId) return
    const body = getContentBodyForFlashcards(currentModule?.content ?? null)
    if (!body.trim() || mindmapByModule[currentModuleId]) return
    setMindmapLoading(true)
    fetch('/api/ai/generate-mindmap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scope: 'module',
        content: body,
        module_title: currentModule?.title ?? '',
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        const root = data?.root
        if (root && typeof root === 'object') {
          setMindmapByModule((prev) => ({ ...prev, [currentModuleId]: root as MindMapNode }))
        }
      })
      .catch(() => {})
      .finally(() => setMindmapLoading(false))
  }, [activeModality, mindmapScope, currentModuleId, currentModule?.content, currentModule?.title])

  // Fetch course mindmap when switching to mindmap modality (course scope)
  useEffect(() => {
    if (activeModality !== 'mindmap' || mindmapScope !== 'course' || mindmapCourse != null) return
    const modulesPayload = course.modules.map((m) => ({
      title: m.title,
      content: getContentBodyForFlashcards(m.content ?? null),
    })).filter((m) => m.content.trim().length > 0)
    if (modulesPayload.length === 0) return
    setMindmapCourseLoading(true)
    fetch('/api/ai/generate-mindmap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scope: 'course',
        course_title: course.title,
        modules: modulesPayload,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        const root = data?.root
        if (root && typeof root === 'object') {
          setMindmapCourse(root as MindMapNode)
        }
      })
      .catch(() => {})
      .finally(() => setMindmapCourseLoading(false))
  }, [activeModality, mindmapScope, mindmapCourse, course.id, course.title, course.modules])

  // Fetch audio for Listen modality when switching to listening and we don't have it for this module
  useEffect(() => {
    if (activeModality !== 'listening' || !currentModuleId) return
    const body = getContentBodyForFlashcards(currentModule?.content ?? null)
    if (!body.trim()) return
    if (listeningAudioByModule[currentModuleId] || listeningUnavailableByModule[currentModuleId]) return
    setListeningLoading(true)
    fetch('/api/ai/generate-audio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: body.slice(0, 15000) }),
    })
      .then(async (res) => {
        const contentType = (res.headers.get('content-type') || '').toLowerCase()
        if (contentType.includes('application/json')) {
          const data = await res.json()
          if (data.use_browser_tts) {
            setListeningUnavailableByModule((prev) => ({ ...prev, [currentModuleId]: true }))
            return
          }
          setListeningUnavailableByModule((prev) => ({ ...prev, [currentModuleId]: true }))
          return
        }
        return res.blob()
      })
      .then((blob) => {
        if (blob && blob instanceof Blob) {
          const url = URL.createObjectURL(blob)
          setListeningAudioByModule((prev) => ({ ...prev, [currentModuleId]: url }))
        }
      })
      .catch(() => setListeningUnavailableByModule((prev) => ({ ...prev, [currentModuleId]: true })))
      .finally(() => setListeningLoading(false))
  }, [activeModality, currentModuleId, currentModule?.content, listeningAudioByModule, listeningUnavailableByModule])

  // Fetch learner context when tutor panel opens (for "What Sudar knows" summary)
  useEffect(() => {
    if (!tutorOpen) return
    fetch('/api/tutor/memory')
      .then((r) => r.json())
      .then((data) => { if (data?.memory) setLearnerContext(data.memory as Record<string, unknown>) })
      .catch(() => {})
  }, [tutorOpen])

  // Drag-to-resize Sudar overlay panel
  useEffect(() => {
    if (!tutorPanelResizing) return
    const minW = 320
    const maxW = () => Math.min(720, Math.floor(window.innerWidth * 0.9))
    const onMove = (e: MouseEvent) => {
      const w = window.innerWidth - e.clientX
      setTutorPanelWidth(Math.min(maxW(), Math.max(minW, w)))
    }
    const onUp = () => setTutorPanelResizing(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [tutorPanelResizing])

  // Text selection handler — shared logic for both mouseup and contextmenu
  const showSelectionPopup = useCallback((clientX?: number, clientY?: number) => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      setSelectionPopup(null)
      return false
    }
    const text = selection.toString().trim()
    if (text.length < 5 || text.length > 500) { setSelectionPopup(null); return false }

    if (!contentRef.current) return false
    const range = selection.getRangeAt(0)
    const container = range.commonAncestorContainer
    if (!contentRef.current.contains(container)) { setSelectionPopup(null); return false }

    const rect = range.getBoundingClientRect()
    const estimatedHalfWidth = 340

    let x: number
    let y: number

    if (clientX !== undefined && clientY !== undefined) {
      // Right-click: position popup just above the cursor
      x = Math.max(estimatedHalfWidth + 8, Math.min(window.innerWidth - estimatedHalfWidth - 8, clientX))
      y = clientY - 8
    } else {
      // Left-click release: center over the selection
      const centerX = rect.left + rect.width / 2
      x = Math.max(estimatedHalfWidth + 8, Math.min(window.innerWidth - estimatedHalfWidth - 8, centerX))
      y = rect.top - 8
    }

    setSelectionPopup({ text, x, y })
    return true
  }, [])

  const handleSelection = useCallback(() => {
    showSelectionPopup()
  }, [showSelectionPopup])

  // Right-click on selected text: replace the browser context menu with the
  // Sudar popup so learners can instantly ask questions about what they selected.
  const handleContextMenu = useCallback((e: MouseEvent) => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed || !selection.toString().trim()) return
    if (!contentRef.current) return
    try {
      const range = selection.getRangeAt(0)
      if (!contentRef.current.contains(range.commonAncestorContainer)) return
    } catch { return }
    // We have a real text selection inside content — take over
    e.preventDefault()
    showSelectionPopup(e.clientX, e.clientY)
  }, [showSelectionPopup])

  useEffect(() => {
    document.addEventListener('mouseup', handleSelection)
    document.addEventListener('touchend', handleSelection)
    document.addEventListener('contextmenu', handleContextMenu)
    return () => {
      document.removeEventListener('mouseup', handleSelection)
      document.removeEventListener('touchend', handleSelection)
      document.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [handleSelection, handleContextMenu])

  // -- Handlers ---------------------------------------------------------
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
        modality: activeModality,
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

    // Capture selected content so Sudar can "read" what the learner is referring to
    const selectedFromPopup = selectionPopup?.text
    const selectedFromDoc =
      typeof window !== 'undefined'
        ? (() => {
            const s = window.getSelection()
            if (!s || s.isCollapsed) return null
            const t = s.toString().trim()
            return t.length >= 3 && t.length <= 8000 ? t : null
          })()
        : null
    const selectedText = selectedFromPopup ?? selectedFromDoc ?? undefined

    setInput('')
    setSelectionPopup(null)
    const newMessages: Message[] = [
      ...messages,
      { role: 'user', content: msg, referencedSelection: !!selectedText },
    ]
    setMessages(newMessages)
    setThinking(true)

    try {
      const res = await fetch('/api/tutor/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          course_id: course.id,
          module_id: currentModuleId,
          conversation_history: messages,
          route: pathname ?? undefined,
          selected_text: selectedText,
          active_modality: activeModality,
          available_modalities: {
            video: (course.settings?.video_scenes?.length ?? 0) > 0,
            podcast: (course.settings?.podcast_dialogue?.length ?? 0) > 0,
            mindmap_generated: !!mindmapByModule[currentModuleId],
          },
        }),
      })
      const text = await res.text()
      let data: TutorQueryData = {}
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
        actions: data.actions?.length ? data.actions : undefined,
        blocks: data.blocks,
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

  async function handleQuickAction(quickActionKey: string) {
    if (thinking) return
    setThinking(true)
    try {
      const res = await fetch('/api/tutor/validate-memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quick_action_key: quickActionKey }),
      })
      const data = await res.json()
      if (data.error || !data.confirmations?.length) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.error ?? 'Could not load options. Try again.' }])
        return
      }
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: data.summary ?? 'Save this preference?',
        confirmations: data.confirmations,
        summary: data.summary,
      }])
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Unable to reach Sudar. Please try again.' }])
    } finally {
      setThinking(false)
    }
  }

  async function handleConfirmation(messageIndex: number, key: string, value: string) {
    if (value === 'cancel') {
      setMessages((prev) => prev.map((m, i) => i === messageIndex && m.confirmations
        ? { ...m, content: 'Cancelled.', confirmations: undefined, summary: undefined }
        : m))
      return
    }
    try {
      const res = await fetch('/api/tutor/memory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      })
      if (!res.ok) {
        setMessages((prev) => prev.map((m, i) => i === messageIndex && m.confirmations
          ? { ...m, content: 'Failed to save. Try again.', confirmations: undefined, summary: undefined }
          : m))
        return
      }
      const successMessages: Record<string, string> = {
        one_line: "Got it, I'll keep answers to one line unless you ask for more.",
        detailed: "Got it, I'll give you detailed responses.",
        concise: "Got it, I'll keep answers concise.",
        reading: "Got it, I'll remember you prefer reading.",
        listening: "Got it, I'll remember you prefer listening.",
        video: "Got it, I'll remember you prefer video.",
        no_video: "Got it, I'll remember you didn't like this type of video.",
      }
      const successText = successMessages[value] ?? "Got it, I've saved that."
      setMessages((prev) => prev.map((m, i) => i === messageIndex && m.confirmations
        ? { ...m, content: successText, confirmations: undefined, summary: undefined }
        : m))
      setLearnerContext((prev) => (prev ? { ...prev, [key]: value } : { [key]: value }))
    } catch {
      setMessages((prev) => prev.map((m, i) => i === messageIndex && m.confirmations
        ? { ...m, content: 'Failed to save. Try again.', confirmations: undefined, summary: undefined }
        : m))
    }
  }

  const tutorPanelStyle = { width: tutorPanelWidth }

  return (
    <div className="flex bg-background overflow-hidden -mx-6 -mt-8 -mb-8 h-[calc(100vh-64px)]">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Selection popup — fires on text selection (mouseup) or right-click on selection */}
      {selectionPopup && (() => {
        const flipBelow = selectionPopup.y < 120
        const selectionPopupStyle = {
          left: selectionPopup.x,
          top: selectionPopup.y,
          transform: flipBelow ? 'translate(-50%, 8px)' : 'translate(-50%, -100%)',
          minWidth: '280px',
          maxWidth: '460px',
        }
        return (
          <div
            className="fixed z-[9999] bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
            style={selectionPopupStyle}
            onMouseDown={(e) => e.preventDefault()} // keep selection alive while clicking buttons
          >
            {/* Selected text preview */}
            <div className="px-3 pt-2.5 pb-1.5 border-b border-border/60 flex items-start gap-2">
              <img src="/sudar-chat-logo.png" className="w-3.5 h-3.5 mt-0.5 opacity-70 shrink-0" alt="Sudar" />
              <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2 italic">
                &ldquo;{selectionPopup.text.slice(0, 120)}{selectionPopup.text.length > 120 ? '…' : ''}&rdquo;
              </p>
            </div>
            {/* Action buttons */}
            <div className="p-1 flex flex-wrap gap-0.5">
              {[
                { label: 'Explain this', icon: '💡' },
                { label: 'Give me an example', icon: '🔍' },
                { label: 'Why does this matter?', icon: '🎯' },
                { label: 'Simplify this', icon: '✨' },
                { label: 'Summarise', icon: '📝' },
                { label: 'How does this connect to what I\'ve learned?', icon: '🔗' },
              ].map(({ label, icon }) => (
                <button
                  key={label}
                  onClick={() => sendToByteFromSelection(label)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-muted rounded-lg text-xs text-card-foreground font-medium transition-colors whitespace-nowrap"
                >
                  <span>{icon}</span>{label}
                </button>
              ))}
              <div className="w-full h-px bg-border/60 my-0.5" />
              <button
                onClick={() => {
                  const excerpt = selectionPopup.text.slice(0, 80) + (selectionPopup.text.length > 80 ? '…' : '')
                  setInput('About "' + excerpt + '": ')
                  setTutorOpen(true)
                  setSelectionPopup(null)
                } }
                className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-primary/10 rounded-lg text-xs text-primary font-medium transition-colors w-full"
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />Ask Sudar a custom question about this
              </button>
            </div>
          </div>
        )
      })()}

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
              <div className="bg-primary h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` } }
              />
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
          <span className="text-xs text-muted-foreground">{currentIndex + 1}{' / '}{modules.length}</span>
          <div className="h-4 w-px bg-muted" />
          <h1 className="text-sm font-semibold text-card-foreground truncate flex-1 min-w-0">{currentModule?.title}</h1>

          {/* Modality switcher — hidden for SCORM modules */}
          <div className={cn('hidden sm:flex items-center gap-0.5 bg-muted rounded-lg p-0.5 shrink-0', isScormContent(currentModule?.content) && '!hidden')}>
            {(() => {
              const hasVideo = (course.settings?.include_video ?? false) &&
                (course.settings?.video_scenes?.length ?? 0) > 0
              const hasPodcast = (course.settings?.include_podcast ?? false) &&
                (course.settings?.podcast_dialogue?.length ?? 0) > 0
              const modalities = [
                { id: 'text', icon: FileText, label: 'Read' },
                { id: 'listening', icon: Headphones, label: 'Listen' },
                { id: 'video', icon: Video, label: 'Watch', soon: !hasVideo },
                ...(hasPodcast ? [{ id: 'podcast', icon: Mic, label: 'Podcast', soon: false }] : []),
                { id: 'mindmap', icon: Network, label: 'Map' },
                { id: 'flashcards', icon: Layers, label: 'Cards' },
              ]
              return modalities.map(({ id, icon: Icon, label, soon }) => (
                <button key={id} onClick={() => !soon && setActiveModality(id)}
                  title={soon ? `${label} — coming soon` : label}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all',
                    soon ? 'opacity-40 cursor-not-allowed' : '',
                    activeModality === id && !soon ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-card-foreground'
                  )}>
                  <Icon className="w-3 h-3" />
                  <span className="hidden md:inline">{label}</span>
                </button>
              ))
            })()}
          </div>

          {isCompleted && (
            <div className="flex items-center gap-1.5 text-green-600 text-xs font-medium shrink-0">
              <CheckCircle2 className="w-4 h-4" />Completed
            </div>
          )}

          {/* Ask Sudar button */}
          <button onClick={() => { setTutorOpen(!tutorOpen); setSelectionPopup(null) } }
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0',
              tutorOpen ? 'bg-primary text-white shadow-md shadow-md' : 'bg-primary/5 text-primary hover:bg-primary/10 border border-primary/20'
            )}>
            <Sparkles className="w-3.5 h-3.5" />Ask Sudar
            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', tutorOpen && 'rotate-180')} />
          </button>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Module content + quiz — only flex child so it always uses full width */}
          <div className="flex flex-col min-h-0 overflow-hidden flex-1 min-w-0">

            {/* ── SCORM: full-height iframe — no scroll wrapper, no max-width ── */}
            {isScormContent(currentModule?.content) ? (
              <>
                <div className="flex-1 min-h-0 overflow-hidden">
                  <ScormViewer
                    launchUrl={currentModule.content.launch_url}
                    courseId={course.id}
                    moduleId={currentModuleId}
                    moduleTitle={currentModule.title}
                    onComplete={() => { if (!isCompleted) handleMarkComplete() } }
                  />
                </div>
                {/* Compact SCORM bottom bar: prev / completion status / next */}
                <div className="shrink-0 border-t border-border bg-background px-6 py-3 flex items-center gap-4">
                  <button onClick={() => prevModule && navigateTo(prevModule.id)} disabled={!prevModule}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-card-foreground disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-muted transition-all">
                    <ChevronLeft className="w-4 h-4" />Previous
                  </button>
                  <div className="flex-1 flex justify-center">
                    {isCompleted ? (
                      <div className="flex items-center gap-2 text-green-600 text-sm font-semibold">
                        <CheckCircle2 className="w-4 h-4" />Module completed
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Complete the SCORM activity to mark this module done</p>
                    )}
                  </div>
                  <button onClick={() => nextModule && navigateTo(nextModule.id)} disabled={!nextModule}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-card-foreground disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-muted transition-all">
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <>
            <div className="flex-1 overflow-y-auto relative bg-background text-foreground" onClick={() => selectionPopup && setSelectionPopup(null)}>
              <CourseThemeProvider template={course.template}>
              <div className={cn(
                'mx-auto px-6 py-8 space-y-10',
                activeModality === 'mindmap' ? 'max-w-6xl' :
                activeModality === 'video' || activeModality === 'podcast' ? 'max-w-full' :
                'max-w-2xl'
              )} ref={contentRef}>

                {/* Personalized welcome card */}
                {showWelcome && welcome?.message && (
                  <div className="relative bg-gradient-to-br from-primary/5 via-primary/5 to-background border border-primary/20 rounded-2xl p-6 shadow-sm shadow-sm">
                    <button onClick={() => setShowWelcome(false)}
                      className="absolute top-3 right-3 p-1.5 hover:bg-primary/10 rounded-lg transition-colors">
                      <X className="w-4 h-4 text-primary" />
                    </button>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-md shrink-0">
                        <img src="/sudar-chat-logo.png" className="w-5 h-5 object-contain brightness-0 invert" alt="Sudar" />
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

                {/* Read-along: button + follow-along transcript (server TTS); main content stays rich with media */}
                {activeModality !== 'video' &&
                  activeModality !== 'podcast' &&
                  activeModality !== 'mindmap' &&
                  activeModality !== 'flashcards' &&
                  activeModality !== 'listening' &&
                  currentModule && (
                  <ReadAlongControls
                    plainText={getContentBodyForFlashcards(currentModule.content ?? null)}
                    courseId={course.id}
                    moduleId={currentModuleId}
                    onReadAlongStart={() => {
                      fetch('/api/events', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          event_type: 'read_along_start',
                          course_id: course.id,
                          module_id: currentModuleId,
                          modality: 'reading',
                        }),
                      }).catch(() => {})
                    } }
                    onReadAlongComplete={(durationSecs) => {
                      fetch('/api/events', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          event_type: 'read_along_complete',
                          course_id: course.id,
                          module_id: currentModuleId,
                          modality: 'reading',
                          duration_secs: durationSecs,
                        }),
                      }).catch(() => {})
                    } }
                  />
                )}

                {/* Module content — text, rich, audio, video, podcast, mindmap, or flashcards */}
                {activeModality === 'video' ? (
                  (course.settings?.video_scenes?.length ?? 0) > 0 ? (
                    <CourseVideoCard scenes={course.settings!.video_scenes!} courseTitle={course.title} />
                  ) : (
                    <div className="max-w-xl mx-auto py-12 text-center space-y-3">
                      <Video className="w-10 h-10 text-muted-foreground mx-auto" />
                      <p className="text-sm text-muted-foreground">No video overview for this course.</p>
                      <p className="text-xs text-muted-foreground">Creators can add one in Sudar Studio.</p>
                    </div>
                  )
                ) : activeModality === 'podcast' ? (
                  (course.settings?.podcast_dialogue?.length ?? 0) > 0 ? (
                    <CoursePodcastCard dialogue={course.settings!.podcast_dialogue!} courseTitle={course.title} />
                  ) : (
                    <div className="max-w-xl mx-auto py-12 text-center space-y-3">
                      <Mic className="w-10 h-10 text-muted-foreground mx-auto" />
                      <p className="text-sm text-muted-foreground">No podcast for this course.</p>
                      <p className="text-xs text-muted-foreground">Creators can add one in Sudar Studio.</p>
                    </div>
                  )
                ) : activeModality === 'mindmap' ? (
                  <MindMapCard
                    scope={mindmapScope}
                    onScopeChange={setMindmapScope}
                    root={mindmapScope === 'course' ? mindmapCourse : (mindmapByModule[currentModuleId] ?? null)}
                    loading={mindmapScope === 'course' ? mindmapCourseLoading : mindmapLoading}
                    onRetry={() => {
                      if (mindmapScope === 'course') {
                        setMindmapCourse(null)
                        setMindmapCourseLoading(true)
                        const modulesPayload = course.modules.map((m) => ({
                          title: m.title,
                          content: getContentBodyForFlashcards(m.content ?? null),
                        })).filter((m) => m.content.trim().length > 0)
                        fetch('/api/ai/generate-mindmap', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            scope: 'course',
                            course_title: course.title,
                            modules: modulesPayload,
                          }),
                        })
                          .then((r) => r.json())
                          .then((data) => {
                            const root = data?.root
                            if (root && typeof root === 'object') {
                              setMindmapCourse(root as MindMapNode)
                            }
                          })
                          .finally(() => setMindmapCourseLoading(false))
                      } else {
                        setMindmapByModule((prev) => {
                          const next = { ...prev }
                          delete next[currentModuleId]
                          return next
                        })
                        setMindmapLoading(true)
                        const body = getContentBodyForFlashcards(currentModule?.content ?? null)
                        fetch('/api/ai/generate-mindmap', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            scope: 'module',
                            content: body,
                            module_title: currentModule?.title ?? '',
                          }),
                        })
                          .then((r) => r.json())
                          .then((data) => {
                            const root = data?.root
                            if (root && typeof root === 'object') {
                              setMindmapByModule((prev) => ({ ...prev, [currentModuleId]: root as MindMapNode }))
                            }
                          })
                          .finally(() => setMindmapLoading(false))
                      } } }
                  />
                ) : activeModality === 'flashcards' ? (
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
                    } }
                  />
                ) : activeModality === 'listening' ? (
                  <AudioCard
                    text={getContentBodyForFlashcards(currentModule?.content ?? null)}
                    moduleTitle={currentModule?.title ?? ''}
                    loading={listeningLoading}
                    audioUrl={listeningAudioByModule[currentModuleId] ?? null}
                    audioUnavailable={listeningUnavailableByModule[currentModuleId]}
                    onRetry={() => {
                      setListeningAudioByModule((prev) => {
                        const next = { ...prev }
                        delete next[currentModuleId]
                        return next
                      })
                      setListeningUnavailableByModule((prev) => {
                        const next = { ...prev }
                        delete next[currentModuleId]
                        return next
                      })
                      setListeningLoading(true)
                      const body = getContentBodyForFlashcards(currentModule?.content ?? null)
                      fetch('/api/ai/generate-audio', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text: body.slice(0, 15000) }),
                      })
                        .then(async (res) => {
                          const contentType = (res.headers.get('content-type') || '').toLowerCase()
                          if (contentType.includes('application/json')) {
                            const data = await res.json()
                            if (data.use_browser_tts) {
                              setListeningUnavailableByModule((prev) => ({ ...prev, [currentModuleId]: true }))
                              return
                            }
                            setListeningUnavailableByModule((prev) => ({ ...prev, [currentModuleId]: true }))
                            return
                          }
                          return res.blob()
                        })
                        .then((blob) => {
                          if (blob && blob instanceof Blob) {
                            const url = URL.createObjectURL(blob)
                            setListeningAudioByModule((prev) => ({ ...prev, [currentModuleId]: url }))
                          }
                        })
                        .catch(() => setListeningUnavailableByModule((prev) => ({ ...prev, [currentModuleId]: true })))
                        .finally(() => setListeningLoading(false))
                    } }
                  />
                ) : isRichContent(currentModule?.content) ? (
                  <RichModuleContent
                    content={currentModule.content}
                    renderMarkdown={renderMarkdown}
                    onExplain={(context) => {
                      setInput(context)
                      setTutorOpen(true)
                    } }
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
                      onSkip={() => { setShowQuiz(false); if (nextModule) setTimeout(() => navigateTo(nextModule.id), 300) } }
                    />
                  </div>
                )}
              </div>
              </CourseThemeProvider>
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
                  {'Next '}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
            </>
            )} {/* end non-SCORM branch */}

        {/* Sudar overlay — floats over content, does not push or resize the course area */}
        {tutorOpen && (
          <div
            className="fixed top-16 right-0 bottom-0 z-50 flex flex-col border-l border-border bg-muted shadow-2xl transition-[width] duration-200"
            style={tutorPanelStyle}
          >
            {/* Draggable resize handle on left edge */}
            <div
              role="separator"
              aria-orientation="vertical"
              aria-valuenow={tutorPanelWidth}
              onMouseDown={(e) => { e.preventDefault(); setTutorPanelResizing(true) } }
              className={cn(
                'absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/30 active:bg-primary/50 transition-colors z-10',
                tutorPanelResizing && 'bg-primary/50'
              )}
            />
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-background flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm shadow-md">
                  <img src="/sudar-chat-logo.png" className="w-4 h-4 object-contain brightness-0 invert" alt="Sudar" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-card-foreground">Sudar</p>
                  <p className="text-xs text-muted-foreground truncate">Knows the full course + your history</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTutorPanelExpanded((e) => !e)
                    setTutorPanelWidth((w) => (w >= 500 ? 384 : 560))
                  } }
                  className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-card-foreground"
                  aria-label={tutorPanelExpanded ? 'Collapse chat' : 'Expand chat'}
                  title={tutorPanelExpanded ? 'Collapse chat' : 'Expand chat for full engagement'}
                >
                  {tutorPanelExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button onClick={() => setTutorOpen(false)} className="p-1.5 hover:bg-muted rounded-md transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* What Sudar knows about you — collapsible (Apple-style) */}
              <div className="border-b border-border/80 bg-background">
                <button
                  type="button"
                  onClick={() => setContextPanelExpanded((e) => !e)}
                  className="w-full px-4 py-2.5 flex items-center justify-between gap-2 text-left text-xs text-muted-foreground hover:text-card-foreground hover:bg-muted/40 active:bg-muted/60 transition-colors rounded-none"
                >
                  <span className="font-medium">Your context</span>
                  <ChevronDown className={cn('w-4 h-4 shrink-0 text-muted-foreground/80 transition-transform duration-200 ease-out', contextPanelExpanded && 'rotate-180')} />
                </button>
                {contextPanelExpanded && learnerContext && (
                  <div className="px-4 pb-3 pt-0 space-y-2 text-xs text-muted-foreground">
                    {(learnerContext.self_reported_background as string)?.trim() && (
                      <p><span className="font-medium text-card-foreground">Background: </span>
                        {(learnerContext.self_reported_background as string).slice(0, 120)}
                        {(learnerContext.self_reported_background as string).length > 120 ? '…' : ''}
                      </p>
                    )}
                    {(learnerContext.learning_goals as string)?.trim() && (
                      <p><span className="font-medium text-card-foreground">Goals: </span>
                        {(learnerContext.learning_goals as string).slice(0, 120)}
                        {(learnerContext.learning_goals as string).length > 120 ? '…' : ''}
                      </p>
                    )}
                    {(learnerContext.preferred_explanation_style as string)?.trim() && (
                      <p><span className="font-medium text-card-foreground">Explanation style: </span>
                        {String(learnerContext.preferred_explanation_style).replace(/-/g, ' ')}
                      </p>
                    )}
                    {(learnerContext.preferred_response_length as string)?.trim() && (
                      <p><span className="font-medium text-card-foreground">Response length: </span>
                        {String(learnerContext.preferred_response_length)}
                      </p>
                    )}
                    {!learnerContext.self_reported_background && !learnerContext.learning_goals && !learnerContext.preferred_explanation_style && !learnerContext.preferred_response_length && (
                      <p className="italic">Nothing set yet. Use quick actions below or visit Sudar&apos;s Memory to add context.</p>
                    )}
                  </div>
                )}
                {contextPanelExpanded && !learnerContext && (
                  <div className="px-4 pb-3 pt-0 text-xs text-muted-foreground italic">Loading…</div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.length === 0 && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                        <img src="/sudar-chat-logo.png" className="w-3 h-3 object-contain brightness-0 invert" alt="Sudar" />
                      </div>
                      <div className="bg-card border border-border rounded-xl rounded-tl-sm px-3 py-2 text-xs text-card-foreground leading-relaxed">
                        {learnerName ? `Hi ${learnerName}! ` : 'Hi! '}I&apos;m Sudar. I know <span className="font-medium text-primary">{currentModule?.title}</span> and your full learning history. Ask me anything.
                        <br /><span className="text-muted-foreground text-[10px] mt-1 block">💡 Tip: highlight any text in the module to get quick explanations.</span>
                      </div>
                    </div>
                    <div className="space-y-1.5 pl-8">
                      {['Give me a quick summary', 'Explain this with an example', 'What are the key takeaways?', 'Quiz me on this module', 'How does this connect to what I\'ve learned before?'].map((prompt) => (
                        <button key={prompt} onClick={() => { setInput(prompt); setTimeout(() => handleTutorSend(prompt), 50) } }
                          className="w-full text-left px-2.5 py-1.5 bg-card border border-border hover:border-primary/30 hover:bg-primary/10 text-muted-foreground hover:text-primary text-xs rounded-lg transition-all">
                          {prompt}
                        </button>
                      ))}
                    </div>
                    <div className="pl-8 pt-1">
                      <p className="text-[10px] text-muted-foreground mb-1.5">Remember…</p>
                      <div className="flex flex-wrap gap-1">
                        {[
                          { key: 'one_line', label: 'One-line answers' },
                          { key: 'detailed', label: 'Detailed responses' },
                          { key: 'reading', label: 'I prefer reading' },
                          { key: 'listening', label: 'I prefer listening' },
                          { key: 'no_video', label: "Didn't like this video" },
                        ].map(({ key, label }) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => handleQuickAction(key)}
                            disabled={thinking}
                            className="px-2 py-1 bg-muted/80 hover:bg-primary/10 text-muted-foreground hover:text-primary text-[10px] rounded-md transition-colors disabled:opacity-50"
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div key={i} className={cn('flex items-start gap-2', msg.role === 'user' ? 'flex-row-reverse' : '')}>
                    {msg.role === 'assistant' && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                        <img src="/sudar-chat-logo.png" className="w-3 h-3 object-contain brightness-0 invert" alt="Sudar" />
                      </div>
                    )}
                    <div className={cn(
                      'rounded-xl leading-relaxed',
                      msg.role === 'user'
                        ? 'max-w-[88%] px-3 py-2 text-xs bg-primary text-white rounded-tr-sm'
                        // Assistant: wider, more padding, overflow for tables/rich content
                        : 'w-full px-3 py-2.5 text-[0.75rem] bg-card border border-border text-card-foreground rounded-tl-sm overflow-x-auto'
                    )}>
                      {msg.role === 'assistant' && msg.blocks?.length ? (
                        <GenerativeBlockRenderer
                          blocks={msg.blocks}
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
                          } }
                          onQuizRetry={() => handleTutorSend('Give me another quiz question')}
                        />
                      ) : (
                        <span className="contents block">
                      {msg.role === 'assistant' ? (
                        <ChatMarkdown text={msg.content} />
                      ) : (
                        <>
                          {msg.content}
                          {msg.referencedSelection && (
                            <div className="mt-1 text-[10px] text-primary/80 flex items-center gap-1 opacity-90">
                              <span>📎</span> Sudar used your selection as context
                            </div>
                          )}
                        </>
                      )}
                      {msg.role === 'assistant' && msg.confirmations && msg.confirmations.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {msg.confirmations.map((c) => (
                            <button
                              key={`${c.key}-${c.value}`}
                              type="button"
                              onClick={() => handleConfirmation(i, c.key, c.value)}
                              className={cn(
                                'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                                c.value === 'cancel'
                                  ? 'bg-muted text-muted-foreground hover:bg-muted/80'
                                  : 'bg-primary/20 text-primary hover:bg-primary/30'
                              )}
                            >
                              {c.label}
                            </button>
                          ))}
                        </div>
                      )}
                      {msg.role === 'assistant' && msg.actions && msg.actions.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {msg.actions.map((action, aIdx) => (
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
                              } }
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
                            >
                              {action.label}
                            </Link>
                          ))}
                        </div>
                      )}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {thinking && (
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <img src="/sudar-chat-logo.png" className="w-3 h-3 object-contain brightness-0 invert" alt="Sudar" />
                    </div>
                    <div className="bg-card border border-border rounded-xl rounded-tl-sm px-3 py-2.5">
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i * 0.15}s` } }
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-3 border-t border-border bg-background">
                {(messages.length > 0 || thinking) && (
                  <div className="mb-2">
                    <p className="text-[10px] text-muted-foreground mb-1">Remember…</p>
                    <div className="flex flex-wrap gap-1">
                      {[
                        { key: 'one_line', label: 'One-line' },
                        { key: 'detailed', label: 'Detailed' },
                        { key: 'reading', label: 'Reading' },
                        { key: 'listening', label: 'Listening' },
                        { key: 'no_video', label: "No video" },
                      ].map(({ key, label }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleQuickAction(key)}
                          disabled={thinking}
                          className="px-2 py-1 bg-muted/80 hover:bg-primary/10 text-muted-foreground hover:text-primary text-[10px] rounded-md transition-colors disabled:opacity-50"
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-end gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleTutorSend() } } }
                    placeholder="Ask Sudar anything, or highlight text above..."
                    rows={1}
                    className="flex-1 bg-muted border border-border rounded-xl px-3 py-2 text-xs text-card-foreground placeholder-muted-foreground focus:outline-none focus:border-primary resize-none leading-relaxed"
                    style={{ maxHeight: '80px' } }
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
            </div>
          )}
        {/* end tutor overlay */}
        </div>
      </div>
    </div>
    </div>
  )
}
