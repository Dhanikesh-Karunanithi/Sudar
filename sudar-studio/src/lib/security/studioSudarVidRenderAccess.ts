import { createHmac, timingSafeEqual } from 'crypto'

export const STUDIO_SUDARVID_JOB_ID_RE = /^[a-zA-Z0-9_-]{8,128}$/

export function normalizeStudioRenderAssetPath(segments: string[]): string | null {
  const path = segments.join('/').replace(/\\/g, '/').replace(/\/+/g, '/').replace(/^\/+/, '')
  if (!path || path.includes('..')) return null
  return path
}

type LearningEventJobQuery = {
  eq: (column: string, value: string) => LearningEventJobQuery
  contains: (column: string, value: Record<string, unknown>) => LearningEventJobQuery
  maybeSingle: () => Promise<{ data: { id?: string } | null }>
}

type SupabaseLikeClient = {
  from: (table: string) => {
    select: (columns: string, options?: { count?: 'exact'; head?: boolean }) => LearningEventJobQuery
  }
}

export async function canStudioUserAccessSudarVidJob(
  adminClient: unknown,
  userId: string,
  jobId: string,
): Promise<boolean> {
  if (!STUDIO_SUDARVID_JOB_ID_RE.test(jobId)) return false
  const admin = adminClient as SupabaseLikeClient
  const { data } = await admin
    .from('learning_events')
    .select('id')
    .eq('user_id', userId)
    .eq('event_type', 'video_generate_start')
    .contains('payload', { job_id: jobId })
    .maybeSingle()

  return !!data
}

const COOKIE_NAME = 'sudar_vid_render'
const GRANT_TTL_SEC = 7200

function grantSecret(): string {
  const s =
    process.env.SUDARVID_RENDER_GRANT_SECRET?.trim()
    || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
    || ''
  return s
}

function sign(bodyB64: string): string {
  const secret = grantSecret()
  if (!secret) return ''
  return createHmac('sha256', secret).update(bodyB64).digest('base64url')
}

export type StudioSudarVidRenderGrantPayload = {
  u: string
  j: string
  e: number
}

export function mintStudioSudarVidRenderGrant(userId: string, jobId: string): string | null {
  const secret = grantSecret()
  if (!secret) return null
  const e = Math.floor(Date.now() / 1000) + GRANT_TTL_SEC
  const payload: StudioSudarVidRenderGrantPayload = { u: userId, j: jobId, e }
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
  const sig = sign(body)
  return `${body}.${sig}`
}

export function verifyStudioSudarVidRenderGrant(
  raw: string | undefined,
  jobIdFromUrl: string,
): StudioSudarVidRenderGrantPayload | null {
  if (!raw) return null
  const secret = grantSecret()
  if (!secret) return null
  const dot = raw.indexOf('.')
  if (dot <= 0) return null
  const body = raw.slice(0, dot)
  const sig = raw.slice(dot + 1)
  const expected = sign(body)
  if (expected.length !== sig.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) {
    return null
  }
  let payload: StudioSudarVidRenderGrantPayload
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as StudioSudarVidRenderGrantPayload
  } catch {
    return null
  }
  if (!payload.u || !payload.j || typeof payload.e !== 'number') return null
  if (payload.j !== jobIdFromUrl) return null
  if (payload.e * 1000 < Date.now()) return null
  return payload
}

export const STUDIO_SUDAR_VID_RENDER_COOKIE = {
  name: COOKIE_NAME,
  path: '/api/studio/ai/generate-video/render',
  maxAge: GRANT_TTL_SEC,
} as const
