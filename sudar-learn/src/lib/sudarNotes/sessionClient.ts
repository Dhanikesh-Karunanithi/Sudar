import type { SudarNotesSessionState } from '@/types/sudarNotes'
import { emptySudarNotesSession } from '@/types/sudarNotes'
import { emptyWorkingMemory } from '@/types/sudarNotes'

export const SUDAR_NOTES_SESSION_KEY = 'sudar.notes.session'

function isSession(value: unknown): value is SudarNotesSessionState {
  if (!value || typeof value !== 'object') return false
  const o = value as Record<string, unknown>
  return (
    typeof o.mode === 'string' &&
    typeof o.turns_since_check === 'number' &&
    typeof o.substantive_turn_count === 'number' &&
    typeof o.intake_complete === 'boolean' &&
    o.working_memory != null &&
    typeof o.working_memory === 'object'
  )
}

export function loadSudarNotesSession(): SudarNotesSessionState {
  if (typeof window === 'undefined') return emptySudarNotesSession()
  try {
    const raw = sessionStorage.getItem(SUDAR_NOTES_SESSION_KEY)
    if (!raw) return emptySudarNotesSession()
    const parsed: unknown = JSON.parse(raw)
    if (!isSession(parsed)) return emptySudarNotesSession()
    return {
      ...parsed,
      working_memory: {
        ...emptyWorkingMemory(),
        ...parsed.working_memory,
      },
    }
  } catch {
    return emptySudarNotesSession()
  }
}

export function saveSudarNotesSession(session: SudarNotesSessionState): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(SUDAR_NOTES_SESSION_KEY, JSON.stringify(session))
  } catch {
    // ignore
  }
}

export function clearSudarNotesSession(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(SUDAR_NOTES_SESSION_KEY)
  } catch {
    // ignore
  }
}
