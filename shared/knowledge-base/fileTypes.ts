/** Allowed knowledge-base upload MIME types (magic-byte verified at upload). */

export const KB_MAX_BYTES = 50 * 1024 * 1024

export const KB_ALLOWED_MIMES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/msword',
  'text/html',
  'text/plain',
  'text/csv',
  'application/json',
  'application/xml',
  'text/xml',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/x-m4a',
  'audio/mp4',
  'video/mp4',
  'video/webm',
  'application/epub+zip',
  'application/zip',
] as const

export type KbFileType =
  | 'pdf'
  | 'docx'
  | 'pptx'
  | 'xlsx'
  | 'xls'
  | 'image'
  | 'audio'
  | 'video'
  | 'html'
  | 'csv'
  | 'json'
  | 'xml'
  | 'epub'
  | 'zip'
  | 'url'
  | 'other'

export function mimeToKbFileType(mime: string, filename: string): KbFileType {
  const m = mime.toLowerCase()
  const name = filename.toLowerCase()
  if (m === 'application/pdf' || name.endsWith('.pdf')) return 'pdf'
  if (m.includes('wordprocessingml') || name.endsWith('.docx')) return 'docx'
  if (m.includes('presentationml') || name.endsWith('.pptx')) return 'pptx'
  if (m.includes('spreadsheetml') || name.endsWith('.xlsx')) return 'xlsx'
  if (name.endsWith('.xls')) return 'xls'
  if (m.startsWith('image/')) return 'image'
  if (m.startsWith('audio/')) return 'audio'
  if (m.startsWith('video/')) return 'video'
  if (m === 'text/html' || name.endsWith('.html')) return 'html'
  if (m === 'text/csv' || name.endsWith('.csv')) return 'csv'
  if (m === 'application/json' || name.endsWith('.json')) return 'json'
  if (m.includes('xml') || name.endsWith('.xml')) return 'xml'
  if (m.includes('epub') || name.endsWith('.epub')) return 'epub'
  if (m === 'application/zip' || name.endsWith('.zip')) return 'zip'
  return 'other'
}
