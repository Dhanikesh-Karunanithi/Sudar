/**
 * Convert between module content (text | rich) and editor state (mainText + blocks).
 * Used by ModuleBlockEditor to persist as RichContent for Learn compatibility.
 */

import type {
  ModuleContent,
  RichContent,
  RichContentSection,
  RichInteractiveElement,
  EditorBlock,
  EditorBlockImage,
  EditorBlockExpandable,
  EditorBlockQuiz,
} from '@/types/content'
import { isRichContent } from '@/types/content'

function genId(): string {
  return `block-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

function genItemId(): string {
  return `item-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

/** Create a new timeline step with a stable id. */
export function createNewTimelineStep(): { id: string; title: string; description: string; icon?: string } {
  return { id: genItemId(), title: '', description: '' }
}

/** Create a new flipcard/flashcard card with a stable id. */
export function createNewCard(): { id: string; front: string; back: string } {
  return { id: genItemId(), front: '', back: '' }
}

/** Create a new matching pair with a stable id. */
export function createNewMatchingPair(): { id: string; term: string; definition: string } {
  return { id: genItemId(), term: '', definition: '' }
}

/** Create a new tab with a stable id. */
export function createNewTabItem(): { id: string; label: string; content: string } {
  return { id: genItemId(), label: '', content: '' }
}

/** Get plain text from module content for "has content" checks and AI context. */
export function getModuleBodyText(content: ModuleContent | null | undefined): string {
  if (!content) return ''
  if (content.type === 'text') return content.body ?? ''
  // SCORM modules are self-contained — treat as having content so AI generation is not triggered
  if (content.type === 'scorm') return `[SCORM: ${(content as { launch_url?: string }).launch_url ?? ''}]`
  if (!isRichContent(content)) return ''
  const parts: string[] = []
  if (content.introduction?.trim()) parts.push(content.introduction.trim())
  for (const s of content.sections ?? []) {
    if (s.content?.trim()) parts.push(s.content.trim())
  }
  if (content.summary?.trim()) parts.push(content.summary.trim())
  return parts.join('\n\n')
}

/** Parse content into mainText + ordered blocks for the editor. */
export function contentToMainTextAndBlocks(content: ModuleContent | null | undefined): {
  mainText: string
  blocks: EditorBlock[]
} {
  if (!content) return { mainText: '', blocks: [] }
  if (content.type === 'text') {
    return { mainText: content.body ?? '', blocks: [] }
  }
  if (!isRichContent(content)) return { mainText: '', blocks: [] }

  const blocks: EditorBlock[] = []
  const textParts: string[] = []
  if (content.introduction?.trim()) textParts.push(content.introduction.trim())

  for (const section of content.sections ?? []) {
    if (section._isBlock === true) {
      blocks.push({
        id: section._blockId ?? genId(),
        type: 'text',
        data: { content: section.content?.trim() ?? '' },
      } as EditorBlock)
    } else if (section.image?.url) {
      blocks.push({
        id: section._blockId ?? genId(),
        type: 'image',
        data: {
          url: section.image.url,
          alt: section.image.alt,
          attribution: section.image.attribution,
          alignment: section.image.alignment,
          size: section.image.size,
        },
      } as EditorBlockImage)
    } else if (section.content?.trim()) {
      textParts.push(section.content.trim())
    }
  }

  const mainText = textParts.join('\n\n')

  for (const el of content.interactiveElements ?? []) {
    const bid = el._blockId ?? genId()
    if (el.type === 'expandable' && el.data?.title != null) {
      blocks.push({
        id: bid,
        type: 'expandable',
        data: {
          title: String(el.data.title),
          content: String(el.data.content ?? ''),
        },
      } as EditorBlockExpandable)
    } else if (el.type === 'quiz') {
      blocks.push({
        id: bid,
        type: 'quiz',
        data: {
          question: el.data?.question != null ? String(el.data.question) : undefined,
          options: Array.isArray(el.data?.options) ? (el.data.options as string[]) : undefined,
          correctAnswer: el.data?.correctAnswer != null ? String(el.data.correctAnswer) : undefined,
          explanation: el.data?.explanation != null ? String(el.data.explanation) : undefined,
        },
      } as EditorBlockQuiz)
    } else if (el.type === 'video' && el.data?.url) {
      blocks.push({
        id: bid,
        type: 'video',
        data: { url: String(el.data.url), title: el.data.title != null ? String(el.data.title) : undefined },
      })
    } else if (el.type === 'timeline' && Array.isArray(el.data?.steps)) {
      blocks.push({
        id: bid,
        type: 'timeline',
        data: {
          steps: (el.data.steps as { id?: string; title?: string; description?: string; icon?: string }[]).map((s) => ({
            id: (s as { id?: string }).id ?? genItemId(),
            title: String(s?.title ?? ''),
            description: String(s?.description ?? ''),
            icon: s?.icon != null ? String(s.icon) : undefined,
          })),
        },
      })
    } else if (el.type === 'flipcard' && Array.isArray(el.data?.cards)) {
      blocks.push({
        id: bid,
        type: 'flipcard',
        data: {
          cards: (el.data.cards as { id?: string; front?: string; back?: string }[]).map((c) => ({
            id: (c as { id?: string }).id ?? genItemId(),
            front: String(c?.front ?? ''),
            back: String(c?.back ?? ''),
          })),
        },
      })
    } else if (el.type === 'hotspot' && el.data?.imageUrl != null && Array.isArray(el.data?.spots)) {
      blocks.push({
        id: bid,
        type: 'hotspot',
        data: {
          imageUrl: String(el.data.imageUrl),
          spots: (el.data.spots as { x?: number; y?: number; label?: string; content?: string }[]).map((s) => ({
            x: Number(s?.x ?? 0),
            y: Number(s?.y ?? 0),
            label: String(s?.label ?? ''),
            content: String(s?.content ?? ''),
          })),
        },
      })
    } else if (el.type === 'matching' && Array.isArray(el.data?.pairs)) {
      blocks.push({
        id: bid,
        type: 'matching',
        data: {
          pairs: (el.data.pairs as { id?: string; term?: string; definition?: string }[]).map((p) => ({
            id: (p as { id?: string }).id ?? genItemId(),
            term: String(p?.term ?? ''),
            definition: String(p?.definition ?? ''),
          })),
          instruction: el.data.instruction != null ? String(el.data.instruction) : undefined,
        },
      })
    } else if (el.type === 'tabs' && Array.isArray(el.data?.tabs)) {
      blocks.push({
        id: bid,
        type: 'tabs',
        data: {
          tabs: (el.data.tabs as { id?: string; label?: string; content?: string }[]).map((t) => ({
            id: (t as { id?: string }).id ?? genItemId(),
            label: String(t?.label ?? ''),
            content: String(t?.content ?? ''),
          })),
        },
      })
    } else if (el.type === 'audio' && el.data?.url) {
      blocks.push({
        id: bid,
        type: 'audio',
        data: {
          url: String(el.data.url),
          title: el.data.title != null ? String(el.data.title) : undefined,
          transcript: el.data.transcript != null ? String(el.data.transcript) : undefined,
        },
      })
    } else if (el.type === 'flashcard' && Array.isArray(el.data?.cards)) {
      blocks.push({
        id: bid,
        type: 'flashcard',
        data: {
          cards: (el.data.cards as { id?: string; front?: string; back?: string }[]).map((c) => ({
            id: (c as { id?: string }).id ?? genItemId(),
            front: String(c?.front ?? ''),
            back: String(c?.back ?? ''),
          })),
        },
      })
    }
  }

  return { mainText, blocks }
}

/** Build RichContent from mainText + ordered blocks for persistence. */
export function mainTextAndBlocksToContent(
  mainText: string,
  blocks: EditorBlock[]
): RichContent {
  const sections: RichContentSection[] = []
  const interactiveElements: RichInteractiveElement[] = []

  if (mainText.trim()) {
    sections.push({ heading: '', content: mainText.trim(), type: 'text' })
  }

  for (const block of blocks) {
    if (block.type === 'text') {
      if (block.data.content?.trim()) {
        sections.push({
          heading: '',
          content: block.data.content.trim(),
          type: 'text',
          _blockId: block.id,
          _isBlock: true,
        })
      }
    } else if (block.type === 'image') {
      sections.push({
        heading: '',
        content: '',
        type: 'text',
        _blockId: block.id,
        image: {
          url: block.data.url,
          alt: block.data.alt,
          attribution: block.data.attribution,
          alignment: block.data.alignment,
          size: block.data.size,
        },
      })
    } else if (block.type === 'expandable') {
      interactiveElements.push({
        type: 'expandable',
        _blockId: block.id,
        data: { title: block.data.title, content: block.data.content },
      })
    } else if (block.type === 'quiz') {
      interactiveElements.push({
        type: 'quiz',
        _blockId: block.id,
        data: {
          question: block.data.question,
          options: block.data.options,
          correctAnswer: block.data.correctAnswer,
          explanation: block.data.explanation,
        },
      })
    } else if (block.type === 'video' && block.data.url) {
      interactiveElements.push({
        type: 'video',
        _blockId: block.id,
        data: { url: block.data.url, title: block.data.title },
      })
    } else if (block.type === 'timeline' && Array.isArray(block.data.steps)) {
      interactiveElements.push({
        type: 'timeline',
        _blockId: block.id,
        data: { steps: block.data.steps },
      })
    } else if (block.type === 'flipcard' && Array.isArray(block.data.cards)) {
      interactiveElements.push({
        type: 'flipcard',
        _blockId: block.id,
        data: { cards: block.data.cards },
      })
    } else if (block.type === 'hotspot' && block.data.imageUrl && Array.isArray(block.data.spots)) {
      interactiveElements.push({
        type: 'hotspot',
        _blockId: block.id,
        data: { imageUrl: block.data.imageUrl, spots: block.data.spots },
      })
    } else if (block.type === 'matching' && Array.isArray(block.data.pairs)) {
      interactiveElements.push({
        type: 'matching',
        _blockId: block.id,
        data: { pairs: block.data.pairs, instruction: block.data.instruction },
      })
    } else if (block.type === 'tabs' && Array.isArray(block.data.tabs)) {
      interactiveElements.push({
        type: 'tabs',
        _blockId: block.id,
        data: { tabs: block.data.tabs },
      })
    } else if (block.type === 'audio' && block.data.url) {
      interactiveElements.push({
        type: 'audio',
        _blockId: block.id,
        data: { url: block.data.url, title: block.data.title, transcript: block.data.transcript },
      })
    } else if (block.type === 'flashcard' && Array.isArray(block.data.cards)) {
      interactiveElements.push({
        type: 'flashcard',
        _blockId: block.id,
        data: { cards: block.data.cards },
      })
    }
  }

  return {
    type: 'rich',
    sections,
    ...(interactiveElements.length > 0 ? { interactiveElements } : {}),
  }
}

export function createNewBlock(type: EditorBlock['type']): EditorBlock {
  const id = genId()
  switch (type) {
    case 'text':
      return { id, type: 'text', data: { content: '' } }
    case 'image':
      return { id, type: 'image', data: { url: '', alt: '', attribution: '', alignment: 'center', size: 'medium' } }
    case 'expandable':
      return { id, type: 'expandable', data: { title: '', content: '' } }
    case 'quiz':
      return { id, type: 'quiz', data: {} }
    case 'video':
      return { id, type: 'video', data: { url: '', title: '' } }
    case 'timeline':
      return { id, type: 'timeline', data: { steps: [] } }
    case 'flipcard':
      return { id, type: 'flipcard', data: { cards: [] } }
    case 'hotspot':
      return { id, type: 'hotspot', data: { imageUrl: '', spots: [] } }
    case 'matching':
      return { id, type: 'matching', data: { pairs: [], instruction: '' } }
    case 'tabs':
      return { id, type: 'tabs', data: { tabs: [] } }
    case 'audio':
      return { id, type: 'audio', data: { url: '', title: '', transcript: '' } }
    case 'flashcard':
      return { id, type: 'flashcard', data: { cards: [] } }
    default:
      return { id, type: 'text', data: { content: '' } }
  }
}
