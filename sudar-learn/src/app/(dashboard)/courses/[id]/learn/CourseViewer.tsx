'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight,
  List, X, Send, Loader2,
  ChevronDown, FileText, Video, Network,
  Layers, Zap, MessageSquarePlus, Pin, PinOff, PanelLeftClose, Mic, Maximize2, Minimize2, Headphones, Phone
} from 'lucide-react'
import { cn, stripTutorModelArtifactsFromText } from '@/lib/utils'
import { renderCourseMarkdown } from '@/lib/courseBodyMarkdown'
import { QuizCard } from './QuizCard'
import { FlashcardsCard, type FlashcardPair } from './FlashcardsCard'
import { CourseVideoCard } from './CourseVideoCard'
import { CoursePodcastCard } from './CoursePodcastCard'
import { MindMapCard, type MindMapNode } from './MindMapCard'
import { AudioCard } from './AudioCard'
import { SudarVidCard } from './SudarVidCard'
import { RichModuleContent } from '@/components/learn/RichModuleContent'
import { ReadAlongControls } from '@/components/learn/ReadAlongControls'
import { CourseThemeProvider } from '@/components/learn/CourseThemeProvider'
import { ThemeRenderer } from '@/components/learn/ThemeRenderer'
import type { ThemeSlug } from '@/types/contentThemes'
import { SudarLogoMark } from '@/components/branding/SudarLogo'
import { GenerativeBlockRenderer } from '@/components/tutor/GenerativeBlockRenderer'
import { ChatMarkdown } from '@/components/tutor/ChatMarkdown'
import { isRichContent, isScormContent, type ModuleContent } from '@/types/content'
import { postLearningEvent } from '@/lib/learn/postLearningEvent'
import type { ProactivePromptChoice, TutorAction, TutorBlock, TutorQueryResponse } from '@/types/tutor'
import { ProactiveSudarChoiceChips } from '@/components/tutor/ProactiveSudarChoiceChips'
import { idleNudgeFallbackChoices } from '@/lib/tutor/proactiveTemplates'
import { InactiveHibernationOverlay } from '@/components/features/activity/InactiveHibernationOverlay'
import { useInactivityHibernation, type ActivityTrackingState } from '@/components/features/activity/useInactivityHibernation'
import { parseTutorQueryHttpResponse } from '@/lib/tutor/responseContract'
import { inferContentIntentFromModality } from '@/lib/learner/modalityContentIntent'
import type { ResolvedLearnerPreferences } from '@/lib/learner/learnerPreferences'
import { useNotificationSound } from '@/components/features/notifications/NotificationSoundProvider'
import { EarlyAccessFeedbackPanel } from '@/components/feedback/EarlyAccessFeedbackPanel'

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
  content: ModuleContent | null
  order_index: number
  quiz?: { questions: QuizQuestion[] } | null
  sim_scenario_id?: string | null
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
    content_theme?: string
    brand_colors?: { primary?: string; accent?: string; secondary?: string }
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

interface PersonalizedWelcome {
  message: string
  first_name: string
  course_title: string
  prior_courses: number
  relevant_concepts: string[]
}

/** Per-module AI overlays from enrollments.personalization_overlays (see /api/ai/module-personalize). */
export type ModulePersonalizationOverlay = {
  role_explanation?: string
  brief_3min?: string
  updated_at?: string
  personalization_signals_used?: unknown
}

type PersonalizationAccessSerialized = {
  courseWelcome: { allowed: boolean; reason?: string }
  moduleRoleExplain: { allowed: boolean; reason?: string }
  moduleBrief: { allowed: boolean; reason?: string }
  orgRequiresConsent: boolean
  hasConsent: boolean
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
  enrollmentId?: string
  personalizeOffered?: boolean
  personalizationAccess?: PersonalizationAccessSerialized
  personalizationOverlays?: Record<string, ModulePersonalizationOverlay> | null
  simScenarioStatusById?: Record<string, 'draft' | 'published'>
  isOrgCreator?: boolean
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
    <div className="relative flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-[#0d0d0f]">
      {(scormStatus || scormScore) && (
        <div className="pointer-events-none absolute right-3 top-2 z-10 flex items-center gap-2 rounded-md bg-black/55 px-2 py-1 text-[10px] text-zinc-200 backdrop-blur-sm">
          {scormStatus && (
            <span className={cn('font-medium capitalize', statusColor)}>{scormStatus}</span>
          )}
          {scormScore && <span>Score {scormScore}</span>}
        </div>
      )}
      <iframe
        src={scormProxyUrl(launchUrl)}
        className="absolute inset-0 h-full w-full border-0"
        allow="fullscreen"
        title="SCORM content"
      />
    </div>
  )
}

// --- Main component -----------------------------------------------------------

const DEFAULT_PERSONALIZATION_ACCESS: PersonalizationAccessSerialized = {
  courseWelcome: { allowed: false },
  moduleRoleExplain: { allowed: false },
  moduleBrief: { allowed: false },
  orgRequiresConsent: false,
  hasConsent: true,
}

