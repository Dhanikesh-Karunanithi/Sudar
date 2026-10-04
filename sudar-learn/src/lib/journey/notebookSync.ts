import type { JourneyNotebookSnapshot } from '@/types/journeyNotebook'
import { sanitizeNotebookSnapshot } from '@/lib/journey/notebookStorage'

const ENDPOINT = '/api/journey/notebook'
const KEEPALIVE_MAX_BYTES = 60_000

/** null = nothing saved on the server yet (or offline); caller keeps the local cache. */
export async function fetchRemoteNotebook(): Promise<JourneyNotebookSnapshot | null> {
  try {
    const res = await fetch(ENDPOINT, { cache: 'no-store' })
    if (!res.ok) return null
    const body = (await res.json()) as { data?: { snapshot?: unknown } | null }
    const snap = body.data?.snapshot
    return snap && typeof snap === 'object' ? sanitizeNotebookSnapshot(snap as Record<string, unknown>) : null
  } catch {
    return null
  }
}

export async function saveRemoteNotebook(snapshot: Omit<JourneyNotebookSnapshot, 'version'>): Promise<boolean> {
  try {
    const body = JSON.stringify(snapshot)
    const res = await fetch(ENDPOINT, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body,
      // Browsers reject keepalive bodies over 64 KB.
      keepalive: body.length < KEEPALIVE_MAX_BYTES,
    })
    return res.ok
  } catch {
    return false
  }
}

export async function clearRemoteNotebook(): Promise<void> {
  try {
    await fetch(ENDPOINT, { method: 'DELETE' })
  } catch {
    /* local state is already cleared */
  }
}
