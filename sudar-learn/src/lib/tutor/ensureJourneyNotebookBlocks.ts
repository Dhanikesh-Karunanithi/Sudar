import { JOURNEY_CANVAS_BLOCK_TYPES, type TutorBlock } from '@/types/tutor'
import { sanitizeLessonHtml } from '@/lib/tutor/sanitizeLessonHtml'
import {
  proseToSimpleLessonHtml,
  textLooksLikeHtml,
  normalizeTutorDisplayText,
} from '@/lib/tutor/normalizeTutorDisplayText'

function hasJourneyCanvasBlock(blocks: TutorBlock[]): boolean {
  return blocks.some((b) => (JOURNEY_CANVAS_BLOCK_TYPES as readonly string[]).includes(b.type))
}

function inferTitle(text: string): string {
  const md = normalizeTutorDisplayText(text)
  const h2 = md.match(/^##\s+(.+)$/m)
  if (h2?.[1]) return h2[1].trim().slice(0, 120)
  const h1 = md.match(/^#\s+(.+)$/m)
  if (h1?.[1]) return h1[1].trim().slice(0, 120)
  const firstLine = md.split('\n').map((l) => l.trim()).find((l) => l.length > 0)
  if (firstLine && firstLine.length <= 80) return firstLine.replace(/^[*_`#\-\d.]+\s*/, '').slice(0, 120)
  return 'Lesson'
}

export type EnsureJourneyNotebookOptions = {
  /**
   * When false (SudarNotes default), never auto-wrap chat prose into lesson_html.
   * Note cards come from structured note_ops instead.
   */
  allowAutoLesson?: boolean
}

/**
 * When Journey teaching produced no pin-worthy BLOCKS but the chat body is a real lesson,
 * optionally synthesize a lesson_html page and shrink the chat body.
 * SudarNotes disables auto synthesis (`allowAutoLesson: false`).
 */
export function ensureJourneyNotebookBlocks(
  responseText: string,
  existingBlocks: TutorBlock[],
  opts?: EnsureJourneyNotebookOptions,
): { responseText: string; blocks: TutorBlock[] } {
  const allowAutoLesson = opts?.allowAutoLesson === true

  if (hasJourneyCanvasBlock(existingBlocks)) {
    const md = normalizeTutorDisplayText(responseText)
    const hasLesson = existingBlocks.some((b) => b.type === 'lesson_html')
    let chat = md
    if (hasLesson && md.length > 420) {
      const lead = md
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean)
        .slice(0, 2)
        .join('\n\n')
      chat = lead.length > 420 ? `${lead.slice(0, 400).trim()}…` : lead
    }
    return {
      responseText: chat,
      blocks: existingBlocks,
    }
  }

  if (!allowAutoLesson) {
    return {
      responseText: normalizeTutorDisplayText(responseText.trim()),
      blocks: existingBlocks,
    }
  }

  const trimmed = responseText.trim()
  const substantial = trimmed.length >= 120 || textLooksLikeHtml(trimmed)
  if (!substantial) {
    return {
      responseText: normalizeTutorDisplayText(trimmed),
      blocks: existingBlocks,
    }
  }

  const htmlSource = textLooksLikeHtml(trimmed)
    ? trimmed
    : proseToSimpleLessonHtml(trimmed)
  const html = sanitizeLessonHtml(htmlSource)
  if (!html.trim()) {
    return {
      responseText: normalizeTutorDisplayText(trimmed),
      blocks: existingBlocks,
    }
  }

  const title = inferTitle(trimmed)
  const lessonBlock: TutorBlock = {
    id: `lesson-auto-${Date.now().toString(36)}`,
    type: 'lesson_html',
    payload: {
      title,
      html,
      duration_mins: 5,
    },
  }

  const md = normalizeTutorDisplayText(trimmed)
  const lead = md
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join('\n\n')
  const chat = lead.length > 420 ? `${lead.slice(0, 400).trim()}…` : lead

  return {
    responseText: chat || `Here's **${title}** — I also saved it in your notebook so you can revisit it.`,
    blocks: [...existingBlocks, lessonBlock],
  }
}
