'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, Loader2, Redo2, Save, Undo2 } from 'lucide-react'
import {
  CourseModuleContent,
  type CourseContentRegionKey,
  type PreviewModule,
} from '@/components/course/CourseModuleContent'
import { CourseWysiwygInspector } from '@/components/course/CourseWysiwygInspector'
import { CourseCanvasFloatingBar } from '@/components/course/CourseCanvasFloatingBar'
import { ScormExtractedTextEditor } from '@/components/course/ScormExtractedTextEditor'
import type { ModuleContent } from '@/types/content'
import { isScormContent } from '@/types/content'
import { cn } from '@/lib/utils'

export interface CourseStudioWorkspaceProps {
  courseId: string
  /** When set, the parent already loaded module content — avoids a second request and a loading flash. */
  initialModules?: PreviewModule[] | null
}

function sortModules(list: PreviewModule[]): PreviewModule[] {
  return [...list].sort((a, b) => a.order_index - b.order_index)
}

const MAX_UNDO_STACK = 40
const HISTORY_THROTTLE_MS = 420

function cloneModuleContent(c: ModuleContent): ModuleContent {
  try {
    return structuredClone(c)
  } catch {
    return JSON.parse(JSON.stringify(c)) as ModuleContent
  }
}

function contentEqual(a: ModuleContent, b: ModuleContent): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

