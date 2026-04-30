import { z } from 'zod'
import type { TutorAction, TutorBlock, TutorQueryResponse } from '@/types/tutor'
import { sanitizeTutorBlocks } from '@/lib/tutor/tutorBlockSanitize'
import { tutorActionSchema } from '@/lib/tutor/tutorBlockSchemas'

const rawTutorActionSchema = z.object({
  type: z.enum(['open_course', 'open_path']),
  course_id: z.string().uuid().optional(),
  path_id: z.string().uuid().optional(),
  label: z.string().trim().min(1).max(80).optional(),
})

const tutorBlockSchema = z.object({
  id: z.string().trim().min(1).max(64),
  type: z.string().trim().min(1).max(64),
  payload: z.record(z.string(), z.unknown()),
})

const tutorQueryResponseSchema = z.object({
  response: z.string().optional(),
  error: z.string().optional(),
  actions: z.array(tutorActionSchema).optional(),
  blocks: z.array(tutorBlockSchema).optional(),
  guardrail_refused: z.boolean().optional(),
  guardrail_code: z.string().optional(),
})

type RawTutorAction = z.infer<typeof rawTutorActionSchema>

export type ParsedTutorActions = {
  text: string
  rawActions: RawTutorAction[]
  malformedActions: boolean
}

function cleanTutorDisplayText(input: string): string {
  return input
    .replace(/^\s*`{3,}\s*json\s*$/gim, '')
    .replace(/^\s*`{3,}\s*$/gim, '')
    .replace(/^\s*`{3,}\s*tutor_blocks\s*$/gim, '')
    .replace(/^\s*ACTIONS:\s*$/gim, '')
    .replace(/^\s*BLOCKS:\s*$/gim, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function parseRawActionArray(candidate: string | null): { actions: RawTutorAction[]; malformed: boolean } {
  if (!candidate) return { actions: [], malformed: false }
  try {
    const parsed = JSON.parse(candidate)
    if (!Array.isArray(parsed)) return { actions: [], malformed: true }
    const normalized = parsed
      .map((item) => rawTutorActionSchema.safeParse(item))
      .filter((result) => result.success)
      .map((result) => result.data)
    return { actions: normalized, malformed: normalized.length !== parsed.length }
  } catch {
    return { actions: [], malformed: true }
  }
}

export function parseTutorActionsFromText(rawResponse: string): ParsedTutorActions {
  const raw = rawResponse.trim()
  let textPart = raw
  let actionsPart: string | null = null

  const markerMatch = raw.match(/\nACTIONS:\s*([\s\S]+)$/i)
  if (markerMatch && typeof markerMatch.index === 'number') {
    textPart = raw.slice(0, markerMatch.index).trimEnd()
    actionsPart = markerMatch[1].trim()
  } else {
    const fenceMatch = raw.match(/```json\s*([\s\S]*?)\s*```$/i)
    if (fenceMatch && typeof fenceMatch.index === 'number') {
      const fencedCandidate = fenceMatch[1].trim()
      if (fencedCandidate.startsWith('[')) {
        textPart = raw.slice(0, fenceMatch.index).trimEnd()
        actionsPart = fencedCandidate
      }
    }
  }

  const parsed = parseRawActionArray(actionsPart)
  return {
    text: cleanTutorDisplayText(textPart),
    rawActions: parsed.actions,
    malformedActions: parsed.malformed,
  }
}

function parseBlockArray(candidate: string | null): { blocks: unknown[]; malformed: boolean } {
  if (!candidate) return { blocks: [], malformed: false }
  try {
    const parsed = JSON.parse(candidate.trim())
    if (!Array.isArray(parsed)) return { blocks: [], malformed: true }
    return { blocks: parsed, malformed: false }
  } catch {
    return { blocks: [], malformed: true }
  }
}

/**
 * Strips a trailing BLOCKS: JSON array (or ```tutor_blocks``` fence) from model output.
 * Run after `parseTutorActionsFromText` if both ACTIONS and BLOCKS are present; put ACTIONS after BLOCKS in the prompt.
 */
export function parseTutorBlocksFromText(rawResponse: string): {
  text: string
  rawBlocks: unknown[]
  malformedBlocks: boolean
} {
  const raw = rawResponse.trim()
  let textPart = raw
  let blocksPart: string | null = null

  const markerMatch = raw.match(/\nBLOCKS:\s*([\s\S]+)$/i)
  if (markerMatch && typeof markerMatch.index === 'number') {
    textPart = raw.slice(0, markerMatch.index).trimEnd()
    blocksPart = markerMatch[1].trim()
  } else {
    const fenceMatch = raw.match(/```tutor_blocks\s*([\s\S]*?)\s*```\s*$/i)
    if (fenceMatch && typeof fenceMatch.index === 'number') {
      const fenced = fenceMatch[1].trim()
      if (fenced.startsWith('[')) {
        textPart = raw.slice(0, fenceMatch.index).trimEnd()
        blocksPart = fenced
      }
    }
  }

  const parsed = parseBlockArray(blocksPart)
  return {
    text: cleanTutorDisplayText(textPart),
    rawBlocks: parsed.blocks,
    malformedBlocks: parsed.malformed,
  }
}

/** Strip ACTIONS: then BLOCKS: from a single model string; returns text + raw arrays for server validation. */
export function parseTutorModelOutput(rawResponse: string): {
  text: string
  rawActions: RawTutorAction[]
  rawBlocks: unknown[]
  malformedActions: boolean
  malformedBlocks: boolean
} {
  const a = parseTutorActionsFromText(rawResponse)
  const b = parseTutorBlocksFromText(a.text)
  return {
    text: b.text,
    rawActions: a.rawActions,
    rawBlocks: b.rawBlocks,
    malformedActions: a.malformedActions,
    malformedBlocks: b.malformedBlocks,
  }
}

export function validateTutorQueryResponsePayload(payload: unknown): TutorQueryResponse {
  const parsed = tutorQueryResponseSchema.safeParse(payload)
  if (!parsed.success) {
    return { error: 'Invalid response from tutor.' }
  }
  const data = parsed.data
  const safeBlocks: TutorBlock[] | undefined = data.blocks?.length
    ? sanitizeTutorBlocks(data.blocks)
    : undefined
  return { ...data, blocks: safeBlocks }
}

export function buildSafeActionFallback(
  message = 'I had trouble preparing quick actions for that answer.',
): { response: string; blocks: Array<{ id: string; type: 'text'; payload: { content: string } }> } {
  return {
    response: message,
    blocks: [{ id: 'text-fallback', type: 'text', payload: { content: message } }],
  }
}

export function sanitizeActions(actions: TutorAction[]): TutorAction[] {
  return actions
    .map((action) => tutorActionSchema.safeParse(action))
    .filter((result) => result.success)
    .map((result) => result.data)
}

