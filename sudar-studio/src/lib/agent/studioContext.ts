/**
 * Sudar Studio — build Studio agent context (Platform Knowledge + org config + data).
 * Used by POST /api/agent/query to build the prompt and validate action IDs.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { SUDAR_STUDIO_PLATFORM_KNOWLEDGE } from './platformKnowledge'
import type { StudioContextResult } from './types'

const USERS_CAP = 100
const TOP_COURSES = 5
const TOP_LEARNERS = 5
const TOP_STRUGGLES = 5

export interface BuildStudioContextOptions {
  route?: string
  focusUserId?: string
}

export async function buildStudioContext(
  admin: SupabaseClient<Database>,
  orgId: string,
  options: BuildStudioContextOptions = {}
): Promise<StudioContextResult> {
  const { route = '', focusUserId } = options

  // Fetch org_members first so we can pass user_ids into the profiles query (avoids TDZ)
  type OrgMemberRow = { user_id: string; role: string }
  const { data: orgMembersData } = await admin
    .from('org_members')
    .select('user_id, role')
    .eq('org_id', orgId)
    .limit(USERS_CAP)
  const orgMembers = orgMembersData as OrgMemberRow[] | null

  const userIdsForProfiles = orgMembers?.map((m) => m.user_id) ?? []

  const [
    { data: org },
    { data: courses },
    { data: paths },
    { data: allEnrollments },
    { data: allEvents },
    { data: allLearnerProfiles },
    { data: profiles },
  ] = await Promise.all([
    admin.from('organisations').select('name, settings').eq('id', orgId).single(),
    admin.from('courses').select('id, title, status').eq('org_id', orgId),
    admin.from('learning_paths').select('id, title, status').eq('org_id', orgId),
    admin.from('enrollments').select('user_id, course_id, status, progress_pct').not('course_id', 'is', null),
    admin.from('learning_events').select('user_id, course_id, event_type, duration_secs'),
    admin.from('learner_profiles').select('user_id, ai_tutor_context'),
    userIdsForProfiles.length > 0
      ? admin.from('profiles').select('id, full_name').in('id', userIdsForProfiles)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
  ])

  const orgCourseIds = new Set((courses ?? []).map((c) => c.id))
  const orgEnrollments = (allEnrollments ?? []).filter((e) => e.course_id && orgCourseIds.has(e.course_id))
  const orgEvents = (allEvents ?? []).filter((e) => e.course_id && orgCourseIds.has(e.course_id))

  const totalLearners = new Set(orgEnrollments.map((e) => e.user_id)).size
  const totalEnrollments = orgEnrollments.length
  const completedEnrollments = orgEnrollments.filter((e) => e.status === 'completed').length
  const completionRate = totalEnrollments === 0 ? 0 : Math.round((completedEnrollments / totalEnrollments) * 100)
  const totalLearningMins = Math.round(orgEvents.reduce((s, e) => s + (e.duration_secs ?? 0), 0) / 60)
  const aiInteractions = orgEvents.filter((e) => e.event_type === 'ai_tutor_query').length

  const orgSummary = {
    orgName: (org?.name as string) ?? 'Organization',
    totalLearners,
    totalCourses: courses?.length ?? 0,
    totalPaths: paths?.length ?? 0,
    completionRate,
    totalLearningMins,
    aiInteractions,
  }

  const userIds = new Set<string>((orgMembers ?? []).map((m) => m.user_id))
  const publishedCourses = (courses ?? []).filter((c) => c.status === 'published')
  const courseIds = new Set(publishedCourses.map((c) => c.id))
  const publishedPaths = (paths ?? []).filter((p) => p.status === 'published')
  const pathIds = new Set(publishedPaths.map((p) => p.id))

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name ?? 'Unknown']))
  const roleMap = new Map((orgMembers ?? []).map((m) => [m.user_id, m.role]))

  const userLines = (orgMembers ?? []).slice(0, USERS_CAP).map((m) => {
    const name = profileMap.get(m.user_id) ?? 'Unknown'
    const role = roleMap.get(m.user_id) ?? 'LEARNER'
    return `- [${m.user_id}] ${name} (${role})`
  })

  const courseLines = publishedCourses.map((c) => `- [${c.id}] ${c.title}`)
  const pathLines = publishedPaths.map((p) => `- [${p.id}] ${p.title}`)

  const allStruggles: string[] = []
  for (const lp of allLearnerProfiles ?? []) {
    const mem = lp.ai_tutor_context as Record<string, unknown> | null
    const s = (mem?.struggles_with as string[]) ?? []
    allStruggles.push(...s)
  }
  const struggleCounts: Record<string, number> = {}
  for (const s of allStruggles) {
    struggleCounts[s] = (struggleCounts[s] ?? 0) + 1
  }
  const topStruggles = Object.entries(struggleCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_STRUGGLES)
    .map(([name]) => name)

  const courseStats = publishedCourses.map((course) => {
    const ce = orgEnrollments.filter((e) => e.course_id === course.id)
    return { id: course.id, title: course.title, enrollments: ce.length, completed: ce.filter((e) => e.status === 'completed').length }
  }).sort((a, b) => b.enrollments - a.enrollments).slice(0, TOP_COURSES)

  const learnerMins = new Map<string, number>()
  for (const e of orgEvents) {
    learnerMins.set(e.user_id, (learnerMins.get(e.user_id) ?? 0) + (e.duration_secs ?? 0))
  }
  const topLearnersByTime = [...learnerMins.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_LEARNERS)
    .map(([uid]) => {
      const name = profileMap.get(uid) ?? 'Unknown'
      const mins = Math.round((learnerMins.get(uid) ?? 0) / 60)
      return { userId: uid, name, mins }
    })

  const analyticsSummaryText = [
    `${orgSummary.orgName}: ${orgSummary.totalLearners} learners, ${orgSummary.totalCourses} courses, ${orgSummary.totalPaths} paths.`,
    `Completion rate: ${orgSummary.completionRate}%. Total learning time: ${orgSummary.totalLearningMins} minutes. AI tutor interactions: ${orgSummary.aiInteractions}.`,
    topStruggles.length > 0 ? `Top struggle topics: ${topStruggles.join(', ')}.` : '',
    courseStats.length > 0 ? `Top courses by enrollment: ${courseStats.map((c) => `${c.title} (${c.enrollments})`).join('; ')}.` : '',
    topLearnersByTime.length > 0 ? `Top learners by time: ${topLearnersByTime.map((l) => `${l.name} (${l.mins} min)`).join('; ')}.` : '',
  ].filter(Boolean).join(' ')

  const settings = (org?.settings as Record<string, unknown>) ?? {}
  const performanceConfig = settings.performance_config as Record<string, unknown> | null | undefined
  const institutionType = performanceConfig?.institution_type ?? null
  const kpis = (performanceConfig?.kpis as unknown[]) ?? []
  const terms = (performanceConfig?.terms as unknown[]) ?? []
  const scale = performanceConfig?.scale ?? null
  const aiModels = (settings.ai_models as Record<string, string | null> | undefined) ?? {}
  const hasSso = !!settings.sso_config

  const orgConfigText = [
    `Institution type: ${institutionType ?? 'not set'}.`,
    kpis.length > 0 ? `KPIs: ${kpis.map((k: unknown) => typeof k === 'object' && k !== null && 'key' in k ? (k as { key: string }).key : String(k)).join(', ')}.` : 'KPIs: not configured.',
    terms.length > 0 ? `Terms: ${terms.length} configured.` : '',
    scale ? `Scale: ${scale}.` : '',
    aiModels.tts_voice ? `Default TTS voice: ${aiModels.tts_voice}.` : '',
    aiModels.content_generation_model ? `Content generation model: ${aiModels.content_generation_model}.` : '',
    hasSso ? 'SSO is configured.' : '',
  ].filter(Boolean).join(' ')

  let focusUserText = ''
  if (focusUserId && userIds.has(focusUserId)) {
    const enrollments = orgEnrollments.filter((e) => e.user_id === focusUserId)
    const { data: perfRecords } = await admin
      .from('learner_performance_records')
      .select('source_type, key, value, value_display, period_start, period_end')
      .eq('org_id', orgId)
      .eq('user_id', focusUserId)
      .order('period_start', { ascending: false })
      .limit(10)
    const focusName = profileMap.get(focusUserId) ?? 'Unknown'
    focusUserText = `
Focus user (current page): ${focusName} [${focusUserId}]
Enrollments: ${enrollments.length} (${enrollments.filter((e) => e.status === 'completed').length} completed).
${perfRecords?.length ? `Performance records: ${perfRecords.length} (keys: ${perfRecords.map((r) => r.key).join(', ')}).` : ''}
`
  }

  const contextPrompt = `
${SUDAR_STUDIO_PLATFORM_KNOWLEDGE}

---
## Current session context

Current route: ${route || '(dashboard or unknown)'}
${focusUserText}

## Org configuration (this organization's settings)
${orgConfigText || 'No custom org configuration set.'}

## Org summary
- Name: ${orgSummary.orgName}
- Learners: ${orgSummary.totalLearners} | Courses: ${orgSummary.totalCourses} | Paths: ${orgSummary.totalPaths}
- Completion rate: ${orgSummary.completionRate}% | Learning time: ${orgSummary.totalLearningMins} min | AI interactions: ${orgSummary.aiInteractions}

## Analytics snapshot
${analyticsSummaryText}

## Users in this org (id, name, role) — use these IDs for assign actions
${userLines.length ? userLines.join('\n') : '(none)'}

## Published courses (id, title) — use these IDs for assign_course or export_course_time
${courseLines.length ? courseLines.join('\n') : '(none)'}

## Published learning paths (id, title) — use these IDs for assign_path
${pathLines.length ? pathLines.join('\n') : '(none)'}
`.trim()

  return {
    contextPrompt,
    orgSummary,
    userIds,
    courseIds,
    pathIds,
    analyticsSummaryText,
  }
}