export function CourseStudioWorkspace({ courseId, initialModules }: CourseStudioWorkspaceProps) {
  const [loading, setLoading] = useState(() => initialModules === undefined || initialModules === null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [modules, setModules] = useState<PreviewModule[]>(() =>
    initialModules ? sortModules(initialModules) : []
  )
  const [activeModuleId, setActiveModuleId] = useState<string | null>(() => {
    const list = initialModules ? sortModules(initialModules) : []
    return list[0]?.id ?? null
  })
  const [activeKey, setActiveKey] = useState<CourseContentRegionKey | null>(null)
  const [saving, setSaving] = useState(false)
  const [pendingAutosave, setPendingAutosave] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [historyTick, setHistoryTick] = useState(0)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const modulesRef = useRef(modules)
  const pastRef = useRef<Map<string, ModuleContent[]>>(new Map())
  const futureRef = useRef<Map<string, ModuleContent[]>>(new Map())
  const historyThrottleRef = useRef<Map<string, number>>(new Map())
  const suppressHistoryRef = useRef(false)

  useEffect(() => {
    modulesRef.current = modules
  }, [modules])

  const loadCourse = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await fetch(`/api/courses/${courseId}`)
      const raw = (await res.json()) as {
        error?: string
        modules?: Array<{ id: string; title: string; content: unknown; order_index: number }>
      }
      if (!res.ok) throw new Error(raw.error ?? 'Failed to load')
      const list: PreviewModule[] = (raw.modules ?? []).map((m) => ({
        id: m.id,
        title: m.title,
        content: m.content as PreviewModule['content'],
        order_index: m.order_index,
      }))
      const sorted = sortModules(list)
      setModules(sorted)
      pastRef.current.clear()
      futureRef.current.clear()
      historyThrottleRef.current.clear()
      setHistoryTick((x) => x + 1)
      setActiveModuleId((prev) => {
        if (prev && sorted.some((x) => x.id === prev)) return prev
        return sorted[0]?.id ?? null
      })
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Load failed')
    } finally {
      setLoading(false)
    }
  }, [courseId])

  const hydrateFromParent = initialModules !== undefined && initialModules !== null

  useEffect(() => {
    if (hydrateFromParent) return
    void loadCourse()
  }, [courseId, hydrateFromParent, loadCourse])

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [])

  const activeModule = useMemo(
    () => modules.find((m) => m.id === activeModuleId) ?? modules[0],
    [modules, activeModuleId]
  )

  useEffect(() => {
    setActiveKey(null)
  }, [activeModuleId])

  const bumpHistory = useCallback(() => setHistoryTick((x) => x + 1), [])

  const pushPast = useCallback((moduleId: string, snapshot: ModuleContent) => {
    const list = pastRef.current.get(moduleId) ?? []
    const next = [...list, snapshot].slice(-MAX_UNDO_STACK)
    pastRef.current.set(moduleId, next)
  }, [])

  const popPast = useCallback((moduleId: string): ModuleContent | null => {
    const list = pastRef.current.get(moduleId) ?? []
    if (list.length === 0) return null
    const prev = list[list.length - 1]
    pastRef.current.set(moduleId, list.slice(0, -1))
    return prev
  }, [])

  const clearFuture = useCallback((moduleId: string) => {
    futureRef.current.set(moduleId, [])
  }, [])

  const pushFuture = useCallback((moduleId: string, snapshot: ModuleContent) => {
    const list = futureRef.current.get(moduleId) ?? []
    futureRef.current.set(moduleId, [...list, snapshot].slice(-MAX_UNDO_STACK))
  }, [])

  const popFuture = useCallback((moduleId: string): ModuleContent | null => {
    const list = futureRef.current.get(moduleId) ?? []
    if (list.length === 0) return null
    const v = list[list.length - 1]
    futureRef.current.set(moduleId, list.slice(0, -1))
    return v
  }, [])

  /** Throttle pushes so rapid typing groups into fewer undo steps. */
  const throttlePushPast = useCallback(
    (moduleId: string, snapshot: ModuleContent) => {
      const now = Date.now()
      const last = historyThrottleRef.current.get(moduleId) ?? 0
      const list = pastRef.current.get(moduleId) ?? []
      const cooldownOk = now - last >= HISTORY_THROTTLE_MS
      if (!cooldownOk && list.length > 0) return false
      historyThrottleRef.current.set(moduleId, now)
      const top = list[list.length - 1]
      if (top && contentEqual(top, snapshot)) return true
      pushPast(moduleId, snapshot)
      return true
    },
    [pushPast]
  )

  const performSave = useCallback(
    async (moduleId: string, content: ModuleContent) => {
      setSaving(true)
      setPendingAutosave(false)
      setSaveError(null)
      try {
        const res = await fetch(`/api/courses/${courseId}/modules/${moduleId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        })
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        if (!res.ok) throw new Error(data.error ?? 'Save failed')
        setLastSavedAt(new Date())
      } catch (e) {
        setSaveError(e instanceof Error ? e.message : 'Save failed')
      } finally {
        setSaving(false)
      }
    },
    [courseId]
  )

  const flushSave = useCallback(
    (moduleId: string, content: ModuleContent) => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current)
        saveTimer.current = null
      }
      setPendingAutosave(false)
      void performSave(moduleId, content)
    },
    [performSave]
  )

  const scheduleSave = useCallback(
    (moduleId: string, content: ModuleContent) => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      setPendingAutosave(true)
      setSaveError(null)
      saveTimer.current = setTimeout(() => {
        saveTimer.current = null
        void performSave(moduleId, content)
      }, 450)
    },
    [performSave]
  )

  const handleContentChange = useCallback(
    (next: ModuleContent) => {
      const id = activeModuleId
      if (!id) return
      let shouldSave = false
      setModules((prev) => {
        const cur = prev.find((m) => m.id === id)
        if (!cur) return prev
        if (contentEqual(next, cur.content as ModuleContent)) return prev
        shouldSave = true
        if (!suppressHistoryRef.current) {
          const snap = cloneModuleContent(cur.content as ModuleContent)
          if (throttlePushPast(id, snap)) {
            clearFuture(id)
            bumpHistory()
          }
        } else {
          suppressHistoryRef.current = false
        }
        return prev.map((m) => (m.id === id ? { ...m, content: next as PreviewModule['content'] } : m))
      })
      if (shouldSave) scheduleSave(id, next)
    },
    [activeModuleId, scheduleSave, throttlePushPast, clearFuture, bumpHistory]
  )

  const undo = useCallback(() => {
    const id = activeModuleId
    if (!id) return
    const current = modulesRef.current.find((m) => m.id === id)
    if (!current) return
    const prev = popPast(id)
    if (!prev) return
    pushFuture(id, cloneModuleContent(current.content as ModuleContent))
    suppressHistoryRef.current = true
    setModules((mods) =>
      mods.map((m) => (m.id === id ? { ...m, content: prev as PreviewModule['content'] } : m))
    )
    flushSave(id, prev)
    bumpHistory()
  }, [activeModuleId, popPast, pushFuture, flushSave, bumpHistory])

  const redo = useCallback(() => {
    const id = activeModuleId
    if (!id) return
    const current = modulesRef.current.find((m) => m.id === id)
    if (!current) return
    const nextContent = popFuture(id)
    if (!nextContent) return
    pushPast(id, cloneModuleContent(current.content as ModuleContent))
    suppressHistoryRef.current = true
    setModules((mods) =>
      mods.map((m) => (m.id === id ? { ...m, content: nextContent as PreviewModule['content'] } : m))
    )
    flushSave(id, nextContent)
    bumpHistory()
  }, [activeModuleId, popFuture, pushPast, flushSave, bumpHistory])

  const saveNow = useCallback(() => {
    if (!activeModuleId) return
    const mod = modulesRef.current.find((m) => m.id === activeModuleId)
    if (!mod) return
    flushSave(activeModuleId, mod.content as ModuleContent)
  }, [activeModuleId, flushSave])

  const canUndo = useMemo(() => {
    if (!activeModuleId) return false
    return (pastRef.current.get(activeModuleId)?.length ?? 0) > 0
  }, [activeModuleId, historyTick])

  const canRedo = useMemo(() => {
    if (!activeModuleId) return false
    return (futureRef.current.get(activeModuleId)?.length ?? 0) > 0
  }, [activeModuleId, historyTick])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const t = e.target
      if (t instanceof HTMLElement && t.closest('textarea, input, [contenteditable="true"]')) {
        return
      }
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return
      if (e.key === 'z' && !e.shiftKey) {
        if (canUndo) {
          e.preventDefault()
          undo()
        }
        return
      }
      if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
        if (canRedo) {
          e.preventDefault()
          redo()
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [canUndo, canRedo, undo, redo])

  const wrapRegion = useCallback(
    (key: CourseContentRegionKey, node: React.ReactNode) => (
      <div
        role="button"
        tabIndex={0}
        onClick={() => setActiveKey(key)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setActiveKey(key)
          }
        }}
        className={cn(
          'cursor-pointer rounded-xl outline-none transition-shadow',
          activeKey === key
            ? 'ring-2 ring-indigo-500/80 ring-offset-2 ring-offset-slate-950'
            : 'hover:ring-1 hover:ring-white/15'
        )}
      >
        {node}
      </div>
    ),
    [activeKey]
  )

  const activeScorm =
    activeModule?.content && isScormContent(activeModule.content) ? activeModule.content : null

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-16 text-slate-500" aria-busy="true">
        <Loader2 className="h-6 w-6 animate-spin shrink-0" aria-hidden />
        <span className="text-sm">Loading editor…</span>
      </div>
    )
  }

  if (loadError) {
    return (
      <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{loadError}</p>
    )
  }

  return (
    <section
      className="space-y-4 rounded-xl border-2 border-indigo-500/35 bg-slate-950/60 p-4 shadow-lg shadow-indigo-950/20 sm:p-5"
      aria-label="Course content editor"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-white">Course builder</h2>
            <span className="rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-300">
              Autosave on
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Click a region on the canvas, edit in the inspector, and use the violet{' '}
            <span className="text-violet-400">AI</span> actions on a selection. Edits are saved automatically shortly after
            you pause typing. Use <span className="text-slate-300">Undo</span> /{' '}
            <span className="text-slate-300">Redo</span> (or toolbar) to reverse changes;{' '}
            <span className="text-slate-300">Save now</span> writes to the server immediately.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => undo()}
            disabled={!canUndo}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Undo module content"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Undo
          </button>
          <button
            type="button"
            onClick={() => redo()}
            disabled={!canRedo}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Redo module content"
            title="Redo (Ctrl+Y or Ctrl+Shift+Z)"
          >
            <Redo2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Redo
          </button>
          <button
            type="button"
            onClick={() => saveNow()}
            disabled={saving || !activeModuleId}
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/40 bg-indigo-600/90 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Save module now"
            title="Save immediately (flush pending autosave)"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />
            ) : (
              <Save className="h-3.5 w-3.5 shrink-0" aria-hidden />
            )}
            Save now
          </button>
        </div>
      </div>

      {saveError ? (
        <p className="text-xs text-red-400" role="alert">
          {saveError}
        </p>
      ) : null}
      <p className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400" aria-live="polite">
        {saving ? (
          <>
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-indigo-400" aria-hidden />
            <span>Saving to server…</span>
          </>
        ) : pendingAutosave ? (
          <span>Autosave queued — syncing after a short pause…</span>
        ) : lastSavedAt ? (
          <>
            <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden />
            <span>
              Saved {lastSavedAt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} · Autosave on
            </span>
          </>
        ) : (
          <span>Autosave on — your edits will sync shortly after you pause editing.</span>
        )}
      </p>

      <div className="flex flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-950/50 xl:flex-row xl:min-h-[560px]">
        <aside className="max-h-48 w-full shrink-0 overflow-y-auto border-b border-slate-700 xl:max-h-none xl:w-56 xl:border-b-0 xl:border-r">
          <p className="border-b border-slate-700/80 p-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Modules
          </p>
          <nav className="p-2" aria-label="Module list">
            {modules.map((m, idx) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setActiveModuleId(m.id)}
                className={cn(
                  'mb-1 w-full rounded-lg px-3 py-2 text-left text-sm transition-colors',
                  activeModule?.id === m.id
                    ? 'bg-indigo-500/20 text-indigo-200'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                )}
              >
                <span className="text-slate-600">{idx + 1}.</span> {m.title}
              </button>
            ))}
          </nav>
        </aside>

        <div className="relative min-h-[320px] min-w-0 flex-1">
          <div className="max-h-[min(70vh,calc(100vh-280px))] overflow-y-auto p-4 pb-24">
            {activeModule ? (
              <>
                <h3 className="mb-4 text-lg font-semibold text-white">{activeModule.title}</h3>
                <CourseModuleContent module={activeModule} wrapRegion={wrapRegion} />
                {activeScorm ? (
                  <ScormExtractedTextEditor
                    courseId={courseId}
                    moduleId={activeModule.id}
                    content={activeScorm}
                    onSaved={(next) => {
                      const id = activeModule.id
                      const cur = modulesRef.current.find((m) => m.id === id)
                      if (cur && !contentEqual(cur.content as ModuleContent, next)) {
                        pushPast(id, cloneModuleContent(cur.content as ModuleContent))
                        clearFuture(id)
                        historyThrottleRef.current.set(id, Date.now())
                        bumpHistory()
                      }
                      setModules((prev) => prev.map((m) => (m.id === id ? { ...m, content: next } : m)))
                      setPendingAutosave(false)
                      setLastSavedAt(new Date())
                    }}
                  />
                ) : null}
              </>
            ) : (
              <p className="text-sm text-slate-500">No module to edit.</p>
            )}
          </div>
          <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 w-[calc(100%-1rem)] max-w-xl -translate-x-1/2 px-2">
            <CourseCanvasFloatingBar
              activeKey={activeKey}
              content={activeModule?.content as ModuleContent | null | undefined}
              courseId={courseId}
              onContentChange={handleContentChange}
              onClearSelection={() => setActiveKey(null)}
              className="pointer-events-auto"
            />
          </div>
        </div>

        <aside
          id="course-wysiwyg-inspector"
          className="max-h-96 w-full shrink-0 overflow-y-auto border-t border-slate-700 bg-slate-900/80 xl:max-h-none xl:w-[380px] xl:border-l xl:border-t-0"
        >
          <CourseWysiwygInspector
            content={activeModule?.content as ModuleContent | null | undefined}
            activeKey={activeKey}
            onContentChange={handleContentChange}
            courseId={courseId}
            className="min-h-[240px] xl:min-h-full"
          />
        </aside>
      </div>
    </section>
  )
}
