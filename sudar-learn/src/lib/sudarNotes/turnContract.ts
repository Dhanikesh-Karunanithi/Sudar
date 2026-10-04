import { z } from 'zod'
import type { SudarNotesTurnPayload } from '@/types/sudarNotes'
import {
  SUDAR_NOTES_CARD_KINDS,
  SUDAR_NOTES_CHECK_TYPES,
  SUDAR_NOTES_MODES,
} from '@/types/sudarNotes'

const stringList = z.array(z.string().trim().min(1).max(240)).max(8)

const workingMemoryPatchSchema = z
  .object({
    goal: z.string().trim().min(1).max(400).nullable().optional(),
    active_concept: z.string().trim().min(1).max(200).nullable().optional(),
    open_questions: stringList.optional(),
    known: stringList.optional(),
    gaps: stringList.optional(),
  })
  .strict()

const noteOpSchema = z.object({
  op: z.enum(['suggest', 'update']),
  card_id: z.string().trim().min(1).max(64).optional(),
  kind: z.enum(SUDAR_NOTES_CARD_KINDS),
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(2000),
})

const checkSchema = z.object({
  type: z.enum(SUDAR_NOTES_CHECK_TYPES),
  prompt: z.string().trim().min(1).max(400),
})

export const sudarNotesTurnSchema = z.object({
  mode: z.enum(SUDAR_NOTES_MODES),
  working_memory_patch: workingMemoryPatchSchema.nullable().optional(),
  note_ops: z.array(noteOpSchema).max(3).optional(),
  check: checkSchema.nullable().optional(),
  next_hint: z.string().trim().max(400).nullable().optional(),
})

export type ParsedSudarNotesTurn = {
  chatMarkdown: string
  turn: SudarNotesTurnPayload | null
  malformed: boolean
}

function cleanChatMarkdown(input: string): string {
  return input
    .replace(/^\s*`{3,}\s*json\s*$/gim, '')
    .replace(/^\s*`{3,}\s*$/gim, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Split assistant output into chat markdown + optional SUDAR_NOTES JSON.
 * Also strips legacy BLOCKS/ACTIONS from the chat body when present (caller may re-parse those).
 */
export function parseSudarNotesModelOutput(rawResponse: string): ParsedSudarNotesTurn {
  const raw = rawResponse.trim()
  let textPart = raw
  let notesPart: string | null = null
  let malformed = false

  const markerMatch = raw.match(/\nSUDAR_NOTES:\s*([\s\S]+)$/i)
  if (markerMatch && typeof markerMatch.index === 'number') {
    textPart = raw.slice(0, markerMatch.index).trimEnd()
    notesPart = markerMatch[1].trim()
  }

  // If BLOCKS/ACTIONS follow SUDAR_NOTES, keep only the JSON object for notes
  if (notesPart) {
    const cutBlocks = notesPart.search(/\n(?:BLOCKS|ACTIONS):\s*/i)
    if (cutBlocks >= 0) {
      notesPart = notesPart.slice(0, cutBlocks).trim()
    }
    // Trim trailing fence
    notesPart = notesPart.replace(/```\s*$/g, '').trim()
    const objMatch = notesPart.match(/\{[\s\S]*\}/)
    notesPart = objMatch ? objMatch[0] : notesPart
  }

  let turn: SudarNotesTurnPayload | null = null
  if (notesPart) {
    try {
      const parsed: unknown = JSON.parse(notesPart)
      const result = sudarNotesTurnSchema.safeParse(parsed)
      if (result.success) {
        turn = {
          mode: result.data.mode,
          working_memory_patch: result.data.working_memory_patch ?? null,
          note_ops: result.data.note_ops ?? [],
          check: result.data.check ?? null,
          next_hint: result.data.next_hint ?? null,
        }
      } else {
        malformed = true
      }
    } catch {
      malformed = true
    }
  }

  // Strip SUDAR_NOTES / BLOCKS / ACTIONS leftovers from chat body
  let chat = textPart
    .replace(/\n?SUDAR_NOTES:\s*[\s\S]*$/i, '')
    .replace(/\n?BLOCKS:\s*[\s\S]*$/i, '')
    .replace(/\n?ACTIONS:\s*[\s\S]*$/i, '')

  chat = cleanChatMarkdown(chat)

  return { chatMarkdown: chat, turn, malformed }
}

export function isSudarNotesRoute(route: string | undefined | null): boolean {
  if (!route || typeof route !== 'string') return false
  return route.includes('/journey') || route.includes('/notes')
}
