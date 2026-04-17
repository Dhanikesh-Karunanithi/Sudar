import type {
  EditorBlock,
  EditorBlockFlipcard,
  EditorBlockFlashcard,
  EditorBlockHotspot,
  EditorBlockMatching,
  EditorBlockTabs,
  EditorBlockTimeline,
  RichInteractiveElement,
} from '@/types/content'
function genItemId(): string {
  return `item-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

/** Map a stored interactive element to a single editor block for the inspector. */
export function richInteractiveToEditorBlock(el: RichInteractiveElement, fallbackId: string): EditorBlock | null {
  const id = el._blockId ?? fallbackId
  const d = el.data ?? {}
  switch (el.type) {
    case 'quiz':
      return {
        id,
        type: 'quiz',
        data: {
          question: d.question != null ? String(d.question) : undefined,
          options: Array.isArray(d.options) ? (d.options as string[]) : undefined,
          correctAnswer: d.correctAnswer != null ? String(d.correctAnswer) : undefined,
          explanation: d.explanation != null ? String(d.explanation) : undefined,
        },
      }
    case 'expandable':
      return {
        id,
        type: 'expandable',
        data: { title: String(d.title ?? ''), content: String(d.content ?? '') },
      }
    case 'quiz':
      return {
        id,
        type: 'quiz',
        data: {
          question: d.question != null ? String(d.question) : undefined,
          options: Array.isArray(d.options) ? (d.options as string[]) : undefined,
          correctAnswer: d.correctAnswer != null ? String(d.correctAnswer) : undefined,
          explanation: d.explanation != null ? String(d.explanation) : undefined,
        },
      }
    case 'video':
      if (!d.url) return null
      return {
        id,
        type: 'video',
        data: { url: String(d.url), title: d.title != null ? String(d.title) : undefined },
      }
    case 'timeline': {
      if (!Array.isArray(d.steps)) return null
      const steps = (d.steps as { id?: string; title?: string; description?: string; icon?: string }[]).map((s) => ({
        id: (s as { id?: string }).id ?? genItemId(),
        title: String(s?.title ?? ''),
        description: String(s?.description ?? ''),
        icon: s?.icon != null ? String(s.icon) : undefined,
      }))
      return { id, type: 'timeline', data: { steps } } as EditorBlock
    }
    case 'flipcard': {
      if (!Array.isArray(d.cards)) return null
      const cards = (d.cards as { id?: string; front?: string; back?: string }[]).map((c) => ({
        id: (c as { id?: string }).id ?? genItemId(),
        front: String(c?.front ?? ''),
        back: String(c?.back ?? ''),
      }))
      return { id, type: 'flipcard', data: { cards } } as EditorBlockFlipcard
    }
    case 'hotspot': {
      if (d.imageUrl == null || !Array.isArray(d.spots)) return null
      const spots = (d.spots as { x?: number; y?: number; label?: string; content?: string }[]).map((s) => ({
        x: Number(s?.x ?? 0),
        y: Number(s?.y ?? 0),
        label: String(s?.label ?? ''),
        content: String(s?.content ?? ''),
      }))
      return {
        id,
        type: 'hotspot',
        data: { imageUrl: String(d.imageUrl), spots },
      } as EditorBlockHotspot
    }
    case 'matching': {
      if (!Array.isArray(d.pairs)) return null
      const pairs = (d.pairs as { id?: string; term?: string; definition?: string }[]).map((p) => ({
        id: (p as { id?: string }).id ?? genItemId(),
        term: String(p?.term ?? ''),
        definition: String(p?.definition ?? ''),
      }))
      return {
        id,
        type: 'matching',
        data: {
          pairs,
          instruction: d.instruction != null ? String(d.instruction) : undefined,
        },
      } as EditorBlockMatching
    }
    case 'tabs': {
      if (!Array.isArray(d.tabs)) return null
      const tabs = (d.tabs as { id?: string; label?: string; content?: string }[]).map((t) => ({
        id: (t as { id?: string }).id ?? genItemId(),
        label: String(t?.label ?? ''),
        content: String(t?.content ?? ''),
      }))
      return { id, type: 'tabs', data: { tabs } } as EditorBlockTabs
    }
    case 'audio':
      if (!d.url) return null
      return {
        id,
        type: 'audio',
        data: {
          url: String(d.url),
          title: d.title != null ? String(d.title) : undefined,
          transcript: d.transcript != null ? String(d.transcript) : undefined,
        },
      }
    case 'flashcard': {
      if (!Array.isArray(d.cards)) return null
      const cards = (d.cards as { id?: string; front?: string; back?: string }[]).map((c) => ({
        id: (c as { id?: string }).id ?? genItemId(),
        front: String(c?.front ?? ''),
        back: String(c?.back ?? ''),
      }))
      return { id, type: 'flashcard', data: { cards } } as EditorBlockFlashcard
    }
    default:
      return null
  }
}

/** Convert inspector EditorBlock back to RichInteractiveElement, preserving type from original. */
export function editorBlockToRichInteractive(
  original: RichInteractiveElement,
  block: EditorBlock
): RichInteractiveElement {
  const _blockId = block.id
  switch (block.type) {
    case 'quiz':
      return {
        type: 'quiz',
        _blockId,
        data: {
          question: block.data.question,
          options: block.data.options,
          correctAnswer: block.data.correctAnswer,
          explanation: block.data.explanation,
        },
      }
    case 'expandable':
      return {
        type: 'expandable',
        _blockId,
        data: { title: block.data.title, content: block.data.content },
      }
    case 'quiz':
      return {
        type: 'quiz',
        _blockId,
        data: {
          question: block.data.question,
          options: block.data.options,
          correctAnswer: block.data.correctAnswer,
          explanation: block.data.explanation,
        },
      }
    case 'video':
      return {
        type: 'video',
        _blockId,
        data: { url: block.data.url, title: block.data.title },
      }
    case 'timeline':
      return { type: 'timeline', _blockId, data: { steps: block.data.steps } }
    case 'flipcard':
      return { type: 'flipcard', _blockId, data: { cards: block.data.cards } }
    case 'hotspot':
      return { type: 'hotspot', _blockId, data: { imageUrl: block.data.imageUrl, spots: block.data.spots } }
    case 'matching':
      return {
        type: 'matching',
        _blockId,
        data: { pairs: block.data.pairs, instruction: block.data.instruction },
      }
    case 'tabs':
      return { type: 'tabs', _blockId, data: { tabs: block.data.tabs } }
    case 'audio':
      return {
        type: 'audio',
        _blockId,
        data: { url: block.data.url, title: block.data.title, transcript: block.data.transcript },
      }
    case 'flashcard':
      return { type: 'flashcard', _blockId, data: { cards: block.data.cards } }
    default:
      return original
  }
}
