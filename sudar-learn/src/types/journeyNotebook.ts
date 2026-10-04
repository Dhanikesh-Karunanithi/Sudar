import type { TutorBlock } from '@/types/tutor'
import type { SudarNotesNoteOp, SudarNotesWorkingMemory } from '@/types/sudarNotes'
import { emptyWorkingMemory } from '@/types/sudarNotes'

export type NotebookPageSource = 'sudar' | 'keep' | 'note'

export type NotebookCardStatus = 'suggested' | 'accepted' | 'edited' | 'dismissed'

export interface NotebookPage {
  id: string
  createdAt: number
  source: NotebookPageSource
  preview?: string
  blocks?: TutorBlock[]
  noteText?: string
  /** Learner-owned lifecycle for Sudar-suggested cards. */
  status?: NotebookCardStatus
  /** Optional link to pedagogical card kind from SudarNotes. */
  cardKind?: string
  updatedAt?: number
}

export interface SudarNotesNotebookState {
  pages: NotebookPage[]
  workingMemory: SudarNotesWorkingMemory
}

/** Server copy of a learner's SudarNotes (`sudar_notes_sessions.state`, thread_key `journey`). */
export interface JourneyNotebookSnapshot {
  version: 1
  pages: NotebookPage[]
  working_memory: SudarNotesWorkingMemory
  session: import('@/types/sudarNotes').SudarNotesSessionState | null
}

export const JOURNEY_NOTEBOOK_THREAD_KEY = 'journey'
export const JOURNEY_NOTEBOOK_MAX_PAGES = 300
export const JOURNEY_NOTEBOOK_MAX_BYTES = 1_000_000

export const NOTEBOOK_STORAGE_KEY = 'sudar.notes.notebook'
/** Legacy Journey key — migrated on load. */
export const LEGACY_NOTEBOOK_STORAGE_KEY = 'sudar.journey.notebook'
export const WORKING_MEMORY_STORAGE_KEY = 'sudar.notes.working_memory'

export function defaultNotebookState(): SudarNotesNotebookState {
  return {
    pages: [],
    workingMemory: emptyWorkingMemory(),
  }
}

/** Convert SudarNotes note_ops into concept_card / lesson-ish tutor blocks (suggested pages). */
export function noteOpsToTutorBlocks(ops: SudarNotesNoteOp[]): TutorBlock[] {
  const blocks: TutorBlock[] = []
  for (const op of ops) {
    if (op.op !== 'suggest' && op.op !== 'update') continue
    const id = op.card_id?.trim() || `note-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
    if (op.kind === 'lesson_chunk') {
      const safeBody = op.body
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br/>')
      blocks.push({
        id,
        type: 'lesson_html',
        payload: {
          title: op.title,
          html: `<p>${safeBody}</p>`,
          duration_mins: 3,
        },
      })
      continue
    }
    const payload: Record<string, unknown> = {
      title: op.title,
      key_idea: op.body,
    }
    if (op.kind === 'misconception') payload.misconception = op.body
    if (op.kind === 'example') payload.analogy = op.body
    blocks.push({
      id,
      type: 'concept_card',
      payload,
    })
  }
  return blocks
}
