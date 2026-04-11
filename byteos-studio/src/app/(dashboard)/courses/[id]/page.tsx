'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Plus, Trash2, Globe, FileText,
  CheckCircle2, Sparkles, Wand2,
  CircleHelp, Eye, Timer, Video, X, Settings, ImageIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SudarInlineLoader, SudarLoadingFrost } from '@/components/branding/SudarBrandLoader'
import { useSidebarContent } from '@/contexts/SidebarContentContext'
import { ProjectMediaPeek } from '@/components/content/ProjectMediaPeek'
import {
  CourseModuleContent,
  type CourseContentRegionKey,
} from '@/components/course/CourseModuleContent'
import { CourseCanvasFloatingBar } from '@/components/course/CourseCanvasFloatingBar'
import { CourseWysiwygInspector } from '@/components/course/CourseWysiwygInspector'
import { CourseSettingsSheet } from '@/components/course/CourseSettingsSheet'
import { ReorderModuleBlocksPanel } from '@/components/course/ReorderModuleBlocksPanel'
import { appendEditorBlockToModuleContent, getModuleBodyText } from '@/lib/contentBlocks'
import type { EditorBlockType, ModuleContent } from '@/types/content'
import type { VideoScene, DialogueSegment } from '@/types/content'

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
  content: ModuleContent
  order_index: number
  quiz?: { questions: QuizQuestion[] } | null
}

type PersonalizationAudience = 'org' | 'groups' | 'individuals'

interface CoursePersonalizationSettings {
  audience?: PersonalizationAudience
  group_ids?: string[]
  user_ids?: string[]
  features?: {
    course_welcome?: boolean
    module_role_explain?: boolean
    module_brief?: boolean
  }
}

interface Course {
  id: string
  title: string
  description: string | null
  status: string
  difficulty: string | null
  estimated_duration_mins: number | null
  is_adaptive: boolean
  template?: string | null
  settings?: {
    module_completion?: Record<string, { type: 'mark_button' | 'min_time'; min_time_secs?: number }>
    include_video?: boolean
    include_podcast?: boolean
    video_scenes?: VideoScene[]
    podcast_dialogue?: DialogueSegment[]
    video_generation_status?: 'idle' | 'generating' | 'script_ready' | 'complete' | 'failed'
    podcast_generation_status?: 'idle' | 'generating' | 'complete' | 'failed'
    personalization?: CoursePersonalizationSettings
  } | null
  modules: Module[]
}

