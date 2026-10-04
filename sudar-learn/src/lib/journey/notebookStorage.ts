import type {
  JourneyNotebookSnapshot,
  NotebookPage,
  SudarNotesNotebookState,
} from '@/types/journeyNotebook'
import {
  JOURNEY_NOTEBOOK_MAX_PAGES,
  LEGACY_NOTEBOOK_STORAGE_KEY,
  NOTEBOOK_STORAGE_KEY,
  WORKING_MEMORY_STORAGE_KEY,
  defaultNotebookState,
} from '@/types/journeyNotebook'
import type { TutorBlock } from '@/types/tutor'
import type { SudarNotesSessionState, SudarNotesWorkingMemory } from '@/types/sudarNotes'
import { emptyWorkingMemory } from '@/types/sudarNotes'

/** Drop malformed pages / memory from an untrusted snapshot (server PUT body or GET result). */
export function sanitizeNotebookSnapshot(input: {
  pages?: unknown
  working_memory?: unknown
  session?: unknown
}): JourneyNotebookSnapshot {
  const pages = Array.isArray(input.pages)
    ? input.pages.filter(isNotebookPage).slice(-JOURNEY_NOTEBOOK_MAX_PAGES)
    : []
  const session = isSudarNotesSession(input.session) ? input.session : null
  return {
    version: 1,
    pages,
    working_memory: isWorkingMemory(input.working_memory)
      ? input.working_memory
      : session?.working_memory ?? emptyWorkingMemory(),
    session,
  }
}

function isSudarNotesSession(value: unknown): value is SudarNotesSessionState {
  if (!value || typeof value !== 'object') return false
  const o = value as Record<string, unknown>
  return (
    typeof o.mode === 'string' &&
    typeof o.turns_since_check === 'number' &&
    typeof o.substantive_turn_count === 'number' &&
    typeof o.intake_complete === 'boolean' &&
    isWorkingMemory(o.working_memory)
  )
}

function isTutorBlock(value: unknown): value is TutorBlock {
  if (!value || typeof value !== 'object') return false
  const o = value as Record<string, unknown>
  return typeof o.id === 'string' && typeof o.type === 'string' && o.payload != null
}

function isNotebookPage(value: unknown): value is NotebookPage {
  if (!value || typeof value !== 'object') return false
  const o = value as Record<string, unknown>
  if (typeof o.id !== 'string' || typeof o.createdAt !== 'number') return false
  if (o.source !== 'sudar' && o.source !== 'keep' && o.source !== 'note') return false
  if (o.preview != null && typeof o.preview !== 'string') return false
  if (o.noteText != null && typeof o.noteText !== 'string') return false
  if (o.status != null) {
    if (
      o.status !== 'suggested' &&
      o.status !== 'accepted' &&
      o.status !== 'edited' &&
      o.status !== 'dismissed'
    ) {
      return false
    }
  }
  if (o.blocks != null) {
    if (!Array.isArray(o.blocks) || !o.blocks.every(isTutorBlock)) return false
  }
  return true
}

function isWorkingMemory(value: unknown): value is SudarNotesWorkingMemory {
  if (!value || typeof value !== 'object') return false
  const o = value as Record<string, unknown>
  return (
    (o.goal === null || typeof o.goal === 'string') &&
    (o.active_concept === null || typeof o.active_concept === 'string') &&
    Array.isArray(o.open_questions) &&
    Array.isArray(o.known) &&
    Array.isArray(o.gaps)
  )
}

export function loadNotebookPages(): NotebookPage[] {
  if (typeof window === 'undefined') return []
  try {
    let raw = sessionStorage.getItem(NOTEBOOK_STORAGE_KEY)
    if (!raw) {
      raw = sessionStorage.getItem(LEGACY_NOTEBOOK_STORAGE_KEY)
      if (raw) {
        sessionStorage.setItem(NOTEBOOK_STORAGE_KEY, raw)
        sessionStorage.removeItem(LEGACY_NOTEBOOK_STORAGE_KEY)
      }
    }
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isNotebookPage).map((p) => ({
      ...p,
      // Legacy pages without status are treated as accepted (already "in" the notebook).
      status: p.status ?? (p.source === 'sudar' ? 'accepted' : p.source === 'note' ? 'accepted' : 'accepted'),
    }))
  } catch {
    return []
  }
}

export function saveNotebookPages(pages: NotebookPage[]): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(NOTEBOOK_STORAGE_KEY, JSON.stringify(pages))
  } catch {
    // quota / private mode — ignore
  }
}

export function loadWorkingMemory(): SudarNotesWorkingMemory {
  if (typeof window === 'undefined') return emptyWorkingMemory()
  try {
    const raw = sessionStorage.getItem(WORKING_MEMORY_STORAGE_KEY)
    if (!raw) return emptyWorkingMemory()
    const parsed: unknown = JSON.parse(raw)
    if (!isWorkingMemory(parsed)) return emptyWorkingMemory()
    return parsed
  } catch {
    return emptyWorkingMemory()
  }
}

export function saveWorkingMemory(wm: SudarNotesWorkingMemory): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(WORKING_MEMORY_STORAGE_KEY, JSON.stringify(wm))
  } catch {
    // ignore
  }
}

export function loadNotebookState(): SudarNotesNotebookState {
  return {
    pages: loadNotebookPages(),
    workingMemory: loadWorkingMemory(),
  }
}

export function clearNotebookState(): SudarNotesNotebookState {
  const empty = defaultNotebookState()
  saveNotebookPages([])
  saveWorkingMemory(empty.workingMemory)
  return empty
}

/** Pages tools may use — accepted/edited learner notes only (never suggested-only or dismissed). */
export function acceptedNotebookPages(pages: NotebookPage[]): NotebookPage[] {
  return pages.filter((p) => {
    if (p.status === 'dismissed' || p.status === 'suggested') return false
    if (p.source === 'note') return Boolean((p.noteText ?? '').trim())
    return true
  })
}
