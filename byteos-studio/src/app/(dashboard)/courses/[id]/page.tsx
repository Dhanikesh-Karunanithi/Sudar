'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Plus, Trash2, GripVertical, Globe, FileText,
  ChevronDown, ChevronUp, Loader2, CheckCircle2, Sparkles, Wand2, LayoutList, Zap,
  CircleHelp, RefreshCcw, Eye, Timer, Palette, Video, X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebarContent } from '@/contexts/SidebarContentContext'
import { ContentToolsPanel } from '@/components/content/ContentToolsPanel'
import { ProjectMediaPeek } from '@/components/content/ProjectMediaPeek'
import { ModuleBlockEditor } from '@/components/content/ModuleBlockEditor'
import { getModuleBodyText } from '@/lib/contentBlocks'
import { LEARNING_PERSONAS, type LearningPersonaSlug } from '@/lib/themes/learningPersonas'
import type { ModuleContent } from '@/types/content'
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

  // Inject content development panel into sidebar while on this page
  const sidebarContent = useSidebarContent()
  useEffect(() => {
    if (!sidebarContent?.setSidebarContent || !course) return
    sidebarContent.setSidebarContent(
      <ContentToolsPanel
        onGenerateOutline={generateOutline}
        onAddModule={() => addModule()}
        generatingOutline={generatingOutline}
        modules={course.modules.map((m) => ({ id: m.id, title: m.title }))}
        expandedModuleId={expandedModule}
        onJumpToModule={(moduleId, index) => {
          setExpandedModule(moduleId)
          setTimeout(() => {
            document.getElementById(`module-${index + 1}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }, 100)
        }}
        onPromptIdeaSelect={(idea) => {
          if (expandedModule) {
            setAiPrompt((p) => ({ ...p, [expandedModule]: idea }))
            if (idea === 'Research from the web and cite sources') setIncludeWebResearch(true)
          }
        }}
        onOpenMediaPeek={() => setShowMediaPeek(true)}
      />
    )
    return () => { sidebarContent?.setSidebarContent(null) }
  }, [sidebarContent, course, generatingOutline, expandedModule, generateOutline, addModule])

  async function saveCourse(updates: Partial<Course>): Promise<void> {
    if (!course) return
    setSaving(true); setSaved(false)
    await fetch(`/api/courses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    setCourse((c) => c ? { ...c, ...updates } : c)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
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

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
    </div>
  )
  if (!course) return null

  const isPublished = course.status === 'published'

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4">
        <Link href="/courses" className="flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4" />Courses
        </Link>
        <div className="flex items-center gap-2">
          {saved && <span className="flex items-center gap-1.5 text-green-400 text-xs"><CheckCircle2 className="w-3.5 h-3.5" />Saved</span>}
          {saving && <Loader2 className="w-3.5 h-3.5 text-slate-500 animate-spin" />}
          {course.modules.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => document.getElementById('video-podcast-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-800 transition-all"
              >
                <Video className="w-3.5 h-3.5" />Video &amp; Podcast
              </button>
              <Link
              href={`/courses/${id}/preview`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-800 transition-all"
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
            {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isPublished ? <FileText className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
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
                {deletingCourse ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
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

      {/* Course metadata */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full',
            isPublished ? 'bg-green-500/15 text-green-400 border border-green-500/20' : 'bg-slate-700 text-slate-300'
          )}>
            {isPublished ? 'Published' : 'Draft'}
          </span>
        </div>
        <input
          type="text" defaultValue={course.title}
          onBlur={(e) => { if (e.target.value !== course.title) saveCourse({ title: e.target.value }) }}
          className="w-full bg-transparent text-white text-2xl font-semibold focus:outline-none placeholder-slate-600 border-b border-transparent focus:border-slate-700 pb-1 transition-colors"
          placeholder="Course title"
        />
        <textarea
          defaultValue={course.description ?? ''}
          onBlur={(e) => saveCourse({ description: e.target.value || null })}
          rows={2} placeholder="Add a description..."
          className="w-full bg-transparent text-slate-400 text-sm focus:outline-none placeholder-slate-600 resize-none border-b border-transparent focus:border-slate-700 pb-1 transition-colors"
        />
        <div className="flex items-center gap-6 pt-1">
          <div className="space-y-1">
            <label className="text-xs text-slate-500 font-medium">Difficulty</label>
            <select value={course.difficulty ?? 'intermediate'} onChange={(e) => saveCourse({ difficulty: e.target.value })}
              className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500">
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500 font-medium">Duration (mins)</label>
            <input type="number" defaultValue={course.estimated_duration_mins ?? ''}
              onBlur={(e) => saveCourse({ estimated_duration_mins: e.target.value ? Number(e.target.value) : null })}
              placeholder="e.g. 30"
              className="w-24 bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Adaptive learning toggle */}
        <div className="border-t border-slate-800 pt-4 mt-2">
          <button
            type="button"
            onClick={() => saveCourse({ is_adaptive: !course.is_adaptive })}
            className={cn(
              'w-full flex items-start gap-4 p-4 rounded-xl border transition-all text-left',
              course.is_adaptive
                ? 'bg-violet-950/40 border-violet-500/30 hover:border-violet-400/50'
                : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
            )}
          >
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
              course.is_adaptive ? 'bg-violet-600/20 border border-violet-500/30' : 'bg-slate-700 border border-slate-600'
            )}>
              <Zap className={cn('w-5 h-5', course.is_adaptive ? 'text-violet-400' : 'text-slate-500')} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={cn('text-sm font-semibold', course.is_adaptive ? 'text-violet-200' : 'text-slate-300')}>
                  Adaptive Learning
                </p>
                {course.is_adaptive && (
                  <span className="text-[10px] px-2 py-0.5 bg-violet-500/20 text-violet-300 rounded-full border border-violet-500/30 font-medium">
                    ON
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                {course.is_adaptive
                  ? 'Sudar will generate a personalized welcome for each learner on enrollment, bridging their past knowledge to this course.'
                  : 'Enable to let Sudar personalise this course for each learner — connecting their memory, prior courses, and goals to this content.'}
              </p>
            </div>
            {/* Toggle indicator */}
            <div className={cn(
              'w-10 h-6 rounded-full flex items-center transition-all shrink-0 mt-0.5 px-0.5',
              course.is_adaptive ? 'bg-violet-600 justify-end' : 'bg-slate-700 justify-start'
            )}>
              <div className="w-5 h-5 bg-white rounded-full shadow-sm" />
            </div>
          </button>
        </div>

        {/* Visual Persona (course theme) */}
        <div className="border-t border-slate-800 pt-4 mt-2">
          <div className="flex items-center gap-2 mb-3">
            <Palette className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="text-xs font-medium text-slate-400">Visual persona</span>
          </div>
          <p className="text-[10px] text-slate-600 mb-3">
            Choose how this course looks to learners. Affects typography, colors, and card style in Sudar Learn.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => saveCourse({ template: null })}
              className={cn(
                'flex flex-col items-start gap-1.5 p-3 rounded-xl border text-left transition-all',
                !course.template
                  ? 'bg-slate-700 border-slate-500 ring-1 ring-slate-400'
                  : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
              )}
            >
              <div className="w-full h-8 rounded border border-slate-600 bg-slate-900 flex items-center justify-center">
                <span className="text-[10px] text-slate-500">Default</span>
              </div>
              <span className="text-xs font-medium text-slate-300">Platform default</span>
            </button>
            {(Object.keys(LEARNING_PERSONAS) as LearningPersonaSlug[]).map((slug) => {
              const p = LEARNING_PERSONAS[slug]
              const selected = course.template === slug
              return (
                <button
                  key={slug}
                  type="button"
                  onClick={() => saveCourse({ template: slug })}
                  className={cn(
                    'flex flex-col items-start gap-1.5 p-3 rounded-xl border text-left transition-all',
                    selected ? 'ring-1 ring-indigo-400 border-indigo-500/50 bg-indigo-950/30' : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                  )}
                >
                  <div
                    className="w-full h-8 rounded border flex items-center justify-center text-[10px] font-medium"
                    style={{
                      backgroundColor: p.colorBackground,
                      color: p.colorForeground,
                      borderColor: p.borderColor,
                    }}
                  >
                    {p.label}
                  </div>
                  <span className="text-xs font-medium text-slate-300">{p.label}</span>
                  <span className="text-[10px] text-slate-500 line-clamp-1">{p.bestFor[0]}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Video & Podcast */}
        <div id="video-podcast-section" className="border-t border-slate-800 pt-4 mt-2 space-y-3">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="text-xs font-medium text-slate-400">Video &amp; Podcast</span>
          </div>

          {/* Video toggle */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={course.settings?.include_video ?? false}
                disabled={generatingVideo || !course.modules?.length}
                onChange={(e) => handleVideoToggle(e.target.checked)}
                className="rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500 disabled:opacity-50"
              />
              Include video overview
            </label>
            {course.settings?.include_video && (
              <div className="ml-6 text-[11px]">
                {generatingVideo ? (
                  <span className="flex items-center gap-1.5 text-indigo-400">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {videoGenStep === 'script' ? 'Generating script…' : 'Generating audio…'}
                  </span>
                ) : (course.settings?.video_scenes?.length ?? 0) > 0 ? (
                  <div className="space-y-1">
                    <span className="flex items-center gap-1.5 text-green-400">
                      ✓ Ready — {course.settings!.video_scenes!.length} scenes
                      {course.settings!.video_scenes!.some((s) => s.audioDataURL)
                        ? ', audio generated'
                        : ' (no audio yet)'}
                    </span>
                    <button
                      type="button"
                      disabled={generatingVideo || generatingPodcast}
                      onClick={() => generateVideoScriptAndAudio(course.id)}
                      className="text-slate-500 hover:text-slate-300 underline underline-offset-2 disabled:opacity-40"
                    >
                      Regenerate
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMediaSheet('video')}
                      className="block mt-1 text-slate-500 hover:text-slate-300 underline underline-offset-2"
                    >
                      View scenes
                    </button>
                  </div>
                ) : !course.modules?.length ? (
                  <span className="text-amber-600">Add modules with content first</span>
                ) : (
                  <span className="text-slate-600">Pending generation…</span>
                )}
              </div>
            )}
          </div>

          {/* Podcast toggle */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={course.settings?.include_podcast ?? false}
                disabled={generatingPodcast || !course.modules?.length}
                onChange={(e) => handlePodcastToggle(e.target.checked)}
                className="rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500 disabled:opacity-50"
              />
              Include podcast
            </label>
            {course.settings?.include_podcast && (
              <div className="ml-6 text-[11px]">
                {generatingPodcast ? (
                  <span className="flex items-center gap-1.5 text-indigo-400">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {podcastGenStep === 'script' ? 'Generating script…' : 'Generating audio…'}
                  </span>
                ) : (course.settings?.podcast_dialogue?.length ?? 0) > 0 ? (
                  <div className="space-y-1">
                    <span className="flex items-center gap-1.5 text-green-400">
                      ✓ Ready — {course.settings!.podcast_dialogue!.length} segments
                      {course.settings!.podcast_dialogue!.some((s) => s.audioDataURL)
                        ? ', audio generated'
                        : ' (no audio yet)'}
                    </span>
                    <button
                      type="button"
                      disabled={generatingVideo || generatingPodcast}
                      onClick={() => generatePodcastScriptAndAudio(course.id)}
                      className="text-slate-500 hover:text-slate-300 underline underline-offset-2 disabled:opacity-40"
                    >
                      Regenerate
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMediaSheet('podcast')}
                      className="block mt-1 text-slate-500 hover:text-slate-300 underline underline-offset-2"
                    >
                      View dialogue
                    </button>
                  </div>
                ) : !course.modules?.length ? (
                  <span className="text-amber-600">Add modules with content first</span>
                ) : (
                  <span className="text-slate-600">Pending generation…</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modules */}
      <div className="space-y-3">
        {generatingAllModules && (
          <div className="flex items-center gap-3 px-4 py-3 bg-violet-950/30 border border-violet-500/20 rounded-xl text-violet-200 text-sm">
            <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
            <div className="flex flex-col gap-0.5">
              <span className="font-medium">Generating curriculum-aware content…</span>
              {autoFillProgress && (
                <span className="text-xs text-violet-400">{autoFillProgress}</span>
              )}
            </div>
          </div>
        )}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">
            Modules <span className="text-slate-500 font-normal">({course.modules.length})</span>
          </h2>
          <div className="flex items-center gap-2">
            {course.modules.length === 0 && (
              <button
                onClick={generateOutline}
                disabled={generatingOutline}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-xs font-medium rounded-lg transition-all"
              >
                {generatingOutline ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {generatingOutline ? 'Generating outline...' : 'Generate outline with AI'}
              </button>
            )}
            <button onClick={() => addModule()} className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
              <Plus className="w-4 h-4" />Add module
            </button>
          </div>
        </div>

        {course.modules.length === 0 && (
          <div className="bg-slate-900 border border-slate-800 border-dashed rounded-xl p-10 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-violet-600/15 border border-violet-500/20 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6 text-violet-400" />
            </div>
            <div className="space-y-1">
              <p className="text-slate-300 text-sm font-medium">No modules yet</p>
              <p className="text-slate-500 text-xs">Generate a complete course outline with AI, or add modules manually.</p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={generateOutline}
                disabled={generatingOutline}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {generatingOutline ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {generatingOutline ? 'Generating...' : 'Generate outline with AI'}
              </button>
              <button onClick={() => addModule()} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors">
                <LayoutList className="w-4 h-4" />Add manually
              </button>
            </div>
          </div>
        )}

        {course.modules.map((mod, idx) => (
          <div key={mod.id} id={`module-${idx + 1}`} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            {/* Module header */}
            <div className="flex items-center gap-3 px-4 py-3">
              <GripVertical className="w-4 h-4 text-slate-600 shrink-0" />
              <span className="text-xs font-medium text-slate-600 w-5">{idx + 1}</span>
              <input
                type="text" defaultValue={mod.title}
                onBlur={(e) => { if (e.target.value !== mod.title) saveModule(mod.id, { title: e.target.value }) }}
                className="flex-1 bg-transparent text-slate-200 text-sm font-medium focus:outline-none placeholder-slate-600"
                placeholder="Module title"
              />
              <div className="flex items-center gap-1">
                <button
                  onClick={() => deleteModule(mod.id)}
                  className="p-1.5 text-slate-600 hover:text-red-400 rounded-md hover:bg-slate-800 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setExpandedModule(expandedModule === mod.id ? null : mod.id)}
                  className="p-1.5 text-slate-500 hover:text-slate-300 rounded-md hover:bg-slate-800 transition-all"
                >
                  {expandedModule === mod.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Module content editor */}
            {expandedModule === mod.id && (
              <div className="border-t border-slate-800 p-4 space-y-3">
                {/* AI panel toggle */}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">Content saves automatically when you click outside.</p>
                  <button
                    onClick={() => setShowAiPanel(showAiPanel === mod.id ? null : mod.id)}
                    disabled={generatingAllModules}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
                      showAiPanel === mod.id
                        ? 'bg-violet-600/20 border border-violet-500/30 text-violet-300'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-violet-300'
                    )}
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    {getModuleBodyText(mod.content) ? 'Regenerate with AI' : 'Generate with AI'}
                  </button>
                </div>

                {/* AI generation panel */}
                {showAiPanel === mod.id && (
                  <div className="bg-violet-950/30 border border-violet-500/20 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
                      <p className="text-violet-200 text-xs font-medium">What should this module cover?</p>
                    </div>
                    <textarea
                      value={aiPrompt[mod.id] ?? ''}
                      onChange={(e) => setAiPrompt((p) => ({ ...p, [mod.id]: e.target.value }))}
                      placeholder={`e.g. "Explain ${mod.title} with real-world examples and key takeaways"`}
                      rows={2}
                      className="w-full bg-slate-800/80 border border-violet-500/20 rounded-lg text-slate-200 text-xs p-3 focus:outline-none focus:border-violet-400 resize-none placeholder-slate-500"
                    />
                    <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={includeWebResearch}
                        onChange={(e) => setIncludeWebResearch(e.target.checked)}
                        className="rounded border-slate-600 bg-slate-800 text-violet-500 focus:ring-violet-500"
                      />
                      Include web research and citations
                    </label>
                    <p className="text-[10px] text-slate-500">When enabled, Sudar will search the web and cite sources in the content.</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => generateModuleContent(mod.id)}
                        disabled={generatingAllModules || !aiPrompt[mod.id]?.trim() || generatingModule === mod.id}
                        className={cn(
                          'flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
                          includeWebResearch
                            ? 'bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 disabled:text-slate-500 text-white'
                            : 'bg-slate-700 hover:bg-slate-600 text-slate-200 disabled:opacity-50'
                        )}
                      >
                        {generatingModule === mod.id ? (
                          <><Loader2 className="w-3.5 h-3.5 animate-spin" />Generating...</>
                        ) : includeWebResearch ? (
                          <><Sparkles className="w-3.5 h-3.5" />Research &amp; generate</>
                        ) : (
                          <><Sparkles className="w-3.5 h-3.5" />Generate content</>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setShowAiPanel(null)
                          setAiPrompt((p) => ({ ...p, [mod.id]: '' }))
                        }}
                        className="px-3 py-1.5 text-slate-400 hover:text-slate-200 text-xs rounded-lg hover:bg-slate-800 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {lastGeneratedReferences?.moduleId === mod.id && lastGeneratedReferences.references.length > 0 && (
                  <details className="rounded-lg border border-slate-700 bg-slate-800/60 overflow-hidden">
                    <summary className="px-3 py-2 text-xs font-medium text-slate-300 cursor-pointer hover:bg-slate-800">
                      References — generated with web sources ({lastGeneratedReferences.references.length})
                    </summary>
                    <ul className="px-3 py-2 space-y-1.5 list-none">
                      {lastGeneratedReferences.references.map((ref, i) => (
                        <li key={i}>
                          <a
                            href={ref.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-violet-400 hover:text-violet-300 underline truncate block"
                            title={ref.title}
                          >
                            [{i + 1}] {ref.title || ref.link}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}

                {/* Content: SCORM placeholder or block editor */}
                {(mod.content as { type?: string })?.type === 'scorm' ? (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 bg-amber-500/15 text-amber-400 border border-amber-500/20 rounded-full">SCORM module</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      This module is a SCORM SCO hosted in Supabase Storage. Learners experience it as an interactive iframe. You can edit the title above; the SCORM content itself is read-only here.
                    </p>
                    {(() => {
                      const raw = (mod.content as { launch_url?: string }).launch_url ?? ''
                      const url = raw.startsWith('http')
                        ? (() => { const m = raw.match(/\/course-media\/(.+)$/); return m ? `/api/scorm/${m[1]}` : raw })()
                        : raw ? `/api/scorm/${raw}` : '#'
                      return (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 underline underline-offset-2"
                        >
                          Open launch file ↗
                        </a>
                      )
                    })()}
                  </div>
                ) : (
                  <div className="relative">
                    {generatingModule === mod.id && (
                      <div className="absolute inset-0 bg-slate-900/80 rounded-lg flex items-center justify-center z-10">
                        <div className="flex items-center gap-2 text-violet-300 text-sm">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Writing module content...
                        </div>
                      </div>
                    )}
                    <ModuleBlockEditor
                      key={mod.id}
                      content={mod.content}
                      disabled={generatingModule === mod.id}
                      placeholder="Write your module content here, or use 'Generate with AI' above and add blocks below..."
                      onContentChange={(content) => saveModule(mod.id, { content })}
                      courseId={id}
                    />
                  </div>
                )}

                {(mod.content as { type?: string })?.type !== 'scorm' && getModuleBodyText(mod.content) && (
                  <p className="text-xs text-slate-600 text-right">
                    {getModuleBodyText(mod.content).split(/\s+/).filter(Boolean).length} words
                  </p>
                )}

                {/* Completion rule — how learner can complete this section */}
                <div className="border-t border-slate-800 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Timer className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-xs font-medium text-slate-400">Completion rule</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={course.settings?.module_completion?.[mod.id]?.type ?? 'mark_button'}
                        onChange={(e) => {
                          const t = e.target.value as 'mark_button' | 'min_time'
                          const next = { ...(course.settings || {}), module_completion: { ...(course.settings?.module_completion || {}), [mod.id]: t === 'min_time' ? { type: 'min_time' as const, min_time_secs: 60 } : { type: 'mark_button' as const } } }
                          saveCourse({ settings: next })
                        }}
                        className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="mark_button">Learner marks complete</option>
                        <option value="min_time">Minimum time on section</option>
                      </select>
                      {course.settings?.module_completion?.[mod.id]?.type === 'min_time' && (
                        <label className="flex items-center gap-1.5 text-xs text-slate-500">
                          <input
                            type="number"
                            min={1}
                            max={60}
                            value={Math.round((course.settings?.module_completion?.[mod.id]?.min_time_secs ?? 60) / 60)}
                            onChange={(e) => {
                              const mins = Math.max(1, Math.min(60, Number(e.target.value) || 1))
                              const next = { ...(course.settings || {}), module_completion: { ...(course.settings?.module_completion || {}), [mod.id]: { type: 'min_time' as const, min_time_secs: mins * 60 } } }
                              saveCourse({ settings: next })
                            }}
                            className="w-12 bg-slate-800 border border-slate-600 rounded px-1.5 py-1 text-slate-200 text-xs"
                          />
                          min
                        </label>
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-600">Require learners to spend minimum time (tab active) before they can mark this section complete.</p>
                </div>

                {/* Quiz section */}
                <div className="border-t border-slate-800 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CircleHelp className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-xs font-medium text-slate-400">Module Quiz</span>
                      {mod.quiz?.questions?.length ? (
                        <span className="text-[10px] px-2 py-0.5 bg-green-500/15 text-green-400 border border-green-500/20 rounded-full">
                          {mod.quiz.questions.length} questions
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {mod.quiz?.questions?.length ? (
                        <button
                          type="button"
                          onClick={() => deleteQuiz(mod.id)}
                          title="Remove quiz from this module"
                          className="flex items-center gap-1.5 px-3 py-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 border border-slate-700 hover:border-red-500/30 text-xs font-medium rounded-lg transition-all"
                        >
                          <Trash2 className="w-3 h-3" />Delete quiz
                        </button>
                      ) : null}
                      <button
                        onClick={() => generateQuiz(mod.id)}
                        disabled={generatingQuiz === mod.id || !getModuleBodyText(mod.content)?.trim()}
                        title={!getModuleBodyText(mod.content)?.trim() ? 'Add content before generating a quiz' : ''}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-all"
                      >
                        {generatingQuiz === mod.id
                          ? <><Loader2 className="w-3 h-3 animate-spin" />Generating...</>
                          : mod.quiz?.questions?.length
                            ? <><RefreshCcw className="w-3 h-3" />Regenerate quiz</>
                            : <><CircleHelp className="w-3 h-3" />Generate quiz</>}
                      </button>
                    </div>
                  </div>

                  {mod.quiz?.questions?.length ? (
                    <div className="space-y-2">
                      {mod.quiz.questions.map((q, qi) => (
                        <div key={q.id} className="bg-slate-800/60 border border-slate-700 rounded-lg p-3 space-y-2">
                          <div className="flex items-start gap-1.5">
                            <span className="text-slate-600 text-xs font-medium shrink-0 pt-0.5">Q{qi + 1}.</span>
                            <input
                              type="text"
                              defaultValue={q.question}
                              onBlur={(e) => {
                                const v = e.target.value.trim()
                                if (v !== q.question) updateQuizQuestion(mod.id, qi, { question: v })
                              }}
                              placeholder="Question text"
                              className="flex-1 min-w-0 bg-slate-900/80 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-500"
                            />
                            <button
                              type="button"
                              onClick={() => deleteQuizQuestion(mod.id, qi)}
                              title="Remove this question"
                              className="p-1 text-slate-500 hover:text-red-400 rounded shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 pl-5">
                            {q.options.map((opt, oi) => (
                              <div key={oi} className="flex items-center gap-1.5">
                                <span className="text-[10px] text-slate-500 shrink-0 w-4">{String.fromCharCode(65 + oi)}.</span>
                                <input
                                  type="text"
                                  defaultValue={opt}
                                  onBlur={(e) => {
                                    const v = e.target.value.trim()
                                    if (v !== opt) {
                                      const options = [...q.options]
                                      options[oi] = v
                                      updateQuizQuestion(mod.id, qi, { options })
                                    }
                                  }}
                                  placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                                  className={cn(
                                    'flex-1 min-w-0 bg-slate-900/80 border rounded px-2 py-1 text-[10px] placeholder-slate-500 focus:outline-none',
                                    oi === q.correct ? 'border-green-500/50 text-green-400 focus:border-green-500' : 'border-slate-600 text-slate-400 focus:border-slate-500'
                                  )}
                                />
                                <button
                                  type="button"
                                  onClick={() => updateQuizQuestion(mod.id, qi, { correct: oi })}
                                  title="Mark as correct answer"
                                  className={cn(
                                    'shrink-0 w-5 h-5 rounded border flex items-center justify-center text-[10px] font-medium transition-colors',
                                    oi === q.correct ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'border-slate-600 text-slate-500 hover:border-slate-500'
                                  )}
                                >
                                  {oi === q.correct ? '✓' : '○'}
                                </button>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-start gap-1.5 pl-5">
                            <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded font-medium shrink-0 mt-0.5">topic</span>
                            <input
                              type="text"
                              defaultValue={q.topic}
                              onBlur={(e) => {
                                const v = e.target.value.trim()
                                if (v !== q.topic) updateQuizQuestion(mod.id, qi, { topic: v })
                              }}
                              placeholder="Topic tag"
                              className="flex-1 min-w-0 bg-slate-900/80 border border-slate-600 rounded px-2 py-1 text-[10px] text-slate-500 placeholder-slate-600 focus:outline-none focus:border-slate-500"
                            />
                          </div>
                          <div className="pl-5 space-y-0.5">
                            <span className="text-[10px] text-slate-500 font-medium">Explanation (shown after answer)</span>
                            <input
                              type="text"
                              defaultValue={q.explanation}
                              onBlur={(e) => {
                                const v = e.target.value.trim()
                                if (v !== q.explanation) updateQuizQuestion(mod.id, qi, { explanation: v })
                              }}
                              placeholder="Optional explanation"
                              className="w-full bg-slate-900/80 border border-slate-600 rounded px-2 py-1 text-[10px] text-slate-400 placeholder-slate-600 focus:outline-none focus:border-slate-500"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600 italic">
                      {getModuleBodyText(mod.content)?.trim() ? 'No quiz yet — generate one above.' : 'Add module content first.'}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <ProjectMediaPeek
        open={showMediaPeek}
        onClose={() => setShowMediaPeek(false)}
        course={course}
        onScrollToVideoSection={() => document.getElementById('video-podcast-section')?.scrollIntoView({ behavior: 'smooth' })}
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