export default function CourseEditorPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedModule, setExpandedModule] = useState<string | null>(null)

  // AI state
  const [generatingOutline, setGeneratingOutline] = useState(false)
  const [generatingModule, setGeneratingModule] = useState<string | null>(null)
  const [generatingAllModules, setGeneratingAllModules] = useState(false)
  const hasAutoFilledRef = useRef(false)
  const [aiPrompt, setAiPrompt] = useState<Record<string, string>>({})
  const [includeWebResearch, setIncludeWebResearch] = useState(false)
  const [lastGeneratedReferences, setLastGeneratedReferences] = useState<{ moduleId: string; references: { title: string; link: string }[] } | null>(null)
  const [showMediaPeek, setShowMediaPeek] = useState(false)
  const [viewMediaSheet, setViewMediaSheet] = useState<'video' | 'podcast' | null>(null)
  const [showAiPanel, setShowAiPanel] = useState<string | null>(null)
  const [generatingQuiz, setGeneratingQuiz] = useState<string | null>(null)
  const [generatingVideo, setGeneratingVideo] = useState(false)
  const [generatingPodcast, setGeneratingPodcast] = useState(false)
  const [videoGenStep, setVideoGenStep] = useState<'script' | 'audio' | null>(null)
  const [podcastGenStep, setPodcastGenStep] = useState<'script' | 'audio' | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingCourse, setDeletingCourse] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [activeRegionKey, setActiveRegionKey] = useState<CourseContentRegionKey | null>(null)
  const moduleContentTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const [learnerGroups, setLearnerGroups] = useState<Array<{ id: string; name: string }>>([])
  const [orgLearners, setOrgLearners] = useState<Array<{ id: string; full_name: string }>>([])

  const fetchCourse = useCallback(async () => {
    const res = await fetch(`/api/courses/${id}`)
    if (!res.ok) { router.push('/courses'); return }
    const data = await res.json()
    setCourse(data)
    setLoading(false)
    if (data.modules?.length > 0) setExpandedModule(data.modules[0].id)
  }, [id, router])

  useEffect(() => { fetchCourse() }, [fetchCourse])

  useEffect(() => {
    fetch('/api/org/learner-groups')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setLearnerGroups(Array.isArray(d) ? d : []))
      .catch(() => setLearnerGroups([]))
    fetch('/api/org/learners')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setOrgLearners(Array.isArray(d) ? d : []))
      .catch(() => setOrgLearners([]))
  }, [])

  useEffect(() => {
    if (!viewMediaSheet) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setViewMediaSheet(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [viewMediaSheet])

  // Auto-fill empty modules once on first load via curriculum-aware batch endpoint
  const [autoFillProgress, setAutoFillProgress] = useState<string>('')
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const generateAllEmptyModules = useCallback(async (courseToUse: Course) => {
    const empty = courseToUse.modules.filter((m) => !getModuleBodyText(m.content)?.trim())
    if (empty.length === 0) return
    setGeneratingAllModules(true)
    setAutoFillProgress('Building curriculum plan…')
    setError(null)

    // Fire batch generation (backend saves each module to DB as it completes)
    const batchRes = fetch('/api/ai/generate-all-modules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ course_id: courseToUse.id }),
    })

    // Poll for completed modules every 5 seconds
    const totalEmpty = empty.length
    const emptyIds = new Set(empty.map((m) => m.id))
    let completedCount = 0

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/courses/${courseToUse.id}`)
        if (!res.ok) return
        const data = await res.json()
        const newCourse = data as Course

        let filled = 0
        for (const mod of newCourse.modules) {
          if (emptyIds.has(mod.id) && getModuleBodyText(mod.content)?.trim()) filled++
        }

        if (filled > completedCount) {
          completedCount = filled
          setCourse(newCourse)
          if (newCourse.modules?.length > 0 && !expandedModule) {
            setExpandedModule(newCourse.modules[0].id)
          }
          setAutoFillProgress(`Generated ${completedCount} of ${totalEmpty} modules…`)
        }

        if (completedCount >= totalEmpty) {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
          setGeneratingAllModules(false)
          setAutoFillProgress('')
        }
      } catch { /* polling error — will retry next interval */ }
    }, 5000)

    // Also await the batch response to catch errors
    try {
      const res = await batchRes
      const data = await res.json()
      if (!res.ok) {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
        setError(data.error ?? 'Curriculum-aware generation failed. Try again.')
        setGeneratingAllModules(false)
        setAutoFillProgress('')
        // Fetch final state so any partially generated modules appear
        await fetchCourse()
        return
      }
      // Final fetch to ensure all content is up to date
      await fetchCourse()
    } catch {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
      setError('Generation request failed. Check your connection and try again.')
      setGeneratingAllModules(false)
      setAutoFillProgress('')
    }

    // Cleanup
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    pollIntervalRef.current = null
    setGeneratingAllModules(false)
    setAutoFillProgress('')
  }, [fetchCourse, expandedModule])

  useEffect(() => {
    if (!course || course.modules.length === 0 || hasAutoFilledRef.current) return
    const emptyModules = course.modules.filter((m) => !getModuleBodyText(m.content)?.trim())
    if (emptyModules.length === 0) return
    hasAutoFilledRef.current = true
    generateAllEmptyModules(course)
  }, [course, generateAllEmptyModules])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }
  }, [])

  const addModule = useCallback(async (title = 'Untitled Module') => {
    const res = await fetch(`/api/courses/${id}/modules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content: { type: 'text', body: '' } }),
    })
    const mod = await res.json()
    setCourse((c) => c ? { ...c, modules: [...c.modules, mod] } : c)
    setExpandedModule(mod.id)
    return mod
  }, [id])

  const generateOutline = useCallback(async () => {
    if (!course) return
    setGeneratingOutline(true); setError(null)
    const res = await fetch('/api/ai/generate-outline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        course_title: course.title,
        description: course.description,
        difficulty: course.difficulty,
        num_modules: 5,
      }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setGeneratingOutline(false); return }

    for (const title of data.modules) {
      await addModule(title)
    }
    setGeneratingOutline(false)
  }, [course, addModule])

  const sidebarContent = useSidebarContent()
  useEffect(() => {
    if (!sidebarContent?.setSidebarContent) return
    sidebarContent.setSidebarContent(null)
    return () => { sidebarContent?.setSidebarContent(null) }
  }, [sidebarContent])

  useEffect(() => {
    setActiveRegionKey(null)
  }, [expandedModule])

  async function saveCourse(updates: Partial<Course>): Promise<void> {
    if (!course) return
    setSaving(true); setSaved(false)
    const res = await fetch(`/api/courses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    const data = res.ok ? await res.json().catch(() => null) : null
    setCourse((c) => {
      if (!c) return c
      if (data && typeof data === 'object' && data !== null && 'settings' in data && data.settings) {
        return { ...c, ...updates, settings: data.settings as Course['settings'] }
      }
      return { ...c, ...updates }
    })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function patchCoursePersonalization(partial: Partial<CoursePersonalizationSettings>) {
    if (!course) return
    const p = course.settings?.personalization ?? {}
    const features = {
      course_welcome: p.features?.course_welcome !== false,
      module_role_explain: p.features?.module_role_explain !== false,
      module_brief: p.features?.module_brief !== false,
      ...partial.features,
    }
    const next: CoursePersonalizationSettings = {
      audience: partial.audience ?? p.audience ?? 'org',
      group_ids: partial.group_ids !== undefined ? partial.group_ids : (p.group_ids ?? []),
      user_ids: partial.user_ids !== undefined ? partial.user_ids : (p.user_ids ?? []),
      features,
    }
    saveCourse({
      settings: {
        ...(course.settings ?? {}),
        personalization: next,
      },
    })
  }

  async function saveModule(moduleId: string, updates: Partial<Module>) {
    await fetch(`/api/courses/${id}/modules/${moduleId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    setCourse((c) => c ? {
      ...c, modules: c.modules.map((m) => m.id === moduleId ? { ...m, ...updates } : m),
    } : c)
  }

  function patchModuleContentOptimistic(moduleId: string, content: ModuleContent) {
    setCourse((c) =>
      c
        ? {
            ...c,
            modules: c.modules.map((m) => (m.id === moduleId ? { ...m, content } : m)),
          }
        : c
    )
  }

  function scheduleModuleContentPersist(moduleId: string, content: ModuleContent) {
    const prev = moduleContentTimersRef.current.get(moduleId)
    if (prev) clearTimeout(prev)
    const t = setTimeout(() => {
      void saveModule(moduleId, { content })
      moduleContentTimersRef.current.delete(moduleId)
    }, 450)
    moduleContentTimersRef.current.set(moduleId, t)
  }

  function handleCanvasContentChange(moduleId: string, content: ModuleContent) {
    patchModuleContentOptimistic(moduleId, content)
    scheduleModuleContentPersist(moduleId, content)
  }

  useEffect(() => {
    return () => {
      moduleContentTimersRef.current.forEach((tm) => clearTimeout(tm))
    }
  }, [])

  async function deleteModule(moduleId: string) {
    await fetch(`/api/courses/${id}/modules/${moduleId}`, { method: 'DELETE' })
    setCourse((c) => c ? { ...c, modules: c.modules.filter((m) => m.id !== moduleId) } : c)
    if (expandedModule === moduleId) setExpandedModule(null)
  }

  async function togglePublish() {
    if (!course) return
    setPublishing(true); setError(null)
    const isPublished = course.status === 'published'
    const res = await fetch(`/api/courses/${id}/publish`, { method: isPublished ? 'DELETE' : 'POST' })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setPublishing(false); return }
    setCourse((c) => c ? { ...c, status: data.status } : c)
    setPublishing(false)
  }

  async function handleDeleteCourse() {
    if (!id) return
    setDeletingCourse(true)
    setError(null)
    try {
      const res = await fetch(`/api/courses/${id}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/courses')
        return
      }
      const data = await res.json()
      setError(data.error ?? 'Could not delete course')
    } finally {
      setDeletingCourse(false)
      setShowDeleteConfirm(false)
    }
  }

  // ─── AI: Generate module content (single, with prior module context) ─────
  async function generateModuleContent(moduleId: string) {
    if (!course) return
    const prompt = aiPrompt[moduleId]?.trim()
    if (!prompt) return

    setGeneratingModule(moduleId)
    const mod = course.modules.find((m) => m.id === moduleId)
    const modIndex = course.modules.findIndex((m) => m.id === moduleId)

    // Build prior module context from modules that come before this one
    const priorModules = course.modules
      .slice(0, modIndex)
      .filter((m) => getModuleBodyText(m.content)?.trim())
      .map((m) => ({
        title: m.title,
        summary: getModuleBodyText(m.content)
          .split('\n')
          .filter((l) => l.trim() && !l.startsWith('#'))
          .slice(0, 4)
          .join(' ')
          .slice(0, 250),
      }))

    const endpoint = includeWebResearch ? '/api/ai/generate-module-with-research' : '/api/ai/generate-module'
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: prompt,
        course_title: course.title,
        module_title: mod?.title,
        difficulty: course.difficulty,
        context: course.description ?? undefined,
        prior_modules_context: priorModules.length > 0 ? priorModules : undefined,
      }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setGeneratingModule(null); return }

    await saveModule(moduleId, { content: { type: 'text', body: data.content } })
    if (includeWebResearch && Array.isArray(data.references) && data.references.length > 0) {
      setLastGeneratedReferences({
        moduleId,
        references: data.references.map((r: { title?: string; link?: string }) => ({ title: r.title ?? '', link: r.link ?? '' })),
      })
    } else {
      setLastGeneratedReferences(null)
    }
    setShowAiPanel(null)
    setAiPrompt((p) => ({ ...p, [moduleId]: '' }))
    setGeneratingModule(null)
  }

  async function generateQuiz(moduleId: string) {
    if (!course) return
    const mod = course.modules.find((m) => m.id === moduleId)
    if (!mod?.content) { setError('Write module content before generating a quiz.'); return }
    const bodyText = getModuleBodyText(mod.content)
    if (!bodyText?.trim()) { setError('Write module content before generating a quiz.'); return }

    setGeneratingQuiz(moduleId)
    const res = await fetch('/api/ai/generate-quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        module_id: moduleId,
        course_title: course.title,
        module_title: mod.title,
        content: getModuleBodyText(mod.content),
        difficulty: course.difficulty,
        num_questions: 4,
      }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Quiz generation failed'); setGeneratingQuiz(null); return }

    setCourse((c) => c ? {
      ...c,
      modules: c.modules.map((m) => m.id === moduleId ? { ...m, quiz: data.quiz } : m),
    } : c)
    setGeneratingQuiz(null)
  }

  async function deleteQuiz(moduleId: string) {
    await saveModule(moduleId, { quiz: null })
  }

  function updateQuizQuestion(moduleId: string, questionIndex: number, updates: Partial<QuizQuestion>) {
    const mod = course?.modules.find((m) => m.id === moduleId)
    if (!mod?.quiz?.questions) return
    const questions = mod.quiz.questions.map((q, i) =>
      i === questionIndex ? { ...q, ...updates } : q
    )
    saveModule(moduleId, { quiz: { questions } })
  }

  function deleteQuizQuestion(moduleId: string, questionIndex: number) {
    const mod = course?.modules.find((m) => m.id === moduleId)
    if (!mod?.quiz?.questions) return
    const questions = mod.quiz.questions.filter((_, i) => i !== questionIndex)
    saveModule(moduleId, { quiz: questions.length > 0 ? { questions } : null })
  }

  async function generateVideoScriptAndAudio(courseId: string) {
    setGeneratingVideo(true)
    setVideoGenStep('script')
    setError(null)
    try {
      // Step 1: generate script
      const scriptRes = await fetch('/api/studio/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      })
      const scriptData = await scriptRes.json()
      if (!scriptRes.ok) {
        setError(scriptData.error ?? 'Video script generation failed')
        return
      }
      const scenes: VideoScene[] = (scriptData.script?.scenes ?? scriptData.scenes ?? []).map(
        (s: { sceneNumber?: number; title?: string; narration?: string; visuals?: string; duration?: number }) => ({
          sceneNumber: s.sceneNumber ?? 0,
          title: s.title ?? '',
          narration: s.narration ?? '',
          visuals: s.visuals,
          duration: s.duration,
        })
      )
      const nextSettings = { ...(course?.settings || {}), video_scenes: scenes, video_generation_status: 'script_ready' as const }
      await saveCourse({ settings: nextSettings })
      setCourse((c) => c ? { ...c, settings: nextSettings } : c)

      // Step 2: generate audio
      setVideoGenStep('audio')
      const audioRes = await fetch('/api/studio/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, type: 'video' }),
      })
      const audioData = await audioRes.json()
      if (!audioRes.ok) {
        setError(audioData.error ?? 'Video audio generation failed')
      }
      await fetchCourse()
    } finally {
      setGeneratingVideo(false)
      setVideoGenStep(null)
    }
  }

  async function generatePodcastScriptAndAudio(courseId: string) {
    setGeneratingPodcast(true)
    setPodcastGenStep('script')
    setError(null)
    try {
      // Step 1: generate script (podcast route now saves dialogue directly to DB)
      const scriptRes = await fetch('/api/studio/podcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      })
      const scriptData = await scriptRes.json()
      if (!scriptRes.ok) {
        setError(scriptData.error ?? 'Podcast script generation failed')
        return
      }
      // Reload to pick up the dialogue saved by the podcast route
      await fetchCourse()

      // Step 2: generate audio
      setPodcastGenStep('audio')
      const audioRes = await fetch('/api/studio/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, type: 'podcast' }),
      })
      const audioData = await audioRes.json()
      if (!audioRes.ok) {
        setError(audioData.error ?? 'Podcast audio generation failed')
      }
      await fetchCourse()
    } finally {
      setGeneratingPodcast(false)
      setPodcastGenStep(null)
    }
  }

  async function handleVideoToggle(enabled: boolean) {
    if (!course) return
    const nextSettings = { ...(course.settings || {}), include_video: enabled }
    await saveCourse({ settings: nextSettings })
    setCourse((c) => c ? { ...c, settings: nextSettings } : c)
    if (enabled && !(course.settings?.video_scenes?.length) && course.modules?.length) {
      await generateVideoScriptAndAudio(course.id)
    }
  }

  async function handlePodcastToggle(enabled: boolean) {
    if (!course) return
    const nextSettings = { ...(course.settings || {}), include_podcast: enabled }
    await saveCourse({ settings: nextSettings })
    setCourse((c) => c ? { ...c, settings: nextSettings } : c)
    if (enabled && !(course.settings?.podcast_dialogue?.length) && course.modules?.length) {
      await generatePodcastScriptAndAudio(course.id)
    }
  }

  if (loading) {
    return (
      <div className="relative flex min-h-[min(50vh,420px)] items-stretch justify-center p-8 overflow-hidden rounded-2xl">
        <SudarLoadingFrost layout="block" label="Loading course…" className="min-h-[280px] w-full max-w-lg border-slate-800/80" />
      </div>
    )
  }
  if (!course) return null

  const isPublished = course.status === 'published'
  const activeMod = course.modules.find((m) => m.id === expandedModule) ?? null

  const AI_PROMPT_CHIPS = [
    'Explain with real-world examples',
    'Include key takeaways',
    'Add a short summary',
    'Use simple language for beginners',
    'Add definitions for key terms',
    'Research from the web and cite sources',
  ] as const

  return (
    <div className="-mx-2 flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-1 pb-1 max-xl:overflow-y-auto max-xl:min-h-[min(100dvh,100%)] xl:h-full">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/courses" className="flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm transition-colors shrink-0">
            <ArrowLeft className="w-4 h-4" />Courses
          </Link>
          <span className="text-slate-600 hidden sm:inline">/</span>
          <p className="text-sm text-slate-300 truncate max-w-[200px] font-medium" title={course.title}>
            {course.title || 'Untitled course'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {saved && <span className="flex items-center gap-1.5 text-green-400 text-xs"><CheckCircle2 className="w-3.5 h-3.5" />Saved</span>}
          {saving && <SudarInlineLoader size="sm" className="h-3.5 w-auto text-slate-500" starFill="var(--background)" />}
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-800 transition-all"
          >
            <Settings className="w-3.5 h-3.5" />
            Course settings
          </button>
          {course.modules.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => {
                  setSettingsOpen(true)
                  setTimeout(() => document.getElementById('video-podcast-section')?.scrollIntoView({ behavior: 'smooth' }), 200)
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-800 transition-all"
              >
                <Video className="w-3.5 h-3.5" />Video &amp; Podcast
              </button>
              <Link
              href={`/courses/${id}/preview`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-800 transition-all"
            >
              <Eye className="w-3.5 h-3.5" />Preview
            </Link>
            </>
          )}
          <button
            onClick={togglePublish}
            disabled={publishing}
            className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              isPublished ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-green-600 hover:bg-green-500 text-white'
            )}
          >
            {publishing ? <SudarInlineLoader size="sm" className="h-3.5 w-auto text-slate-500" starFill="var(--background)" /> : isPublished ? <FileText className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
            {isPublished ? 'Unpublish' : 'Publish'}
          </button>
          {showDeleteConfirm ? (
            <span className="flex items-center gap-2">
              <span className="text-slate-400 text-sm">Delete course?</span>
              <button
                type="button"
                onClick={handleDeleteCourse}
                disabled={deletingCourse}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-500 text-white disabled:opacity-50"
              >
                {deletingCourse ? <SudarInlineLoader size="sm" className="h-3.5 w-auto text-slate-500" starFill="var(--background)" /> : <Trash2 className="w-3.5 h-3.5" />}
                {deletingCourse ? 'Deleting...' : 'Yes, delete'}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deletingCourse}
                className="px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800"
              >
                Cancel
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete course
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>
      )}

      {generatingAllModules && (
        <div className="flex items-center gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/[0.06] px-4 py-3 text-sm text-zinc-200">
          <SudarInlineLoader size="sm" className="shrink-0 text-slate-500" starFill="var(--background)" />
          <div className="flex flex-col gap-0.5">
            <span className="font-medium">Generating curriculum-aware content…</span>
            {autoFillProgress && (
              <span className="text-xs text-blue-300/90">{autoFillProgress}</span>
            )}
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1 gap-0 overflow-hidden rounded-2xl border border-white/[0.06] bg-zinc-950 max-xl:min-h-[560px]">
        {/* Module rail */}
        <aside className="flex w-56 shrink-0 flex-col border-r border-white/[0.06] bg-zinc-900/95 min-h-0">
          <div className="p-3 border-b border-slate-800 space-y-2">
            <button
              type="button"
              onClick={() => setShowMediaPeek(true)}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 text-left"
            >
              <ImageIcon className="w-3.5 h-3.5 shrink-0" />
              Project media
            </button>
            {course.modules.length === 0 && (
              <button
                type="button"
                onClick={generateOutline}
                disabled={generatingOutline}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-xl text-xs font-medium border border-blue-500/25 bg-blue-500/10 text-blue-200 disabled:opacity-60"
              >
                {generatingOutline ? <SudarInlineLoader size="sm" className="h-3.5 w-auto text-blue-300" starFill="var(--background)" /> : <Sparkles className="w-3.5 h-3.5" />}
                {generatingOutline ? 'Outline…' : 'AI outline'}
              </button>
            )}
            <button
              type="button"
              onClick={() => addModule()}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:bg-white/[0.06] text-left"
            >
              <Plus className="w-3.5 h-3.5" /> Add module
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {course.modules.map((m, idx) => (
              <div key={m.id} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setExpandedModule(m.id)}
                  className={cn(
                    'flex-1 text-left px-2 py-2 rounded-lg text-xs transition-all truncate',
                    expandedModule === m.id
                      ? 'border border-blue-500/30 bg-blue-500/10 text-zinc-100'
                      : 'text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-200'
                  )}
                >
                  <span className="text-slate-600 mr-1">{idx + 1}.</span>
                  {m.title || 'Untitled'}
                </button>
                <button
                  type="button"
                  onClick={() => deleteModule(m.id)}
                  className="p-1.5 text-slate-600 hover:text-red-400 rounded shrink-0"
                  title="Delete module"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </nav>
          <div className="p-3 border-t border-slate-800">
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500 mb-2">AI prompt ideas</p>
            <div className="flex flex-wrap gap-1">
              {AI_PROMPT_CHIPS.map((idea) => (
                <button
                  key={idea}
                  type="button"
                  onClick={() => {
                    if (expandedModule) {
                      setAiPrompt((p) => ({ ...p, [expandedModule]: idea }))
                      if (idea === 'Research from the web and cite sources') setIncludeWebResearch(true)
                    }
                  }}
                  className="rounded px-1.5 py-0.5 text-[10px] border border-transparent text-zinc-500 hover:bg-blue-500/10 hover:text-blue-200"
                >
                  {idea}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Canvas + module options */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {activeMod ? (
            <>
              <div className="shrink-0 space-y-3 border-b border-white/[0.06] p-4">
                <input
                  type="text"
                  defaultValue={activeMod.title}
                  key={activeMod.id + activeMod.title}
                  onBlur={(e) => {
                    if (e.target.value !== activeMod.title) saveModule(activeMod.id, { title: e.target.value })
                  }}
                  className="w-full bg-transparent text-white text-xl font-semibold focus:outline-none border-b border-transparent focus:border-slate-700 pb-1"
                  placeholder="Module title"
                />
              </div>
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
                  <CourseModuleContent
                    module={{
                      id: activeMod.id,
                      title: activeMod.title,
                      content: activeMod.content as never,
                      order_index: activeMod.order_index,
                    }}
                    wrapRegion={(key, node) => (
                      <div
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            setActiveRegionKey(key)
                          }
                        }}
                        className={cn(
                          'cursor-pointer rounded-xl transition-[box-shadow]',
                          activeRegionKey === key
                            ? 'ring-2 ring-blue-500/70 ring-offset-2 ring-offset-zinc-950'
                            : 'hover:ring-1 hover:ring-white/10'
                        )}
                        onClick={() => setActiveRegionKey(key)}
                      >
                        {node}
                      </div>
                    )}
                  />
                </div>
                {activeMod && (
                  <div className="shrink-0 px-3 pb-3 md:px-5">
                    <CourseCanvasFloatingBar
                      activeKey={activeRegionKey}
                      content={activeMod.content}
                      courseId={id}
                      onContentChange={(c) => handleCanvasContentChange(activeMod.id, c)}
                      onClearSelection={() => setActiveRegionKey(null)}
                    />
                  </div>
                )}
              </div>

              <div className="max-h-[45vh] shrink-0 space-y-4 overflow-y-auto border-t border-white/[0.06] bg-zinc-900/40 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-slate-400">AI &amp; blocks</p>
                  <button
                    type="button"
                    onClick={() => setShowAiPanel(showAiPanel === activeMod.id ? null : activeMod.id)}
                    disabled={generatingAllModules}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
                      showAiPanel === activeMod.id
                        ? 'border border-blue-500/30 bg-blue-500/10 text-blue-200'
                        : 'bg-zinc-800/80 text-zinc-400 hover:bg-zinc-800'
                    )}
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    {getModuleBodyText(activeMod.content) ? 'Regenerate with AI' : 'Generate with AI'}
                  </button>
                </div>

                {showAiPanel === activeMod.id && (
                  <div className="space-y-3 rounded-2xl border border-blue-500/20 bg-blue-500/[0.06] p-4">
                    <textarea
                      value={aiPrompt[activeMod.id] ?? ''}
                      onChange={(e) => setAiPrompt((p) => ({ ...p, [activeMod.id]: e.target.value }))}
                      placeholder={`What should this module cover?`}
                      rows={2}
                      className="w-full resize-none rounded-xl border border-white/[0.08] bg-zinc-900/80 p-3 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                    />
                    <label className="flex items-center gap-2 text-xs text-slate-400">
                      <input
                        type="checkbox"
                        checked={includeWebResearch}
                        onChange={(e) => setIncludeWebResearch(e.target.checked)}
                        className="rounded border-slate-600"
                      />
                      Web research &amp; citations
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => generateModuleContent(activeMod.id)}
                        disabled={generatingAllModules || !aiPrompt[activeMod.id]?.trim() || generatingModule === activeMod.id}
                        className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-500 disabled:opacity-50"
                      >
                        {generatingModule === activeMod.id ? 'Generating…' : 'Generate'}
                      </button>
                      <button type="button" onClick={() => setShowAiPanel(null)} className="text-xs text-slate-500">
                        Close
                      </button>
                    </div>
                  </div>
                )}

                {lastGeneratedReferences?.moduleId === activeMod.id && lastGeneratedReferences.references.length > 0 && (
                  <details className="rounded-lg border border-slate-700 bg-slate-800/60 overflow-hidden text-xs">
                    <summary className="px-3 py-2 cursor-pointer text-slate-300">References ({lastGeneratedReferences.references.length})</summary>
                    <ul className="px-3 py-2 space-y-1">
                      {lastGeneratedReferences.references.map((ref, i) => (
                        <li key={i}>
                          <a href={ref.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                            [{i + 1}] {ref.title || ref.link}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}

                <div className="space-y-2">
                  <p className="text-[10px] font-medium text-slate-500 uppercase">Add block to page</p>
                  <div className="flex flex-wrap gap-1">
                    {(
                      [
                        'text', 'image', 'expandable', 'quiz', 'video', 'timeline', 'flipcard', 'hotspot', 'matching', 'tabs', 'audio', 'flashcard',
                      ] as EditorBlockType[]
                    ).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() =>
                          handleCanvasContentChange(activeMod.id, appendEditorBlockToModuleContent(activeMod.content, t))
                        }
                        className="px-2 py-0.5 rounded text-[10px] bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200"
                      >
                        +{t}
                      </button>
                    ))}
                  </div>
                </div>

                <ReorderModuleBlocksPanel
                  content={activeMod.content}
                  onContentChange={(c) => handleCanvasContentChange(activeMod.id, c)}
                />

                <div className="border-t border-slate-800 pt-3 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Timer className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-xs font-medium text-slate-400">Completion rule</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={course.settings?.module_completion?.[activeMod.id]?.type ?? 'mark_button'}
                        onChange={(e) => {
                          const typ = e.target.value as 'mark_button' | 'min_time'
                          const next = {
                            ...(course.settings || {}),
                            module_completion: {
                              ...(course.settings?.module_completion || {}),
                              [activeMod.id]:
                                typ === 'min_time'
                                  ? { type: 'min_time' as const, min_time_secs: 60 }
                                  : { type: 'mark_button' as const },
                            },
                          }
                          saveCourse({ settings: next })
                        }}
                        className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2 py-1.5"
                      >
                        <option value="mark_button">Learner marks complete</option>
                        <option value="min_time">Minimum time on section</option>
                      </select>
                      {course.settings?.module_completion?.[activeMod.id]?.type === 'min_time' && (
                        <label className="flex items-center gap-1 text-xs text-slate-500">
                          <input
                            type="number"
                            min={1}
                            max={60}
                            value={Math.round((course.settings?.module_completion?.[activeMod.id]?.min_time_secs ?? 60) / 60)}
                            onChange={(e) => {
                              const mins = Math.max(1, Math.min(60, Number(e.target.value) || 1))
                              const next = {
                                ...(course.settings || {}),
                                module_completion: {
                                  ...(course.settings?.module_completion || {}),
                                  [activeMod.id]: { type: 'min_time' as const, min_time_secs: mins * 60 },
                                },
                              }
                              saveCourse({ settings: next })
                            }}
                            className="w-10 bg-slate-800 border border-slate-600 rounded px-1 py-0.5 text-slate-200 text-xs"
                          />
                          min
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-3 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <CircleHelp className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-xs font-medium text-slate-400">Module quiz</span>
                      {activeMod.quiz?.questions?.length ? (
                        <span className="text-[10px] px-2 py-0.5 bg-green-500/15 text-green-400 border border-green-500/20 rounded-full">
                          {activeMod.quiz.questions.length} questions
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {activeMod.quiz?.questions?.length ? (
                        <button
                          type="button"
                          onClick={() => deleteQuiz(activeMod.id)}
                          className="text-xs text-slate-500 hover:text-red-400 px-2 py-1 rounded border border-slate-700"
                        >
                          Delete quiz
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => generateQuiz(activeMod.id)}
                        disabled={generatingQuiz === activeMod.id || !getModuleBodyText(activeMod.content)?.trim()}
                        className="text-xs px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-40"
                      >
                        {generatingQuiz === activeMod.id ? 'Generating…' : activeMod.quiz?.questions?.length ? 'Regenerate' : 'Generate quiz'}
                      </button>
                    </div>
                  </div>
                  {activeMod.quiz?.questions?.length ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {activeMod.quiz.questions.map((q, qi) => (
                        <div key={q.id} className="bg-slate-800/60 border border-slate-700 rounded-lg p-2 space-y-1.5 text-[11px]">
                          <div className="flex gap-1">
                            <span className="text-slate-600 pt-0.5">Q{qi + 1}</span>
                            <input
                              type="text"
                              defaultValue={q.question}
                              onBlur={(e) => {
                                const v = e.target.value.trim()
                                if (v !== q.question) updateQuizQuestion(activeMod.id, qi, { question: v })
                              }}
                              className="flex-1 bg-slate-900/80 border border-slate-600 rounded px-2 py-1 text-slate-200"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-1 pl-5">
                            {q.options.map((opt, oi) => (
                              <div key={oi} className="flex items-center gap-1">
                                <input
                                  type="text"
                                  defaultValue={opt}
                                  onBlur={(e) => {
                                    const v = e.target.value.trim()
                                    if (v !== opt) {
                                      const options = [...q.options]
                                      options[oi] = v
                                      updateQuizQuestion(activeMod.id, qi, { options })
                                    }
                                  }}
                                  className="flex-1 bg-slate-900/80 border border-slate-600 rounded px-1 py-0.5 text-slate-400"
                                />
                                <button
                                  type="button"
                                  onClick={() => updateQuizQuestion(activeMod.id, qi, { correct: oi })}
                                  className={cn(
                                    'text-[10px] px-1 rounded',
                                    oi === q.correct ? 'bg-green-500/20 text-green-400' : 'text-slate-600'
                                  )}
                                >
                                  {oi === q.correct ? '✓' : '○'}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-600 italic">
                      {getModuleBodyText(activeMod.content)?.trim() ? 'No quiz yet.' : 'Add content first.'}
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-slate-500 text-sm">
              {course.modules.length === 0 ? (
                <>
                  <Sparkles className="mb-3 h-10 w-10 text-blue-500/40" />
                  <p className="text-slate-400 mb-4">No modules yet — generate an outline or add one.</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={generateOutline}
                      disabled={generatingOutline}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500 disabled:opacity-50"
                    >
                      {generatingOutline ? '…' : 'Generate outline'}
                    </button>
                    <button type="button" onClick={() => addModule()} className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm">
                      Add module
                    </button>
                  </div>
                </>
              ) : (
                <p>Select a module from the list.</p>
              )}
            </div>
          )}
        </div>

        {/* Inspector */}
        <aside
          id="course-wysiwyg-inspector"
          className="hidden min-h-0 w-80 shrink-0 flex-col border-l border-white/[0.06] bg-zinc-900/98 xl:flex"
        >
          <div className="shrink-0 border-b border-white/[0.06] p-3">
            <p className="text-[11px] font-medium tracking-wide text-zinc-500">Inspector</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">
              Click the canvas to choose a region. Edits save automatically.
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {activeMod && (
              <CourseWysiwygInspector
                content={activeMod.content}
                activeKey={activeRegionKey}
                onContentChange={(c) => handleCanvasContentChange(activeMod.id, c)}
                courseId={id}
              />
            )}
          </div>
        </aside>
      </div>

      {/* Mobile / small screens: inspector below */}
      <div className="mt-2 overflow-hidden rounded-2xl border border-white/[0.06] bg-zinc-900/95 xl:hidden">
        <div className="border-b border-white/[0.06] p-3">
          <p className="text-[11px] font-medium text-zinc-500">Inspector</p>
        </div>
        {activeMod && (
          <CourseWysiwygInspector
            content={activeMod.content}
            activeKey={activeRegionKey}
            onContentChange={(c) => handleCanvasContentChange(activeMod.id, c)}
            courseId={id}
          />
        )}
      </div>

      <CourseSettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        course={course}
        isPublished={isPublished}
        saveCourse={async (u) => { await saveCourse(u as Partial<Course>) }}
        patchCoursePersonalization={patchCoursePersonalization}
        learnerGroups={learnerGroups}
        orgLearners={orgLearners}
        generatingVideo={generatingVideo}
        generatingPodcast={generatingPodcast}
        videoGenStep={videoGenStep}
        podcastGenStep={podcastGenStep}
        generateVideoScriptAndAudio={generateVideoScriptAndAudio}
        generatePodcastScriptAndAudio={generatePodcastScriptAndAudio}
        handleVideoToggle={handleVideoToggle}
        handlePodcastToggle={handlePodcastToggle}
        setViewMediaSheet={setViewMediaSheet}
      />

      <ProjectMediaPeek
        open={showMediaPeek}
        onClose={() => setShowMediaPeek(false)}
        course={course}
        onScrollToVideoSection={() => {
          setSettingsOpen(true)
          setTimeout(() => document.getElementById('video-podcast-section')?.scrollIntoView({ behavior: 'smooth' }), 200)
        }}
      />

      {viewMediaSheet && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => setViewMediaSheet(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-700 shrink-0">
              <h2 className="text-sm font-semibold text-white">
                {viewMediaSheet === 'video' ? 'Video scenes' : 'Podcast dialogue'}
              </h2>
              <button
                type="button"
                onClick={() => setViewMediaSheet(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 min-h-0">
              {viewMediaSheet === 'video' && (course.settings?.video_scenes?.length ?? 0) > 0 && (
                <ul className="space-y-2">
                  {course.settings!.video_scenes!.map((s, i) => (
                    <li key={i} className="rounded-lg border border-slate-700 bg-slate-800/60 p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium text-slate-500 w-6">{s.sceneNumber}.</span>
                        <span className="text-xs font-medium text-slate-200">{s.title || `Scene ${s.sceneNumber}`}</span>
                        {s.audioDataURL && <span className="text-[10px] text-green-500">Audio</span>}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 pl-8">{s.narration || '—'}</p>
                    </li>
                  ))}
                </ul>
              )}
              {viewMediaSheet === 'podcast' && (course.settings?.podcast_dialogue?.length ?? 0) > 0 && (
                <ul className="space-y-2">
                  {course.settings!.podcast_dialogue!.map((seg, i) => (
                    <li key={i} className="rounded-lg border border-slate-700 bg-slate-800/60 p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium text-slate-500 capitalize">{seg.speaker}:</span>
                        {seg.audioDataURL && <span className="text-[10px] text-green-500">Audio</span>}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-3">{seg.text || '—'}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
