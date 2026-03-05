'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BookOpen, Sparkles, LayoutList, CheckCircle2, Loader2, Package, FileText, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

const difficulties = [
  { value: 'beginner', label: 'Beginner', desc: 'No prior knowledge required' },
  { value: 'intermediate', label: 'Intermediate', desc: 'Some familiarity expected' },
  { value: 'advanced', label: 'Advanced', desc: 'Deep expertise required' },
]

const numModulesOptions = [3, 5, 7, 10]

type Mode = 'choose' | 'ai' | 'manual' | 'document' | 'scorm'

const AI_STEPS = [
  'Creating course...',
  'Generating course outline...',
  'Writing module 1...',
  'Writing module 2...',
  'Writing module 3...',
  'Writing module 4...',
  'Writing module 5...',
  'Finalising course...',
]

export default function NewCoursePage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('choose')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [difficulty, setDifficulty] = useState('intermediate')
  const [numModules, setNumModules] = useState(5)
  const [loading, setLoading] = useState(false)
  const [aiStep, setAiStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [documentUrl, setDocumentUrl] = useState('')
  const [scormFile, setScormFile] = useState<File | null>(null)

  // ─── AI generation ──────────────────────────────────────────────
  async function handleCreateWithAI(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true); setError(null); setAiStep(0)

    // Advance step indicator while waiting
    const stepInterval = setInterval(() => {
      setAiStep((s) => Math.min(s + 1, AI_STEPS.length - 1))
    }, 3500)

    const res = await fetch('/api/ai/generate-course', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), description: description.trim() || null, difficulty, num_modules: numModules }),
    })

    clearInterval(stepInterval)

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Generation failed')
      setLoading(false)
      return
    }

    const { course_id } = await res.json()
    router.push(`/courses/${course_id}`)
  }

  // ─── Manual creation ─────────────────────────────────────────────
  async function handleCreateManual(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true); setError(null)

    const res = await fetch('/api/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), description: description.trim() || null, difficulty }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed to create course')
      setLoading(false)
      return
    }

    const { id } = await res.json()
    router.push(`/courses/${id}`)
  }

  // ─── Import from document (RAG) ─────────────────────────────────
  async function handleImportFromDocument(e: React.FormEvent) {
    e.preventDefault()
    if (!documentFile && !documentUrl.trim()) return
    setLoading(true)
    setError(null)
    setAiStep(0)
    const stepInterval = setInterval(() => setAiStep((s) => Math.min(s + 1, AI_STEPS.length - 1)), 3500)
    try {
      let res: Response
      if (documentFile) {
        const form = new FormData()
        form.append('file', documentFile)
        res = await fetch('/api/ai/generate-from-document', { method: 'POST', body: form })
      } else {
        res = await fetch('/api/ai/generate-from-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: documentUrl.trim() }),
        })
      }
      clearInterval(stepInterval)
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Import failed')
        setLoading(false)
        return
      }
      const { course_id } = await res.json()
      router.push(`/courses/${course_id}`)
    } catch {
      clearInterval(stepInterval)
      setError('Import failed')
      setLoading(false)
    }
  }

  // ─── Import SCORM ───────────────────────────────────────────────
  async function handleImportScorm(e: React.FormEvent) {
    e.preventDefault()
    if (!scormFile) return
    setLoading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', scormFile)
      const res = await fetch('/api/courses/import-scorm', { method: 'POST', body: form })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'SCORM import failed')
        setLoading(false)
        return
      }
      const { course_id } = await res.json()
      router.push(`/courses/${course_id}`)
    } catch {
      setError('SCORM import failed')
      setLoading(false)
    }
  }

  // ─── AI loading overlay ───────────────────────────────────────────
  if (loading && (mode === 'ai' || mode === 'document')) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-violet-600/15 border border-violet-500/20 flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8 text-violet-400 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-white">Sudar is building your course</h2>
            <p className="text-slate-400 text-sm">This takes about 30–60 seconds for a full course.</p>
          </div>

          {/* Step indicator */}
          <div className="space-y-2">
            {AI_STEPS.slice(0, Math.min(aiStep + 1, 3)).map((step, i) => (
              <div key={i} className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all',
                i === aiStep ? 'bg-violet-600/15 border border-violet-500/20 text-violet-200' : 'text-slate-500'
              )}>
                {i < aiStep ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                ) : (
                  <Loader2 className="w-4 h-4 text-violet-400 animate-spin shrink-0" />
                )}
                {step}
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 rounded-full h-1.5">
            <div
              className="bg-gradient-to-r from-violet-500 to-indigo-500 h-1.5 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(100, (aiStep / (AI_STEPS.length - 1)) * 100)}%` }}
            />
          </div>
          <p className="text-slate-600 text-xs">Do not close this tab</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <Link href="/courses" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" />Back to courses
      </Link>

      {/* Mode selector */}
      {mode === 'choose' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-semibold text-white">New course</h1>
            <p className="text-slate-400 text-sm mt-1">How would you like to create this course?</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* AI option */}
            <button
              onClick={() => setMode('ai')}
              className="group text-left bg-slate-900 border border-violet-500/30 hover:border-violet-400 rounded-xl p-6 space-y-3 transition-all hover:bg-violet-950/20"
            >
              <div className="w-12 h-12 rounded-xl bg-violet-600/15 border border-violet-500/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-violet-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Create with AI</h3>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                  Sudar generates the full course outline and writes every module automatically. Ready in ~60 seconds.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['Outline', 'All modules', 'Full content'].map((t) => (
                  <span key={t} className="text-[10px] px-2 py-0.5 bg-violet-600/15 text-violet-300 rounded-full border border-violet-500/20">{t}</span>
                ))}
              </div>
            </button>

            {/* Manual option */}
            <button
              onClick={() => setMode('manual')}
              className="group text-left bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-xl p-6 space-y-3 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                <LayoutList className="w-6 h-6 text-slate-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Build manually</h3>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                  Start with an empty course and write your own modules. You can still use AI on individual modules.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['Full control', 'AI on demand'].map((t) => (
                  <span key={t} className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full border border-slate-700">{t}</span>
                ))}
              </div>
            </button>

          {/* Import from document */}
            <button
              onClick={() => setMode('document')}
              className="group text-left bg-slate-900 border border-emerald-500/30 hover:border-emerald-400 rounded-xl p-6 space-y-3 transition-all hover:bg-emerald-950/20"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-600/15 border border-emerald-500/20 flex items-center justify-center">
                <FileText className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Import from document</h3>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                  Upload a PDF or DOCX, or paste a URL. Sudar extracts text and generates a course from it (RAG).
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['PDF', 'DOCX', 'URL'].map((t) => (
                  <span key={t} className="text-[10px] px-2 py-0.5 bg-emerald-600/15 text-emerald-300 rounded-full border border-emerald-500/20">{t}</span>
                ))}
              </div>
            </button>

            {/* Import SCORM */}
            <button
              onClick={() => setMode('scorm')}
              className="group text-left bg-slate-900 border border-amber-500/30 hover:border-amber-400 rounded-xl p-6 space-y-3 transition-all hover:bg-amber-950/20"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-600/15 border border-amber-500/20 flex items-center justify-center">
                <Package className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Import SCORM</h3>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                  Upload a SCORM 1.2 ZIP. We create a course and modules; you can edit it like any other course.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['SCORM 1.2', 'Edit after import'].map((t) => (
                  <span key={t} className="text-[10px] px-2 py-0.5 bg-amber-600/15 text-amber-300 rounded-full border border-amber-500/20">{t}</span>
                ))}
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Shared form */}
      {mode !== 'choose' && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className={cn(
              'w-12 h-12 rounded-xl border flex items-center justify-center',
              mode === 'ai' ? 'bg-violet-600/15 border-violet-500/20' :
              mode === 'document' ? 'bg-emerald-600/15 border-emerald-500/20' :
              mode === 'scorm' ? 'bg-amber-600/15 border-amber-500/20' : 'bg-slate-800 border-slate-700'
            )}>
              {mode === 'ai' ? <Sparkles className="w-6 h-6 text-violet-400" /> : mode === 'document' ? <FileText className="w-6 h-6 text-emerald-400" /> : mode === 'scorm' ? <Package className="w-6 h-6 text-amber-400" /> : <BookOpen className="w-6 h-6 text-slate-400" />}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">
                {mode === 'ai' ? 'Create with AI' : mode === 'document' ? 'Import from document' : mode === 'scorm' ? 'Import SCORM' : 'Build manually'}
              </h1>
              <button onClick={() => setMode('choose')} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                ← Change mode
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>
          )}

          {mode === 'document' && (
            <form onSubmit={handleImportFromDocument} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Upload PDF or DOCX</label>
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                  onChange={(e) => setDocumentFile(e.target.files?.[0] ?? null)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-emerald-600/20 file:text-emerald-300 file:text-sm text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Or paste a URL</label>
                <input
                  type="url"
                  value={documentUrl}
                  onChange={(e) => setDocumentUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={loading || (!documentFile && !documentUrl.trim())}
                  className="flex-1 py-2.5 font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-sm flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {loading ? 'Generating course...' : 'Generate course from document'}
                </button>
                <Link href="/courses" className="px-4 py-2.5 text-slate-400 hover:text-slate-200 text-sm font-medium rounded-lg hover:bg-slate-800 transition-all">Cancel</Link>
              </div>
            </form>
          )}

          {mode === 'scorm' && (
            <form onSubmit={handleImportScorm} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">SCORM 1.2 ZIP file <span className="text-red-400">*</span></label>
                <input
                  type="file"
                  accept=".zip,application/zip"
                  onChange={(e) => setScormFile(e.target.files?.[0] ?? null)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-amber-600/20 file:text-amber-300 file:text-sm text-sm"
                />
                <p className="text-xs text-slate-500">We create a course and modules. You can edit it like any other course after import.</p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={loading || !scormFile}
                  className="flex-1 py-2.5 font-medium rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-sm flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
                  {loading ? 'Importing...' : 'Import SCORM'}
                </button>
                <Link href="/courses" className="px-4 py-2.5 text-slate-400 hover:text-slate-200 text-sm font-medium rounded-lg hover:bg-slate-800 transition-all">Cancel</Link>
              </div>
            </form>
          )}

          {mode !== 'document' && mode !== 'scorm' && (
          <form onSubmit={mode === 'ai' ? handleCreateWithAI : handleCreateManual} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Course title <span className="text-red-400">*</span></label>
              <input
                type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
                placeholder="e.g. Introduction to Cybersecurity"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">
                Description{' '}
                {mode === 'ai' && <span className="text-violet-400 text-xs font-normal">(helps AI write better content)</span>}
                {mode === 'manual' && <span className="text-slate-600 text-xs font-normal">(optional)</span>}
              </label>
              <textarea
                value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                placeholder={mode === 'ai' ? 'What will learners achieve? What level are they at? The more detail, the better the AI output.' : 'What will learners achieve?'}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Difficulty</label>
              <div className="grid grid-cols-3 gap-3">
                {difficulties.map((d) => (
                  <button key={d.value} type="button" onClick={() => setDifficulty(d.value)}
                    className={cn('p-3 rounded-lg border text-left transition-all',
                      difficulty === d.value ? 'border-indigo-500 bg-indigo-600/10 text-white' : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                    )}>
                    <p className="text-sm font-medium">{d.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{d.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {mode === 'ai' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Number of modules</label>
                <div className="flex gap-2">
                  {numModulesOptions.map((n) => (
                    <button key={n} type="button" onClick={() => setNumModules(n)}
                      className={cn('px-4 py-2 rounded-lg border text-sm font-medium transition-all',
                        numModules === n ? 'border-indigo-500 bg-indigo-600/10 text-white' : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                      )}>
                      {n}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-600">Each module will be ~500 words of structured content.</p>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={loading || !title.trim()}
                className={cn('flex-1 py-2.5 font-medium rounded-lg transition-colors text-sm flex items-center justify-center gap-2',
                  mode === 'ai'
                    ? 'bg-violet-600 hover:bg-violet-500 disabled:bg-slate-800 disabled:text-slate-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white'
                )}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === 'ai' ? <Sparkles className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                {loading ? 'Creating...' : mode === 'ai' ? `Generate ${numModules}-module course` : 'Create course'}
              </button>
              <Link href="/courses" className="px-4 py-2.5 text-slate-400 hover:text-slate-200 text-sm font-medium rounded-lg hover:bg-slate-800 transition-all">
                Cancel
              </Link>
            </div>
          </form>
          )}
        </div>
      )}
    </div>
  )
}
