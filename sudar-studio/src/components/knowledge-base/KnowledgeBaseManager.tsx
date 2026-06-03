'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { BookOpen, Loader2, Plus, Upload } from 'lucide-react'
import {
  createKnowledgeBase,
  listKnowledgeBases,
  trackQueueProgress,
  uploadFileToKb,
  type KnowledgeBaseRow,
} from '@/lib/knowledge-base'

export function KnowledgeBaseManager() {
  const [loading, setLoading] = useState(true)
  const [kbs, setKbs] = useState<KnowledgeBaseRow[]>([])
  const [selectedKbId, setSelectedKbId] = useState<string>('')
  const [newName, setNewName] = useState('')
  const [newScope, setNewScope] = useState<'org' | 'subject' | 'course'>('org')
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
    setError(null)
    try {
      const list = await listKnowledgeBases()
      setKbs(list)
      if (!selectedKbId && list[0]?.id) setSelectedKbId(list[0].id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load failed')
    } finally {
      setLoading(false)
    }
  }, [selectedKbId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!queueId) return
    const poll = async () => {
      try {
        const s = await trackQueueProgress(queueId)
        setQueueStatus(s)
        if (s.status === 'completed' || s.status === 'failed') {
          if (pollRef.current) clearInterval(pollRef.current)
          void load()
        }
      } catch {
        /* ignore transient */
      }
    }
    void poll()
    pollRef.current = setInterval(() => void poll(), 2000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [queueId, load])

  async function handleCreate() {
    if (!newName.trim()) return
    setError(null)
    try {
      const kb = await createKnowledgeBase({ name: newName.trim(), scope: newScope })
      setNewName('')
      setSelectedKbId(kb.id)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Create failed')
    }
  }

  async function handleUpload(file: File) {
    if (!selectedKbId) {
      setError('Select or create a knowledge base first')
      return
    }
    setError(null)
    setQueueStatus(null)
    try {
      const { queueId: qid } = await uploadFileToKb(selectedKbId, file)
      setQueueId(qid)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    }
  }

  async function handleRetry() {
    if (!queueId) return
    const res = await fetch('/api/kb/retry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queue_id: queueId }),
    })
    if (!res.ok) {
      setError('Retry failed')
      return
    }
    setQueueStatus({ status: 'pending', progress_pct: 0, chunk_count: null, error_message: null })
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border p-5 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Knowledge bases
        </h2>
        <p className="text-sm text-muted-foreground">
          Upload PDFs, Office files, images, and more. Documents are converted with MarkItDown, chunked, and indexed for Sudar RAG.
        </p>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading…
          </div>
        ) : (
          <div className="space-y-3">
            <select
              className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background"
              value={selectedKbId}
              onChange={(e) => setSelectedKbId(e.target.value)}
            >
              <option value="">Select knowledge base</option>
              {kbs.map((kb) => (
                <option key={kb.id} value={kb.id}>
                  {kb.name} ({kb.scope}) — {kb.completed_uploads ?? 0} docs indexed
                </option>
              ))}
            </select>

            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                placeholder="New knowledge base name"
                className="flex-1 min-w-[200px] rounded-lg border border-border px-3 py-2 text-sm"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <select
                className="rounded-lg border border-border px-3 py-2 text-sm"
                value={newScope}
                onChange={(e) => setNewScope(e.target.value as 'org' | 'subject' | 'course')}
              >
                <option value="org">Org-wide</option>
                <option value="subject">Subject</option>
                <option value="course">Course</option>
              </select>
              <button
                type="button"
                onClick={() => void handleCreate()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Create
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border p-5 space-y-4">
        <h3 className="font-medium flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Upload document
        </h3>
        <input
          type="file"
          accept=".pdf,.docx,.pptx,.xlsx,.xls,.html,.csv,.json,.xml,.epub,.zip,image/*,audio/*,video/*"
          className="block w-full text-sm"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void handleUpload(f)
            e.target.value = ''
          }}
        />
        {queueStatus && (
          <div className="text-sm space-y-2 rounded-lg bg-muted/40 p-3">
            <p>
              Status: <strong>{queueStatus.status}</strong>
              {queueStatus.progress_pct > 0 ? ` (${queueStatus.progress_pct}%)` : ''}
            </p>
            {queueStatus.status === 'completed' && queueStatus.chunk_count != null && (
              <p className="text-green-700 dark:text-green-400">
                Indexed {queueStatus.chunk_count} chunks successfully.
              </p>
            )}
            {queueStatus.error_message && (
              <p className="text-red-600">{queueStatus.error_message}</p>
            )}
            {queueStatus.status === 'failed' && (
              <button
                type="button"
                className="text-sm underline"
                onClick={() => void handleRetry()}
              >
                Retry processing
              </button>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
