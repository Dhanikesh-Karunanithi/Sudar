'use client'

import { useCallback, useMemo, useState } from 'react'

type CreateTool = 'quiz' | 'interact' | 'cards' | 'draft' | 'media' | 'outline'

const TOOLS: { id: CreateTool; label: string; description: string }[] = [
  { id: 'quiz', label: 'SudarQuiz', description: 'MCQ quiz from text' },
  { id: 'interact', label: 'SudarInteract', description: 'Timeline, matching, tabs…' },
  { id: 'cards', label: 'SudarCards', description: 'Flashcard deck' },
  { id: 'outline', label: 'Outline', description: 'Course module titles' },
  { id: 'draft', label: 'SudarDraft', description: 'Document → outline (async)' },
  { id: 'media', label: 'SudarMedia', description: 'Podcast / video job (async)' },
]

export function AlpCreateShell({
  token,
  creatorUserId,
  initialTool,
}: {
  token: string
  creatorUserId: string
  initialTool?: string | null
}) {
  const [tool, setTool] = useState<CreateTool>(
    (TOOLS.some((t) => t.id === initialTool) ? initialTool : 'quiz') as CreateTool,
  )
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultJson, setResultJson] = useState<string | null>(null)
  const [scormBase64, setScormBase64] = useState<string | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)

  const endpoint = useMemo(() => {
    const map: Record<CreateTool, string> = {
      quiz: '/api/alp/create/quiz',
      interact: '/api/alp/create/interactive',
      cards: '/api/alp/create/flashcards',
      outline: '/api/alp/create/outline',
      draft: '/api/alp/create/from-document',
      media: '/api/alp/create/media',
    }
    return map[tool]
  }, [tool])

  const buildBody = useCallback(() => {
    const exportScorm = true
    if (tool === 'quiz') {
      return {
        content,
        module_title: title || 'Quiz',
        export_format: exportScorm ? 'scorm12' : 'json',
      }
    }
    if (tool === 'interact') {
      return { content, title: title || 'Interactive', export_format: exportScorm ? 'scorm12' : 'json' }
    }
    if (tool === 'cards') {
      return { content, module_title: title || 'Flashcards', export_format: exportScorm ? 'scorm12' : 'json' }
    }
    if (tool === 'outline') {
      return { course_title: title || 'New course', description: content.slice(0, 500) || undefined, num_modules: 5 }
    }
    if (tool === 'draft') {
      return { creator_user_id: creatorUserId, text: content, course_title: title || undefined }
    }
    return {
      creator_user_id: creatorUserId,
      content,
      title: title || 'Media',
      media_type: 'podcast',
    }
  }, [content, title, tool, creatorUserId])

  const runGenerate = async () => {
    setLoading(true)
    setError(null)
    setResultJson(null)
    setScormBase64(null)
    setJobId(null)
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(buildBody()),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Generation failed')
      setResultJson(JSON.stringify(data, null, 2))
      if (data.scorm_base64) setScormBase64(data.scorm_base64)
      if (data.job_id) setJobId(data.job_id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  const downloadScorm = () => {
    if (!scormBase64) return
    const bytes = Uint8Array.from(atob(scormBase64), (c) => c.charCodeAt(0))
    const blob = new Blob([bytes], { type: 'application/zip' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title || tool}-scorm.zip`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="border-b border-slate-800 px-4 py-3">
        <h1 className="text-lg font-semibold text-white">Sudar Create</h1>
        <p className="text-xs text-slate-400">Generate content for your LMS — export SCORM or JSON</p>
      </header>

      <div className="flex flex-1 flex-col md:flex-row min-h-0">
        <nav className="md:w-52 border-b md:border-b-0 md:border-r border-slate-800 p-3 flex md:flex-col gap-1 overflow-x-auto">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTool(t.id)}
              className={`text-left rounded-lg px-3 py-2 text-sm whitespace-nowrap ${
                tool === t.id ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="font-medium block">{t.label}</span>
              <span className="text-xs opacity-80">{t.description}</span>
            </button>
          ))}
        </nav>

        <main className="flex-1 p-4 flex flex-col gap-4 min-h-0 overflow-auto">
          <label className="block">
            <span className="text-sm text-slate-400">Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
              placeholder="Activity title"
            />
          </label>

          <label className="block flex-1 flex flex-col min-h-[120px]">
            <span className="text-sm text-slate-400">
              {tool === 'outline' ? 'Course brief (optional)' : 'Source content'}
            </span>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-1 flex-1 min-h-[160px] w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-mono"
              placeholder="Paste lesson text, topic description, or document excerpt…"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={runGenerate}
              disabled={loading || (!content.trim() && tool !== 'outline')}
              className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 disabled:opacity-50"
            >
              {loading ? 'Generating…' : 'Generate'}
            </button>
            {scormBase64 && (
              <button
                type="button"
                onClick={downloadScorm}
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
              >
                Download SCORM 1.2
              </button>
            )}
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
          {jobId && (
            <p className="text-sm text-cyan-300">
              Job queued: <code className="text-xs">{jobId}</code> — poll GET /api/alp/create/jobs/{jobId}
            </p>
          )}

          {resultJson && (
            <pre className="text-xs bg-slate-900 border border-slate-800 rounded-lg p-3 overflow-auto max-h-64">
              {resultJson}
            </pre>
          )}
        </main>
      </div>
    </div>
  )
}