export function CourseViewer({
  course,
  activeModuleId,
  completedModuleIds,
  enrollmentProgress,
  personalizedWelcome,
  learnerName,
  enrollmentId = '',
  personalizeOffered = false,
  personalizationAccess = DEFAULT_PERSONALIZATION_ACCESS,
  personalizationOverlays = null,
  simScenarioStatusById = {},
  isOrgCreator = false,
}: Props) {
  const { playChime } = useNotificationSound()
  const router = useRouter()
  const pathname = usePathname()
  const [currentModuleId, setCurrentModuleId] = useState(activeModuleId)
  const [completed, setCompleted] = useState(new Set(completedModuleIds))
  const [progress, setProgress] = useState(enrollmentProgress)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const SIDEBAR_STORAGE_KEY = 'sudar-learn-course-sidebar'
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarPinned, setSidebarPinned] = useState(true)
  const scormSidebarPrefApplied = useRef(false)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SIDEBAR_STORAGE_KEY)
      const parsed = raw ? JSON.parse(raw) : {}
      setSidebarCollapsed(!!parsed.collapsed)
      setSidebarPinned(parsed.pinned !== false)
    } catch {}
  }, [])
  // SCORM IDE shells need horizontal room (Explorer + Editor + Agent). Collapse module list once.
  useEffect(() => {
    if (scormSidebarPrefApplied.current) return
    const mod = course.modules.find((m) => m.id === currentModuleId)
    if (mod && isScormContent(mod.content as ModuleContent | null | undefined)) {
      scormSidebarPrefApplied.current = true
      setSidebarCollapsed(true)
    }
  }, [course.modules, currentModuleId])
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
  const trackingStateRef = useRef<ActivityTrackingState>('active')
  const warningElapsedSecsRef = useRef(0)
  const inactivityCountRef = useRef(0)
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Welcome card
  const [showWelcome, setShowWelcome] = useState(!!personalizedWelcome?.message)
  const welcome = personalizedWelcome as PersonalizedWelcome | null
  const [welcomePersonalizing, setWelcomePersonalizing] = useState(false)
  const [modulePersonalizeMode, setModulePersonalizeMode] = useState<'role_explain' | 'brief_3min' | null>(null)

  const moduleOverlay = personalizationOverlays?.[currentModuleId]
  const personalizationBlocked =
    personalizationAccess.orgRequiresConsent && !personalizationAccess.hasConsent

  // Quiz state
  const [showQuiz, setShowQuiz] = useState(false)
  const [quizCompletedModules, setQuizCompletedModules] = useState<Set<string>>(new Set())
  // Modality
  const [activeModality, setActiveModality] = useState<string>('text')

  const getLiveActiveSecs = useCallback(() => {
    const now = Date.now()
    const activeMs =
      activeMsRef.current +
      (isVisibleRef.current && trackingStateRef.current === 'active'
        ? now - lastVisibleAtRef.current
        : 0)
    return Math.max(0, Math.round(activeMs / 1000))
  }, [])

  const pauseActiveClock = useCallback(() => {
    const now = Date.now()
    if (isVisibleRef.current && trackingStateRef.current === 'active') {
      activeMsRef.current += Math.max(0, now - lastVisibleAtRef.current)
    }
    lastVisibleAtRef.current = now
  }, [])

  const resumeActiveClock = useCallback(() => {
    lastVisibleAtRef.current = Date.now()
  }, [])

  const recordInactivityEvent = useCallback(
    (eventType: string, payload: Record<string, unknown> = {}) => {
      postLearningEvent({
        event_type: eventType,
        course_id: course.id,
        module_id: currentModuleId,
        modality: activeModality,
        payload: {
          tracking_state: trackingStateRef.current,
          inactivity_count: inactivityCountRef.current,
          warning_secs_elapsed: warningElapsedSecsRef.current,
          ...payload,
        },
      })
    },
    [activeModality, course.id, currentModuleId]
  )

  const {
    trackingState,
    warningRemainingSecs,
    warningElapsedSecs,
    inactivityCount,
    markInteraction,
  } = useInactivityHibernation({
    warningAfterMs: 4.5 * 60 * 1000,
    hibernateAfterMs: 4.5 * 60 * 1000,
    onWarningStart: () => {
      pauseActiveClock()
      recordInactivityEvent('inactivity_warning_started')
    },
    onWarningCancel: () => {
      resumeActiveClock()
      recordInactivityEvent('inactivity_warning_cancelled')
    },
    onHibernate: () => {
      pauseActiveClock()
      recordInactivityEvent('inactivity_hibernated')
    },
    onResume: ({ fromState }) => {
      resumeActiveClock()
      recordInactivityEvent('inactivity_resumed', { from_state: fromState })
    },
  })

  useEffect(() => {
    trackingStateRef.current = trackingState
  }, [trackingState])

  useEffect(() => {
    warningElapsedSecsRef.current = warningElapsedSecs
  }, [warningElapsedSecs])

  useEffect(() => {
    inactivityCountRef.current = inactivityCount
  }, [inactivityCount])

  const lessonTelemetryRef = useRef({
    courseId: course.id,
    moduleId: currentModuleId,
    modality: 'text',
    moduleComplete: false,
  })
  const prevModalityForSwitchRef = useRef<string | null>(null)
  const modalitySwitchReadyRef = useRef(false)
  const [flashcardsByModule, setFlashcardsByModule] = useState<Record<string, FlashcardPair[]>>({})
  const [flashcardsLoading, setFlashcardsLoading] = useState(false)
  const [mindmapByModule, setMindmapByModule] = useState<Record<string, MindMapNode | null>>({})
  const [mindmapLoading, setMindmapLoading] = useState(false)
  const [mindmapScope, setMindmapScope] = useState<'module' | 'course'>('module')
  const [mindmapCourse, setMindmapCourse] = useState<MindMapNode | null>(null)
  const [mindmapCourseLoading, setMindmapCourseLoading] = useState(false)
  const [modulePayloads, setModulePayloads] = useState<
    Record<string, { content: Module['content']; quiz: Module['quiz'] }>
  >(() => {
    const seed: Record<string, { content: Module['content']; quiz: Module['quiz'] }> = {}
    for (const m of course.modules) {
      if (m.content != null || m.quiz != null) {
        seed[m.id] = { content: m.content, quiz: m.quiz ?? null }
      }
    }
    return seed
  })
  const [moduleLoadingId, setModuleLoadingId] = useState<string | null>(null)
  const modulePayloadsRef = useRef(modulePayloads)
  modulePayloadsRef.current = modulePayloads
  const [courseMedia, setCourseMedia] = useState<{
    video_scenes?: NonNullable<Course['settings']>['video_scenes']
    podcast_dialogue?: NonNullable<Course['settings']>['podcast_dialogue']
  } | null>(null)
  const [courseMediaLoading, setCourseMediaLoading] = useState(false)
  const [listeningAudioByModule, setListeningAudioByModule] = useState<Record<string, string>>({})
  const [listeningUnavailableByModule, setListeningUnavailableByModule] = useState<Record<string, boolean>>({})
  const [listeningLoading, setListeningLoading] = useState(false)

  useEffect(() => {
    lessonTelemetryRef.current = {
      courseId: course.id,
      moduleId: currentModuleId,
      modality: activeModality,
      moduleComplete: completed.has(currentModuleId),
    }
  }, [course.id, currentModuleId, activeModality, completed])

  // Tutor state
  const [tutorOpen, setTutorOpen] = useState(false)
  const [feedbackMode, setFeedbackMode] = useState(false)
  const [tutorPanelExpanded, setTutorPanelExpanded] = useState(false)
  const [tutorPanelWidth, setTutorPanelWidth] = useState(384)
  const [tutorPanelResizing, setTutorPanelResizing] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [proactiveBanner, setProactiveBanner] = useState<{
    message: string
    choices: ProactivePromptChoice[]
    trigger: string
  } | null>(null)
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [learnerContext, setLearnerContext] = useState<Record<string, unknown> | null>(null)
  const [contextPanelExpanded, setContextPanelExpanded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const prevCourseIdRef = useRef<string>(course.id)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastProactiveNudgeAtRef = useRef(0)
  const [learnerPrefs, setLearnerPrefs] = useState<ResolvedLearnerPreferences | null>(null)
  const learnerPrefsRef = useRef<ResolvedLearnerPreferences | null>(null)
  const [moduleBridgeText, setModuleBridgeText] = useState<string | null>(null)

  // Text selection popup
  const [selectionPopup, setSelectionPopup] = useState<SelectionPopup | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    learnerPrefsRef.current = learnerPrefs
  }, [learnerPrefs])

  useEffect(() => {
    void fetch('/api/learner/preferences')
      .then((r) => r.json())
      .then((d: { preferences?: ResolvedLearnerPreferences }) => {
        if (d.preferences) setLearnerPrefs(d.preferences)
      })
      .catch(() => {})
  }, [])

  const loadModuleContent = useCallback(async (moduleId: string) => {
    if (modulePayloadsRef.current[moduleId]) return
    setModuleLoadingId(moduleId)
    try {
      const res = await fetch(
        `/api/learn/course-module?course_id=${encodeURIComponent(course.id)}&module_id=${encodeURIComponent(moduleId)}`
      )
      if (!res.ok) return
      const data = (await res.json()) as { content?: Module['content']; quiz?: Module['quiz'] }
      setModulePayloads((prev) => ({
        ...prev,
        [moduleId]: { content: data.content ?? null, quiz: data.quiz ?? null },
      }))
    } finally {
      setModuleLoadingId((id) => (id === moduleId ? null : id))
    }
  }, [course.id])

  useEffect(() => {
    if (!currentModuleId) return
    const seeded = course.modules.find((m) => m.id === currentModuleId)
    if (seeded?.content != null || modulePayloadsRef.current[currentModuleId]) return
    void loadModuleContent(currentModuleId)
  }, [currentModuleId, course.modules, loadModuleContent])

  useEffect(() => {
    if (courseMedia || courseMediaLoading) return
    if (activeModality !== 'video' && activeModality !== 'podcast') return
    const needsVideo = activeModality === 'video' && (course.settings?.video_scenes?.length ?? 0) > 0
    const needsPodcast = activeModality === 'podcast' && (course.settings?.podcast_dialogue?.length ?? 0) > 0
    if (!needsVideo && !needsPodcast) return
    setCourseMediaLoading(true)
    void fetch(`/api/learn/course-media?course_id=${encodeURIComponent(course.id)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setCourseMedia(data as NonNullable<typeof courseMedia>)
      })
      .finally(() => setCourseMediaLoading(false))
  }, [activeModality, course.id, course.settings, courseMedia, courseMediaLoading])

  useEffect(() => {
    setModuleBridgeText(null)
    if (!course.id || !currentModuleId) return
    let cancelled = false
    void fetch(
      `/api/learn/module-bridge?course_id=${encodeURIComponent(course.id)}&module_id=${encodeURIComponent(currentModuleId)}`
    )
      .then((r) => r.json())
      .then((data: { show?: boolean; body?: string }) => {
        if (cancelled || !data.show || !data.body) return
        setModuleBridgeText(data.body)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [course.id, currentModuleId])

  const modules = course.modules.map((m) => {
    const loaded = modulePayloads[m.id]
    return loaded ? { ...m, content: loaded.content, quiz: loaded.quiz } : m
  })
  const currentModule = modules.find((m) => m.id === currentModuleId) ?? modules[0]
  const isLoadingModuleContent = moduleLoadingId === currentModuleId
  const videoScenes = courseMedia?.video_scenes ?? course.settings?.video_scenes
  const podcastDialogue = courseMedia?.podcast_dialogue ?? course.settings?.podcast_dialogue
  const currentModuleTitleRaw = modules.find((m) => m.id === currentModuleId)?.title ?? 'Module'
  const currentModuleTitle =
    currentModuleTitleRaw.toLowerCase().startsWith(`${course.title.toLowerCase()}:`)
      ? currentModuleTitleRaw.slice(course.title.length + 1).trim()
      : currentModuleTitleRaw
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

  const handlePersonalizeWelcome = useCallback(async () => {
    if (!enrollmentId) return
    setWelcomePersonalizing(true)
    try {
      const res = await fetch('/api/ai/enroll-bridge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollment_id: enrollmentId, course_id: course.id }),
      })
      if (res.ok) router.refresh()
    } finally {
      setWelcomePersonalizing(false)
    }
  }, [enrollmentId, course.id, router])

  const resetIdleProactiveTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    const p = learnerPrefsRef.current
    if (
      p &&
      (!p.proactive_nudges_enabled || !p.idle_nudges || !p.stuck_detection_nudges)
    ) {
      return
    }
    idleTimerRef.current = setTimeout(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
      if (tutorOpen) return
      if (Date.now() - lastProactiveNudgeAtRef.current < 120000) return
      fetch('/api/tutor/proactive-nudge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: course.id,
          module_id: currentModuleId,
          reason: 'idle_90s',
        }),
      })
        .then(async (r) => {
          const data = (await r.json().catch(() => ({}))) as {
            message?: string
            choices?: ProactivePromptChoice[]
            ok?: boolean
          }
          if (r.ok && data.message) {
            lastProactiveNudgeAtRef.current = Date.now()
            setProactiveBanner({
              message: data.message,
              choices: data.choices?.length ? data.choices : idleNudgeFallbackChoices(),
              trigger: 'idle_90s',
            })
          }
        })
        .catch(() => {})
    }, 90000)
  }, [tutorOpen, course.id, currentModuleId, learnerPrefs])

  const runModulePersonalize = useCallback(
    async (mode: 'role_explain' | 'brief_3min') => {
      if (!enrollmentId) return
      setModulePersonalizeMode(mode)
      try {
        const res = await fetch('/api/ai/module-personalize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            enrollment_id: enrollmentId,
            course_id: course.id,
            module_id: currentModuleId,
            mode,
          }),
        })
        if (res.ok) router.refresh()
      } finally {
        setModulePersonalizeMode(null)
      }
    },
    [enrollmentId, course.id, currentModuleId, router]
  )

  const showModulePersonalization =
    !isScormContent(currentModule?.content)
    && activeModality !== 'video'
    && activeModality !== 'podcast'
    && activeModality !== 'mindmap'
    && activeModality !== 'flashcards'

  // -- Effects ----------------------------------------------------------
  // Visibility: only count time as "active" when tab is visible
  useEffect(() => {
    function handleVisibility() {
      const now = Date.now()
      if (document.visibilityState === 'visible') {
        lastVisibleAtRef.current = now
        isVisibleRef.current = true
      } else {
        if (isVisibleRef.current && trackingStateRef.current === 'active') {
          activeMsRef.current += now - lastVisibleAtRef.current
        }
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
      const activeSecs = getLiveActiveSecs()
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
          payload: {
            active_secs: activeSecs,
            total_secs: totalSecs,
            tracking_state: trackingStateRef.current,
            inactivity_count: inactivityCountRef.current,
            warning_secs_elapsed: warningElapsedSecsRef.current,
          },
        }),
      }).catch(() => {})
    }, 30000)
    return () => {
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = null
    }
  }, [activeModality, course.id, currentModuleId, getLiveActiveSecs])

  useEffect(() => {
    if (!modalitySwitchReadyRef.current) {
      modalitySwitchReadyRef.current = true
      prevModalityForSwitchRef.current = activeModality
      return
    }
    const prev = prevModalityForSwitchRef.current
    if (prev === activeModality) return
    prevModalityForSwitchRef.current = activeModality
    postLearningEvent({
      event_type: 'modality_switch',
      course_id: course.id,
      module_id: currentModuleId,
      modality: activeModality,
      payload: {
        from_modality: prev,
        to_modality: activeModality,
        content_intent: inferContentIntentFromModality(activeModality),
      },
    })
  }, [activeModality, course.id, currentModuleId])

  useEffect(() => {
    const onPageHide = () => {
      const ctx = lessonTelemetryRef.current
      const totalSecs = Math.round((Date.now() - startTimeRef.current) / 1000)
      const activeSecs = getLiveActiveSecs()
      postLearningEvent(
        {
          event_type: 'session_end',
          course_id: ctx.courseId,
          module_id: ctx.moduleId,
          modality: ctx.modality,
          duration_secs: totalSecs,
          payload: {
            active_secs: activeSecs,
            reason: 'pagehide',
            tracking_state: trackingStateRef.current,
            inactivity_count: inactivityCountRef.current,
            warning_secs_elapsed: warningElapsedSecsRef.current,
          },
        },
        { keepalive: true }
      )
      if (!ctx.moduleComplete && totalSecs >= 30) {
        postLearningEvent(
          {
            event_type: 'drop_off',
            course_id: ctx.courseId,
            module_id: ctx.moduleId,
            modality: ctx.modality,
            duration_secs: totalSecs,
            payload: {
              active_secs: activeSecs,
              completed: false,
              tracking_state: trackingStateRef.current,
              inactivity_count: inactivityCountRef.current,
              warning_secs_elapsed: warningElapsedSecsRef.current,
            },
          },
          { keepalive: true }
        )
      }
    }
    window.addEventListener('pagehide', onPageHide)
    return () => window.removeEventListener('pagehide', onPageHide)
  }, [getLiveActiveSecs])

  useEffect(() => {
    resetIdleProactiveTimer()
    const onAct = () => resetIdleProactiveTimer()
    window.addEventListener('keydown', onAct)
    window.addEventListener('pointerdown', onAct)
    window.addEventListener('scroll', onAct, true)
    document.addEventListener('visibilitychange', onAct)
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
      window.removeEventListener('keydown', onAct)
      window.removeEventListener('pointerdown', onAct)
      window.removeEventListener('scroll', onAct, true)
      document.removeEventListener('visibilitychange', onAct)
    }
  }, [resetIdleProactiveTimer])

  useEffect(() => {
    setProactiveBanner(null)
  }, [currentModuleId, course.id])

  useEffect(() => {
    startTimeRef.current = Date.now()
    activeMsRef.current = 0
    lastVisibleAtRef.current = Date.now()
    isVisibleRef.current = typeof document !== 'undefined' ? document.visibilityState === 'visible' : true
    trackingStateRef.current = 'active'
    warningElapsedSecsRef.current = 0
    inactivityCountRef.current = 0
    setElapsedActiveSecs(0)
    setShowQuiz(false)
    fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'module_start',
        course_id: course.id,
        module_id: currentModuleId,
        modality: 'text',
        payload: {
          tracking_state: 'active',
          inactivity_count: 0,
          warning_secs_elapsed: 0,
        },
      }),
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
      setElapsedActiveSecs(getLiveActiveSecs())
    }, 2000)
    return () => clearInterval(interval)
  }, [currentModuleId, getLiveActiveSecs, minTimeSecs])

  // Fetch flashcards when switching to flashcards modality and we don't have cards for this module
  useEffect(() => {
    if (activeModality !== 'flashcards' || !currentModuleId) return
    if (flashcardsByModule[currentModuleId]) return
    const contentBody = getContentBodyForFlashcards(currentModule?.content ?? null)
    if (!contentBody.trim()) return
    setFlashcardsLoading(true)
    fetch('/api/ai/generate-flashcards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: contentBody,
        module_title: currentModule.title,
      }),
    })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}))
        return { ok: r.ok, data }
      })
      .then((data) => {
        const cards = Array.isArray(data.data?.cards) ? data.data.cards : []
        setFlashcardsByModule((prev) => ({ ...prev, [currentModuleId]: cards }))
        if (data.ok && cards.length > 0) playChime('task_complete')
      })
      .catch(() => setFlashcardsByModule((prev) => ({ ...prev, [currentModuleId]: [] })))
      .finally(() => setFlashcardsLoading(false))
  }, [activeModality, currentModuleId, currentModule?.content, currentModule?.title, playChime])

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
        if (root && typeof root === 'object' && Array.isArray((root as { children?: unknown }).children) && (root as { children: unknown[] }).children.length > 0) {
          setMindmapByModule((prev) => ({ ...prev, [currentModuleId]: root as MindMapNode }))
          playChime('task_complete')
        } else {
          setMindmapByModule((prev) => ({ ...prev, [currentModuleId]: null }))
        }
      })
      .catch(() => {})
      .finally(() => setMindmapLoading(false))
  }, [activeModality, mindmapScope, currentModuleId, currentModule?.content, currentModule?.title, playChime])

  // Fetch course mindmap when switching to mindmap modality (course scope)
  useEffect(() => {
    if (activeModality !== 'mindmap' || mindmapScope !== 'course' || mindmapCourse != null) return
    setMindmapCourseLoading(true)
    void fetch(`/api/learn/course-module-bodies?course_id=${encodeURIComponent(course.id)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((bodyData: { modules?: Array<{ title: string; content: string }> } | null) => {
        const modulesPayload = (bodyData?.modules ?? []).filter((m) => m.content.trim().length > 0)
        if (modulesPayload.length === 0) return null
        return fetch('/api/ai/generate-mindmap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scope: 'course',
            course_title: course.title,
            modules: modulesPayload,
          }),
        })
      })
      .then((res) => (res ? res.json() : null))
      .then((data) => {
        const root = data?.root
        if (root && typeof root === 'object' && Array.isArray((root as { children?: unknown }).children) && (root as { children: unknown[] }).children.length > 0) {
          setMindmapCourse(root as MindMapNode)
          playChime('task_complete')
        } else {
          setMindmapCourse(null)
        }
      })
      .catch(() => {})
      .finally(() => setMindmapCourseLoading(false))
  }, [activeModality, mindmapScope, mindmapCourse, course.id, course.title, playChime])

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
      credentials: 'include',
      body: JSON.stringify({ text: body.slice(0, 15000) }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const contentType = (res.headers.get('content-type') || '').toLowerCase()
          if (contentType.includes('application/json')) {
            try {
              const data = await res.json()
              if (data.use_browser_tts) {
                setListeningUnavailableByModule((prev) => ({ ...prev, [currentModuleId]: true }))
                return
              }
            } catch {
              /* fall through */
            }
          }
          setListeningUnavailableByModule((prev) => ({ ...prev, [currentModuleId]: true }))
          return
        }
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
          playChime('task_complete')
        }
      })
      .catch(() => setListeningUnavailableByModule((prev) => ({ ...prev, [currentModuleId]: true })))
      .finally(() => setListeningLoading(false))
  }, [activeModality, currentModuleId, currentModule?.content, listeningAudioByModule, listeningUnavailableByModule, playChime])

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
    void loadModuleContent(moduleId)
    router.replace(`/courses/${course.id}/learn?module=${moduleId}`, { scroll: false })
  }

  async function handleMarkComplete() {
    if (isCompleted) return
    setMarkingComplete(true)
    const now = Date.now()
    const totalMs = now - startTimeRef.current
    const activeSecs = getLiveActiveSecs()
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
        payload: {
          active_secs: activeSecs,
          idle_secs: idleSecs,
          tracking_state: trackingStateRef.current,
          inactivity_count: inactivityCountRef.current,
          warning_secs_elapsed: warningElapsedSecsRef.current,
        },
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

    if (/share feedback|early access feedback|report a bug|beta feedback|tester feedback/i.test(msg)) {
      setFeedbackMode(true)
      setInput('')
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: msg },
        {
          role: 'assistant',
          content:
            'Thanks for helping us improve Sudar. Use the form below to describe what you found — screenshots and URLs are welcome.',
        },
      ])
      return
    }

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
    let tutorSucceeded = false

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
          pedagogy_mode: learnerPrefs?.tutor_pedagogy_default,
          available_modalities: {
            video: (course.settings?.video_scenes?.length ?? 0) > 0,
            podcast: (course.settings?.podcast_dialogue?.length ?? 0) > 0,
            mindmap_generated: !!mindmapByModule[currentModuleId],
          },
        }),
      })
      const text = await res.text()
      const data = parseTutorQueryHttpResponse(text, res.status)
      const assistantContent =
        data.response ??
        data.error ??
        (res.ok
          ? 'Sorry, I had trouble answering that. Please try again.'
          : `Something went wrong (${res.status}). Please try again.`)

      if (!res.ok || (data.error && !data.response)) {
        setMessages([...newMessages, {
          role: 'assistant',
          content: assistantContent,
        }])
        return
      }
      setMessages([...newMessages, {
        role: 'assistant',
        content: data.response ?? 'Sorry, I had trouble answering that. Please try again.',
        actions: data.actions?.length ? data.actions : undefined,
        blocks: data.blocks,
      }])
      tutorSucceeded = true
    } catch {
      setMessages([...newMessages, {
        role: 'assistant',
        content: 'Unable to reach Sudar. Please check your connection and try again. You can also ask a shorter follow-up.',
      }])
    } finally {
      setThinking(false)
      if (tutorSucceeded) playChime('sudar_reply')
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
  const isScormModule = isScormContent(currentModule?.content)

  useEffect(() => {
    if (!isScormModule) return
    const prev = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.documentElement.dataset.scormImmersive = '1'
    return () => {
      document.documentElement.style.overflow = prev
      delete document.documentElement.dataset.scormImmersive
    }
  }, [isScormModule])

  return (
    <div
      className={cn(
        'flex bg-background overflow-hidden',
        // Escape dashboard max-w-[1600px] card shell — IDE courses need the full viewport.
        isScormModule
          ? 'fixed inset-0 z-[45] h-[100dvh] w-screen max-w-none'
          : '-mx-4 md:-mx-8 -mt-6 md:-mt-8 -mb-6 md:-mb-8 h-[calc(100vh-64px)]',
      )}
    >
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
              <SudarLogoMark className="w-3.5 h-3.5 mt-0.5 opacity-70 shrink-0 text-primary" starFill="var(--card)" />
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

      {/* Collapsed: show expand tab on desktop — not used for immersive SCORM */}
      {!isScormModule && sidebarCollapsed && (
        <div className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-30">
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="flex items-center gap-1.5 pl-2 pr-3 py-2 rounded-r-lg bg-muted border border-l-0 border-border shadow-sm text-xs font-medium text-muted-foreground hover:text-card-foreground hover:bg-card transition-colors"
          >
            <List className="w-4 h-4" /> Sections
          </button>
        </div>
      )}

      {/* Module list sidebar — hidden for SCORM IDE (missions live in Explorer) */}
      {!isScormModule && (
      <div className={cn(
        'fixed lg:relative inset-y-0 left-0 z-30 w-72 bg-muted border-r border-border flex flex-col transition-transform duration-200',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        sidebarCollapsed && 'lg:!-translate-x-full lg:!w-0 lg:!min-w-0 lg:!overflow-hidden lg:!border-0 lg:!invisible'
      )}>
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <nav
              className="min-w-0 flex-1 overflow-hidden text-xs text-muted-foreground"
              aria-label="Breadcrumb"
              title={`Courses / ${course.title}${currentModuleId ? ` / ${currentModuleTitle}` : ''}`}
            >
              <div className="flex items-center gap-1.5 whitespace-nowrap overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <Link href="/courses" className="hover:text-card-foreground transition-colors shrink-0">Courses</Link>
                <span aria-hidden className="shrink-0">/</span>
                <Link href={`/courses/${course.id}`} className="hover:text-card-foreground transition-colors flex items-center gap-1 shrink-0">
                  <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                  <span>{course.title}</span>
                </Link>
                {currentModuleId && (
                  <>
                    <span aria-hidden className="shrink-0">/</span>
                    <span className="text-card-foreground font-medium shrink-0">
                      {currentModuleTitle}
                    </span>
                  </>
                )}
              </div>
            </nav>
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
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden w-full">
        {proactiveBanner && (
          <div
            role="status"
            className="shrink-0 px-4 py-3 bg-primary/5 border-b border-primary/15 flex flex-col gap-2 text-sm"
          >
            <div className="flex items-center gap-3">
              <SudarLogoMark className="w-4 h-4 text-primary shrink-0" starFill="var(--background)" />
              <p className="flex-1 text-card-foreground min-w-0">{proactiveBanner.message}</p>
              <button
                type="button"
                className="text-xs font-medium text-primary shrink-0"
                onClick={() => {
                  setTutorOpen(true)
                  setProactiveBanner(null)
                }}
              >
                Open Sudar
              </button>
              <button
                type="button"
                className="text-xs text-muted-foreground shrink-0"
                onClick={() => {
                  void fetch('/api/tutor/proactive-reply', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      trigger: proactiveBanner.trigger,
                      choice_id: 'dismiss_banner',
                      choice_label: 'Dismissed idle nudge',
                      course_id: course.id,
                      module_id: currentModuleId,
                    }),
                  }).catch(() => {})
                  setProactiveBanner(null)
                }}
              >
                Dismiss
              </button>
            </div>
            <ProactiveSudarChoiceChips
              choices={proactiveBanner.choices}
              onSelect={(c) => {
                void fetch('/api/tutor/proactive-reply', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    trigger: proactiveBanner.trigger,
                    choice_id: c.id,
                    choice_label: c.label,
                    follow_up_message: c.follow_up_message?.trim() || undefined,
                    course_id: course.id,
                    module_id: currentModuleId,
                  }),
                }).catch(() => {})
                setProactiveBanner(null)
                const msg = c.follow_up_message?.trim()
                if (msg) {
                  setTutorOpen(true)
                  setTimeout(() => {
                    void handleTutorSend(msg)
                  }, 120)
                }
              }}
            />
          </div>
        )}
        {moduleBridgeText && (
          <div
            role="note"
            className="shrink-0 px-4 py-2.5 bg-muted/60 border-b border-border flex items-start gap-3 text-xs"
          >
            <MessageSquarePlus className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="flex-1 text-card-foreground leading-snug prose prose-sm dark:prose-invert max-w-none [&_strong]:font-semibold">
              {renderCourseMarkdown(moduleBridgeText)}
            </p>
            <button
              type="button"
              className="text-muted-foreground hover:text-card-foreground shrink-0"
              onClick={() => setModuleBridgeText(null)}
              aria-label="Dismiss module link"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {/* Top bar */}
        <div className={cn(
          'flex items-center gap-3 border-b border-border bg-background shrink-0 flex-wrap',
          isScormModule ? 'px-4 py-2' : 'px-6 py-3',
        )}>
          {isScormModule ? (
            <Link
              href={`/courses/${course.id}`}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-card-foreground"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Exit
            </Link>
          ) : (
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 rounded-md hover:bg-muted transition-colors">
              <List className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
          {!isScormModule && (
            <>
              <span className="text-xs text-muted-foreground">{currentIndex + 1}{' / '}{modules.length}</span>
              <div className="h-4 w-px bg-muted" />
            </>
          )}
          <h1 className="text-sm font-semibold text-card-foreground truncate flex-1 min-w-0">
            {isScormModule ? course.title : currentModule?.title}
          </h1>

          {/* Modality switcher — hidden for SCORM modules; WAI-ARIA tabs for accessibility */}
          <div
            id="content-format-tabs"
            role="tablist"
            aria-label="Content format"
            className={cn('flex items-center gap-0.5 bg-muted rounded-lg p-0.5 shrink-0 overflow-x-auto max-w-full', isScormContent(currentModule?.content) && '!hidden')}
          >
            {(() => {
              const hasOverviewVideo = (course.settings?.include_video ?? false) &&
                (course.settings?.video_scenes?.length ?? 0) > 0
              const hasPodcast = (course.settings?.include_podcast ?? false) &&
                (course.settings?.podcast_dialogue?.length ?? 0) > 0
              const linkedSimId = currentModule?.sim_scenario_id
              const linkedSimStatus = linkedSimId ? simScenarioStatusById[linkedSimId] : undefined
              const simPublished = linkedSimStatus === 'published'
              const hasSudarSim = Boolean(linkedSimId && simPublished)
              void hasOverviewVideo // overview scenes render inside Watch tab when present
              const modalities = [
                { id: 'text', icon: FileText, label: 'Read' },
                { id: 'listening', icon: Headphones, label: 'Listen' },
                { id: 'video', icon: Video, label: 'Watch' },
                ...(hasPodcast ? [{ id: 'podcast', icon: Mic, label: 'Podcast', soon: false }] : []),
                { id: 'mindmap', icon: Network, label: 'Map' },
                { id: 'flashcards', icon: Layers, label: 'Cards' },
                ...(hasSudarSim ? [{ id: 'sudarsim', icon: Phone, label: 'Sim', soon: false, href: `/sim/session/new?scenario_id=${currentModule?.sim_scenario_id}&module_id=${currentModuleId}&course_id=${course.id}` }] : []),
              ]
              return modalities.map(({ id, icon: Icon, label, soon, href }) => {
                if (href) {
                  return (
                    <Link key={id} href={href}
                      title={label}
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-muted-foreground hover:text-card-foreground transition-all focus-visible:outline focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      <Icon className="w-3 h-3" />
                      <span className="hidden md:inline">{label}</span>
                    </Link>
                  )
                }
                return (
                  <button
                    key={id}
                    role="tab"
                    aria-selected={activeModality === id && !soon}
                    aria-label={label}
                    tabIndex={activeModality === id && !soon ? 0 : -1}
                    onClick={() => !soon && setActiveModality(id)}
                    title={soon ? `${label} — coming soon` : label}
                    className={cn(
                      'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all focus-visible:outline focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                      soon ? 'opacity-40 cursor-not-allowed' : '',
                      activeModality === id && !soon ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-card-foreground'
                    )}
                  >
                    <Icon className="w-3 h-3" />
                    <span className="hidden md:inline">{label}</span>
                  </button>
                )
              })
            })()}
          </div>

          {(() => {
            const linkedSimId = currentModule?.sim_scenario_id
            const status = linkedSimId ? simScenarioStatusById[linkedSimId] : undefined
            if (!linkedSimId || status !== 'draft' || !isOrgCreator) return null
            return (
              <p className="text-xs text-amber-600 dark:text-amber-400 shrink-0 max-w-[200px]">
                Sim is draft — publish in Studio SudarSim before learners can practice.
              </p>
            )
          })()}

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
            <SudarLogoMark
              className={cn('w-3.5 h-3.5', tutorOpen ? 'text-white' : 'text-primary')}
              starFill={tutorOpen ? 'var(--primary)' : 'var(--background)'}
            />
            Ask Sudar
            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', tutorOpen && 'rotate-180')} />
          </button>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden" role="tabpanel" id="modality-panel" aria-labelledby="content-format-tabs">
          {/* Module content + quiz — only flex child so it always uses full width */}
          <div className="flex flex-col min-h-0 overflow-hidden flex-1 min-w-0">

            {/* ── SCORM: full-height iframe — no scroll wrapper, no max-width ── */}
            {isScormContent(currentModule?.content) ? (
              <>
                <div className="relative flex-1 min-h-0 w-full overflow-hidden">
                  <ScormViewer
                    launchUrl={currentModule.content.launch_url}
                    courseId={course.id}
                    moduleId={currentModuleId}
                    moduleTitle={currentModule.title}
                    onComplete={() => { if (!isCompleted) handleMarkComplete() } }
                  />
                </div>
                {/* Compact SCORM bottom bar: prev / completion status / next */}
                {!isScormModule && (
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
                )}
              </>
            ) : (
              <>
            <div className="flex-1 overflow-y-auto relative bg-background text-foreground" onClick={() => selectionPopup && setSelectionPopup(null)}>
              <CourseThemeProvider template={course.template}>
              <div className={cn(
                'mx-auto px-6 py-8 space-y-10',
                activeModality === 'mindmap' ? 'max-w-6xl' :
                activeModality === 'video' || activeModality === 'podcast' ? 'max-w-full' :
                'max-w-3xl'
              )} ref={contentRef}>

                {isLoadingModuleContent && currentModule?.content == null && (
                  <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground" role="status" aria-live="polite">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm">Loading module…</p>
                  </div>
                )}

                <div className={cn('space-y-10', isLoadingModuleContent && currentModule?.content == null && 'hidden')}>

                {personalizeOffered && personalizationAccess.courseWelcome.allowed && (
                  <div className="mb-8 rounded-2xl border border-primary/25 bg-primary/5 p-5 space-y-3">
                    <p className="text-sm font-medium text-card-foreground">Personalize this course</p>
                    {personalizationBlocked ? (
                      <p className="text-xs text-muted-foreground">
                        Generative AI personalization requires your consent.{' '}
                        <Link href="/settings" className="text-primary underline-offset-2 hover:underline">
                          Review in Settings
                        </Link>
                      </p>
                    ) : (
                      <>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Sudar can write a short welcome that connects this course to your goals and history. Your shared
                          module content stays the same.
                        </p>
                        <button
                          type="button"
                          onClick={() => void handlePersonalizeWelcome()}
                          disabled={welcomePersonalizing || !enrollmentId}
                          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {welcomePersonalizing ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Personalizing…
                            </>
                          ) : (
                            <>
                              <SudarLogoMark className="h-3.5 w-3.5 text-white" starFill="var(--primary)" />
                              Personalize for me
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* Personalized welcome card */}
                {showWelcome && welcome?.message && (
                  <div className="relative bg-gradient-to-br from-primary/5 via-primary/5 to-background border border-primary/20 rounded-2xl p-6 shadow-sm shadow-sm">
                    <button onClick={() => setShowWelcome(false)}
                      className="absolute top-3 right-3 p-1.5 hover:bg-primary/10 rounded-lg transition-colors">
                      <X className="w-4 h-4 text-primary" />
                    </button>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-md shrink-0">
                        <SudarLogoMark className="w-5 h-5 text-white" starFill="var(--primary)" />
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

                {showModulePersonalization &&
                  currentModule &&
                  (personalizationAccess.moduleRoleExplain.allowed || personalizationAccess.moduleBrief.allowed) && (
                    <div className="mb-8 space-y-4 rounded-2xl border border-border bg-card/40 p-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Personalization for this module
                      </p>
                      {personalizationBlocked ? (
                        <p className="text-xs text-muted-foreground">
                          Consent is required for module personalization.{' '}
                          <Link href="/settings" className="text-primary underline-offset-2 hover:underline">
                            Settings
                          </Link>
                        </p>
                      ) : (
                        <>
                          {moduleOverlay?.role_explanation && (
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-primary">For your role</p>
                              <p className="text-sm text-card-foreground leading-relaxed whitespace-pre-wrap">
                                {moduleOverlay.role_explanation}
                              </p>
                            </div>
                          )}
                          {moduleOverlay?.brief_3min && (
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-primary">3-minute brief</p>
                              <p className="text-sm text-card-foreground leading-relaxed whitespace-pre-wrap">
                                {moduleOverlay.brief_3min}
                              </p>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2">
                            {personalizationAccess.moduleRoleExplain.allowed && (
                              <button
                                type="button"
                                onClick={() => void runModulePersonalize('role_explain')}
                                disabled={!!modulePersonalizeMode || !enrollmentId}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-card-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {modulePersonalizeMode === 'role_explain' ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <MessageSquarePlus className="h-3.5 w-3.5" />
                                )}
                                {moduleOverlay?.role_explanation ? 'Regenerate role view' : 'Explain for my role'}
                              </button>
                            )}
                            {personalizationAccess.moduleBrief.allowed && (
                              <button
                                type="button"
                                onClick={() => void runModulePersonalize('brief_3min')}
                                disabled={!!modulePersonalizeMode || !enrollmentId}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-card-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {modulePersonalizeMode === 'brief_3min' ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Layers className="h-3.5 w-3.5" />
                                )}
                                {moduleOverlay?.brief_3min ? 'Regenerate 3-minute brief' : '3-minute brief'}
                              </button>
                            )}
                          </div>
                        </>
                      )}
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
                  <div className="flex flex-col gap-10">
                    <section className="space-y-3" aria-label="Module video">
                      <p className="text-xs font-medium text-muted-foreground">
                        Module video — generated from this lesson
                      </p>
                      <SudarVidCard
                        moduleId={currentModuleId}
                        moduleTitle={currentModule?.title ?? ''}
                        contentBody={getContentBodyForFlashcards(currentModule?.content ?? null)}
                        courseId={course.id}
                      />
                    </section>
                    {(videoScenes?.length ?? 0) > 0 && (
                      <section className="space-y-3 border-t border-border pt-8" aria-label="Course overview video">
                        <p className="text-xs font-medium text-muted-foreground">
                          Course overview — authored in Studio Video &amp; Podcast
                        </p>
                        {courseMediaLoading && !courseMedia ? (
                          <div className="flex items-center justify-center py-12 text-muted-foreground">
                            <Loader2 className="w-6 h-6 animate-spin" />
                          </div>
                        ) : (
                          <CourseVideoCard
                            scenes={videoScenes!}
                            courseTitle={course.title}
                            telemetry={{ courseId: course.id, moduleId: currentModuleId }}
                          />
                        )}
                      </section>
                    )}
                  </div>
                ) : activeModality === 'podcast' ? (
                  (podcastDialogue?.length ?? 0) > 0 ? (
                    courseMediaLoading && !courseMedia ? (
                      <div className="flex items-center justify-center py-12 text-muted-foreground">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    ) : (
                      <CoursePodcastCard dialogue={podcastDialogue!} courseTitle={course.title} />
                    )
                  ) : (
                    <div className="max-w-xl mx-auto py-12 text-center space-y-3">
                      <Mic className="w-10 h-10 text-muted-foreground mx-auto" />
                      <p className="text-sm text-muted-foreground">No podcast for this course.</p>
                      <p className="text-xs text-muted-foreground">It isn&apos;t available for this course yet.</p>
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
                        void fetch(`/api/learn/course-module-bodies?course_id=${encodeURIComponent(course.id)}`)
                          .then((r) => (r.ok ? r.json() : null))
                          .then((bodyData: { modules?: Array<{ title: string; content: string }> } | null) => {
                            const modulesPayload = (bodyData?.modules ?? []).filter((m) => m.content.trim().length > 0)
                            if (modulesPayload.length === 0) return null
                            return fetch('/api/ai/generate-mindmap', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                scope: 'course',
                                course_title: course.title,
                                modules: modulesPayload,
                              }),
                            })
                          })
                          .then((res) => (res ? res.json() : null))
                          .then((data) => {
                            const root = data?.root
                            if (root && typeof root === 'object') {
                              setMindmapCourse(root as MindMapNode)
                              playChime('task_complete')
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
                              playChime('task_complete')
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
                          if (cards.length > 0) playChime('task_complete')
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
                        credentials: 'include',
                        body: JSON.stringify({ text: body.slice(0, 15000) }),
                      })
                        .then(async (res) => {
                          if (!res.ok) {
                            const contentType = (res.headers.get('content-type') || '').toLowerCase()
                            if (contentType.includes('application/json')) {
                              try {
                                const data = await res.json()
                                if (data.use_browser_tts) {
                                  setListeningUnavailableByModule((prev) => ({ ...prev, [currentModuleId]: true }))
                                  return
                                }
                              } catch {
                                /* fall through */
                              }
                            }
                            setListeningUnavailableByModule((prev) => ({ ...prev, [currentModuleId]: true }))
                            return
                          }
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
                            playChime('task_complete')
                          }
                        })
                        .catch(() => setListeningUnavailableByModule((prev) => ({ ...prev, [currentModuleId]: true })))
                        .finally(() => setListeningLoading(false))
                    } }
                  />
                ) : isRichContent(currentModule?.content) ? (
                  (() => {
                    const themeSlug = course.settings?.content_theme as ThemeSlug | undefined
                    const brand = course.settings?.brand_colors
                    const brandStyle =
                      brand?.primary
                        ? ({
                            ['--primary' as string]: brand.primary,
                            ['--course-color-accent' as string]: brand.accent ?? brand.primary,
                          } as React.CSSProperties)
                        : undefined
                    const body = (
                      <RichModuleContent
                        content={currentModule.content}
                        renderMarkdown={renderCourseMarkdown}
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
                    )
                    if (themeSlug) {
                      return (
                        <ThemeRenderer theme={themeSlug} className={brandStyle ? undefined : ''}>
                          <div style={brandStyle}>{body}</div>
                        </ThemeRenderer>
                      )
                    }
                    return brandStyle ? <div style={brandStyle}>{body}</div> : body
                  })()
                ) : (
                  <div>
                    {renderCourseMarkdown((currentModule?.content as { body?: string })?.body ?? '')}
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
                      supplementalPracticeOffers={learnerPrefs?.supplemental_practice_offers !== false}
                    />
                  </div>
                )}
                </div>
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
                  <SudarLogoMark className="w-4 h-4 text-white" starFill="var(--primary)" />
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
                        <SudarLogoMark className="w-3 h-3 text-white" starFill="var(--primary)" />
                      </div>
                      <div className="bg-card border border-border rounded-xl rounded-tl-sm px-3 py-2 text-xs text-card-foreground leading-relaxed">
                        {learnerName ? `Hi ${learnerName}! ` : 'Hi! '}I&apos;m Sudar. I know <span className="font-medium text-primary">{currentModule?.title}</span> and your full learning history. Ask me anything.
                        <br /><span className="text-muted-foreground text-[10px] mt-1 block">💡 Tip: highlight any text in the module to get quick explanations.</span>
                      </div>
                    </div>
                    <div className="space-y-1.5 pl-8">
                      {['Give me a quick summary', 'Explain this with an example', 'What are the key takeaways?', 'Quiz me on this module', 'How does this connect to what I\'ve learned before?', 'Share early access feedback'].map((prompt) => (
                        <button key={prompt} onClick={() => {
                          if (prompt === 'Share early access feedback') {
                            setFeedbackMode(true)
                            setMessages([
                              {
                                role: 'assistant',
                                content:
                                  'Thanks for helping us improve Sudar. Use the form below to describe what you found — screenshots and URLs are welcome.',
                              },
                            ])
                            return
                          }
                          setInput(prompt)
                          setTimeout(() => handleTutorSend(prompt), 50)
                        } }
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
                        <SudarLogoMark className="w-3 h-3 text-white" starFill="var(--primary)" />
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
                          onTutorChoice={(d) => {
                            void fetch('/api/tutor/choice', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                block_id: d.blockId,
                                choice_id: d.choiceId,
                                label: d.label,
                                course_id: course.id,
                                module_id: currentModuleId,
                              }),
                            }).catch(() => {})
                            void handleTutorSend(d.followUpMessage)
                          }}
                          onQuizRetry={() => handleTutorSend('Give me another quiz question')}
                        />
                      ) : (
                        <span className="contents block">
                      {msg.role === 'assistant' ? (
                        <ChatMarkdown text={stripTutorModelArtifactsFromText(msg.content)} />
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
                      <SudarLogoMark className="w-3 h-3 text-white" starFill="var(--primary)" />
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
                {feedbackMode ? (
                  <EarlyAccessFeedbackPanel
                    surface="learn"
                    pageRoute={pathname ?? `/courses/${course.id}/learn`}
                    courseId={course.id}
                    moduleId={currentModuleId}
                    onCancel={() => setFeedbackMode(false)}
                    onSubmitted={(thankYou) => {
                      setFeedbackMode(false)
                      setMessages((prev) => [...prev, { role: 'assistant', content: thankYou }])
                    }}
                  />
                ) : (
                <>
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
                    className="flex-1 bg-muted border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground caret-primary focus:outline-none focus:border-primary resize-none leading-relaxed"
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
                </>
                )}
              </div>
            </div>
            </div>
          )}
        {/* end tutor overlay */}
        </div>
      </div>
    </div>
    <InactiveHibernationOverlay
      trackingState={trackingState}
      warningRemainingSecs={warningRemainingSecs}
      onResumeIntent={markInteraction}
    />
    </div>
  )
}
