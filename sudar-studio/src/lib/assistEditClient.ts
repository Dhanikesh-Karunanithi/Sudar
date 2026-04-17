/** Client call to `/api/ai/assist-edit` — shared by module editor and SCORM text panel. */
export async function assistEditSelectedText(text: string, instruction: string): Promise<string> {
  const res = await fetch('/api/ai/assist-edit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, instruction }),
  })
  const data = (await res.json()) as { revised?: string; error?: string }
  if (!res.ok) throw new Error(data.error ?? 'Assist failed')
  const revised = data.revised
  if (typeof revised !== 'string') throw new Error('Invalid response')
  return revised
}

export const ASSIST_INSTRUCTION_OPTIONS = [
  { label: 'Improve clarity', instruction: 'improve clarity' },
  { label: 'Shorten', instruction: 'shorten' },
  { label: 'Expand', instruction: 'expand with more detail' },
  { label: 'Simplify', instruction: 'simplify language' },
] as const
