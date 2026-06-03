'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, BookOpen, Loader2, Upload } from 'lucide-react'

type KbRow = { id: string; name: string; scope: string }

export default function LearnerKnowledgePage() {
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(true)
  const [kbs, setKbs] = useState<KbRow[]>([])
  const [selectedKbId, setSelectedKbId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [queueId, setQueueId] = useState<string | null>(null)
  const [queueStatus, setQueueStatus] = useState<{
    status: string
    progress_pct: number
    chunk_count: number | null
    error_message: string | null
  } | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/knowledge-base')
    setLoading(false)
    if (res.status === 403) {
      setAllowed(false)
      return
    }
    if (!res.ok) {
      setError('Could not load knowledge bases')
      return
    }
    const data = await res.json()
    const list = (data.knowledge_bases ?? []) as KbRow[]
    setKbs(list)
    if (!selectedKbId && list[0]?.id) setSelectedKbId(list[0].id)
  }, [selectedKbId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!queueId) return
    const poll = async () => {
      const res = await fetch(`/api/knowledge-base/queue-status?queueId=${encodeURIComponent(queueId)}`)
      if (!res.ok) return
      const s = await res.json()
      setQueueStatus(s)
      if (s.status === 'completed' || s.status === 'failed') {
        if (pollRef.current) clearInterval(pollRef.current)
      }
    }
    void poll()
    pollRef.current = setInterval(() => void poll(), 2000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [queueId])

  async function handleUpload(file: File) {
    if (!selectedKbId) {
      setError('Select a knowledge base')
      return
    }
    setError(null)
    const form = new FormData()
    form.append('kb_id', selectedKbId)
    form.append('file', file)
    const res = await fetch('/api/knowledge-base/upload', { method: 'POST', body: form })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError((data as { error?: string }).error ?? 'Upload failed')
      return
    }
    setQueueId((data as { queueId: string }).queueId)
  }

  if (!allowed) {
    return (
      <div className="max-w-xl mx-auto p-6">
        <Link href="/settings" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Settings
        </Link>
        <p className="mt-6 text-muted-foreground">
          Your organisation has not enabled learner knowledge uploads. Ask your admin to enable{' '}
          <code className="text-xs">knowledge_bases.allow_learner_uploads</code> in org settings.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <Link href="/settings" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" />
        Settings
      </Link>

      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="w-6 h-6" />
          Organisation knowledge
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Contribute documents your team can reference via Sudar tutor RAG.
        </p>
      </div>

      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      ) : (
        <>
          <select
            className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background"
            value={selectedKbId}
            onChange={(e) => setSelectedKbId(e.target.value)}
          >
            <option value="">Select knowledge base</option>
            {kbs.map((kb) => (
              <option key={kb.id} value={kb.id}>
                {kb.name} ({kb.scope})
              </option>
            ))}
          </select>

          <label className="flex flex-col gap-2 rounded-xl border border-dashed border-border p-6 cursor-pointer hover:bg-muted/30">
            <span className="text-sm font-medium flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload PDF or document
            </span>
            <input
              type="file"
              className="text-sm"
              accept=".pdf,.docx,.pptx,.xlsx,image/*,audio/*"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void handleUpload(f)
                e.target.value = ''
              }}
            />
          </label>

          {queueStatus && (
            <div className="text-sm rounded-lg bg-muted/40 p-3">
              <p>
                {queueStatus.status} {queueStatus.progress_pct > 0 ? `(${queueStatus.progress_pct}%)` : ''}
              </p>
              {queueStatus.status === 'completed' && queueStatus.chunk_count != null && (
                <p className="text-green-700 dark:text-green-400 mt-1">
                  {queueStatus.chunk_count} chunks indexed.
                </p>
              )}
              {queueStatus.error_message && (
                <p className="text-red-600 mt-1">{queueStatus.error_message}</p>
              )}
            </div>
          )}
        </>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
