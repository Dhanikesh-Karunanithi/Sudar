import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  LearningSession,
  LearningSessionArtifact,
  LearningSessionState,
  LearningSessionSurface,
} from '@/types/teaching'
import { emptyLearningSessionState } from '@/types/teaching'

function mapSession(row: Record<string, unknown>): LearningSession {
  const rawState = (row.state as Partial<LearningSessionState>) ?? {}
  const base = emptyLearningSessionState()
  const state: LearningSessionState = {
    ...base,
    ...rawState,
    working_memory: {
      ...base.working_memory,
      ...(rawState.working_memory ?? {}),
    },
    artifacts: Array.isArray(rawState.artifacts) ? rawState.artifacts : [],
    active_claim_ids: Array.isArray(rawState.active_claim_ids)
      ? rawState.active_claim_ids
      : [],
    metacognition: {
      ...base.metacognition,
      ...(rawState.metacognition ?? {}),
    },
  }
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    org_id: row.org_id != null ? String(row.org_id) : null,
    domain_id: row.domain_id != null ? String(row.domain_id) : null,
    surface: row.surface as LearningSessionSurface,
    state,
    twin_snapshot: (row.twin_snapshot as Record<string, unknown>) ?? {},
    created_at: row.created_at != null ? String(row.created_at) : undefined,
    updated_at: row.updated_at != null ? String(row.updated_at) : undefined,
  }
}

export async function createLearningSession(
  admin: SupabaseClient,
  args: {
    userId: string
    orgId?: string | null
    domainId?: string | null
    surface: LearningSessionSurface
    state?: Partial<LearningSessionState>
    twinSnapshot?: Record<string, unknown>
  },
): Promise<LearningSession> {
  const state = {
    ...emptyLearningSessionState(),
    ...args.state,
    working_memory: {
      ...emptyLearningSessionState().working_memory,
      ...(args.state?.working_memory ?? {}),
    },
  }
  const { data, error } = await admin
    .from('learning_sessions')
    .insert({
      user_id: args.userId,
      org_id: args.orgId ?? null,
      domain_id: args.domainId ?? null,
      surface: args.surface,
      state,
      twin_snapshot: args.twinSnapshot ?? {},
    })
    .select('*')
    .single()
  if (error) throw error
  return mapSession(data as Record<string, unknown>)
}

export async function getLearningSession(
  admin: SupabaseClient,
  sessionId: string,
  userId?: string,
): Promise<LearningSession | null> {
  let q = admin.from('learning_sessions').select('*').eq('id', sessionId)
  if (userId) q = q.eq('user_id', userId)
  const { data } = await q.maybeSingle()
  if (!data) return null
  return mapSession(data as Record<string, unknown>)
}

export async function updateLearningSessionState(
  admin: SupabaseClient,
  sessionId: string,
  userId: string,
  patch: Partial<LearningSessionState>,
): Promise<LearningSession | null> {
  const current = await getLearningSession(admin, sessionId, userId)
  if (!current) return null
  const state: LearningSessionState = {
    ...current.state,
    ...patch,
    working_memory: {
      ...current.state.working_memory,
      ...(patch.working_memory ?? {}),
    },
    artifacts: patch.artifacts ?? current.state.artifacts,
    active_claim_ids: patch.active_claim_ids ?? current.state.active_claim_ids,
    metacognition: {
      ...current.state.metacognition,
      ...(patch.metacognition ?? {}),
    },
  }
  const { data, error } = await admin
    .from('learning_sessions')
    .update({ state, updated_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('user_id', userId)
    .select('*')
    .single()
  if (error) throw error
  return mapSession(data as Record<string, unknown>)
}

export async function appendSessionArtifact(
  admin: SupabaseClient,
  sessionId: string,
  userId: string,
  artifact: LearningSessionArtifact,
): Promise<LearningSession | null> {
  const current = await getLearningSession(admin, sessionId, userId)
  if (!current) return null
  const artifacts = [...current.state.artifacts.filter((a) => a.id !== artifact.id), artifact]
  return updateLearningSessionState(admin, sessionId, userId, { artifacts })
}

export async function resumeLatestSession(
  admin: SupabaseClient,
  userId: string,
  surface?: LearningSessionSurface,
): Promise<LearningSession | null> {
  let q = admin
    .from('learning_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
  if (surface) q = q.eq('surface', surface)
  const { data } = await q.maybeSingle()
  if (!data) return null
  return mapSession(data as Record<string, unknown>)
}
