import type { ModuleContent, RichContentSection, RichInteractiveElement } from '@/types/content'
import { isRichContent } from '@/types/content'

export function patchTextBody(content: ModuleContent, body: string): ModuleContent {
  if (content.type !== 'text') return content
  return { ...content, body }
}

export function patchRichIntroduction(content: ModuleContent, introduction: string): ModuleContent {
  if (!isRichContent(content)) return content
  return { ...content, introduction }
}

export function patchRichSummary(content: ModuleContent, summary: string): ModuleContent {
  if (!isRichContent(content)) return content
  return { ...content, summary }
}

export function patchRichSection(
  content: ModuleContent,
  index: number,
  patch: Partial<RichContentSection>
): ModuleContent {
  if (!isRichContent(content)) return content
  const sections = [...(content.sections ?? [])]
  if (!sections[index]) return content
  sections[index] = { ...sections[index], ...patch }
  return { ...content, sections }
}

export function patchRichInteractive(
  content: ModuleContent,
  index: number,
  next: RichInteractiveElement
): ModuleContent {
  if (!isRichContent(content)) return content
  const interactiveElements = [...(content.interactiveElements ?? [])]
  if (!interactiveElements[index]) return content
  interactiveElements[index] = next
  return { ...content, interactiveElements }
}
