import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Strip raw ACTIONS: [...] line from tutor message content so it is never shown as code. */
export function stripTutorActionsFromText(content: string): string {
  if (!content?.trim()) return content ?? ''
  const t = content.trim()
  const withNewline = t.match(/\nACTIONS:\s*[\s\S]+$/)
  if (withNewline && typeof withNewline.index === 'number') {
    return t.slice(0, withNewline.index).trim().replace(/\n+$/, '')
  }
  const noNewline = t.match(/ACTIONS:\s*[\s\S]+$/)
  if (noNewline && typeof noNewline.index === 'number') {
    return t.slice(0, noNewline.index).trim().replace(/\n+$/, '')
  }
  return t
}
