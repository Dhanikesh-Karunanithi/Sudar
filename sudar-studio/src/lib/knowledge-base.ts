export type KnowledgeBaseRow = {
  id: string
  name: string
  description: string | null
  scope: 'org' | 'subject' | 'course'
  course_id: string | null
  completed_uploads?: number
  created_at?: string
}

export async function listKnowledgeBases(): Promise<KnowledgeBaseRow[]> {
  const res = await fetch('/api/kb')
  if (!res.ok) throw new Error('Failed to load knowledge bases')
  const data = await res.json()
  return data.knowledge_bases ?? []
}

export async function createKnowledgeBase(input: {
  name: string
  description?: string
  scope?: 'org' | 'subject' | 'course'
  course_id?: string | null
}): Promise<KnowledgeBaseRow> {
  const res = await fetch('/api/kb', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? 'Create failed')
  }
  const data = await res.json()
  return data.knowledge_base
}

export async function uploadFileToKb(kbId: string, file: File): Promise<{ queueId: string }> {
  const form = new FormData()
  form.append('kb_id', kbId)
  form.append('file', file)
  const res = await fetch('/api/kb/upload', { method: 'POST', body: form })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? 'Upload failed')
  }
  const data = await res.json()
  return { queueId: data.queueId as string }
}

export async function trackQueueProgress(queueId: string): Promise<{
  status: string
  progress_pct: number
  chunk_count: number | null
  error_message: string | null
  preview: string | null
}> {
  const res = await fetch(`/api/kb/queue-status?queueId=${encodeURIComponent(queueId)}`)
  if (!res.ok) throw new Error('Status check failed')
  return res.json()
}
