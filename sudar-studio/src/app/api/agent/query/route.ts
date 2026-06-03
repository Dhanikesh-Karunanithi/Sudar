import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { getOrgIdAndRole } from '@/lib/org'
import { NextRequest, NextResponse } from 'next/server'
import { chatCompletion, resolveChatConfigError } from '@/lib/ai/chat'
import { orgSettingsToAiChatContext } from '@/lib/ai/orgAiChatContext'
import { buildStudioUsageChatCtx } from '@/lib/ai/studioUsageContext'
import { buildStudioContext } from '@/lib/agent/studioContext'
import { STUDIO_ACTION_TYPES, type StudioAction } from '@/lib/agent/types'
import {
  applyStrictOutputRedaction,
  redactEchoedSensitiveDigits,
  scanSensitiveUserText,
} from '@/lib/security/sensitiveInputGuard'

const ACTIONS_REGEX = /\nACTIONS:\s*([\s\S]+)$/

function parseActionsFromResponse(raw: string): { text: string; rawActions: Array<Record<string, unknown>> } {
  const actMatch = raw.match(ACTIONS_REGEX)
  if (!actMatch) return { text: raw.trim(), rawActions: [] }
  const text = raw.slice(0, actMatch.index).trim().replace(/\n+$/, '')
  let rawActions: Array<Record<string, unknown>> = []
  try {
    const parsed = JSON.parse(actMatch[1].trim())
    rawActions = Array.isArray(parsed) ? parsed : []
  } catch {
    rawActions = []
  }
  return { text, rawActions }
}

function validateAndParseActions(
  rawActions: Array<Record<string, unknown>>,
  userIds: Set<string>,
  courseIds: Set<string>,
  pathIds: Set<string>,
  editableCourseIds: Set<string>,
  moduleIds: Set<string>
): StudioAction[] {
  const out: StudioAction[] = []
  for (const a of rawActions) {
    const type = String(a.type ?? '').trim()
    if (!STUDIO_ACTION_TYPES.includes(type as (typeof STUDIO_ACTION_TYPES)[number])) continue
    const label = String(a.label ?? '').trim().slice(0, 80)

    if (type === 'open_user' && typeof a.user_id === 'string' && userIds.has(a.user_id)) {
      out.push({ type: 'open_user', user_id: a.user_id, label: label || 'Open user' })
    } else if (type === 'open_course' && typeof a.course_id === 'string' && courseIds.has(a.course_id)) {
      out.push({ type: 'open_course', course_id: a.course_id, label: label || 'Open course' })
    } else if (type === 'open_path' && typeof a.path_id === 'string' && pathIds.has(a.path_id)) {
      out.push({ type: 'open_path', path_id: a.path_id, label: label || 'Open path' })
    } else if (type === 'assign_course' && typeof a.user_id === 'string' && typeof a.course_id === 'string' && userIds.has(a.user_id) && courseIds.has(a.course_id)) {
      out.push({ type: 'assign_course', user_id: a.user_id, course_id: a.course_id, label: label || 'Assign course' })
    } else if (type === 'assign_path' && typeof a.user_id === 'string' && typeof a.path_id === 'string' && userIds.has(a.user_id) && pathIds.has(a.path_id)) {
      out.push({ type: 'assign_path', user_id: a.user_id, path_id: a.path_id, label: label || 'Assign path' })
    } else if (type === 'get_analytics_summary') {
      out.push({ type: 'get_analytics_summary', label: label || 'Analytics summary' })
    } else if (type === 'export_users_csv') {
      out.push({ type: 'export_users_csv', label: label || 'Export users CSV' })
    } else if (type === 'export_course_time' && typeof a.course_id === 'string' && courseIds.has(a.course_id)) {
      out.push({ type: 'export_course_time', course_id: a.course_id, label: label || 'Export course time' })
    } else if (
      type === 'draft_module_content' &&
      typeof a.course_id === 'string' &&
      typeof a.module_id === 'string' &&
      typeof a.prompt === 'string' &&
      editableCourseIds.has(a.course_id) &&
      moduleIds.has(a.module_id)
    ) {
      out.push({
        type: 'draft_module_content',
        course_id: a.course_id,
        module_id: a.module_id,
        prompt: a.prompt.slice(0, 1000),
        label: label || 'Draft module content',
      })
    } else if (
      type === 'apply_module_content' &&
      typeof a.course_id === 'string' &&
      typeof a.module_id === 'string' &&
      typeof a.content === 'string' &&
      editableCourseIds.has(a.course_id) &&
      moduleIds.has(a.module_id)
    ) {
      out.push({
        type: 'apply_module_content',
        course_id: a.course_id,
        module_id: a.module_id,
        content: a.content.slice(0, 24000),
        mode: a.mode === 'append' ? 'append' : 'replace',
        label: label || 'Apply module content',
      })
    }
  }
  return out
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { orgId, role } = await getOrgIdAndRole(user.id)
    if (role === 'LEARNER') {
      return NextResponse.json(
        { error: 'Sudar Studio chat is for admins and creators. Use Sudar Learn for learning.' },
        { status: 403 }
      )
    }

    let body: {
      message?: string
      conversation_history?: unknown[]
      route?: string
      focus_user_id?: string
      authoring_context?: { courseId?: string | null; activeModuleId?: string | null; activeKey?: string | null }
    } = {}
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const message = typeof body.message === 'string' ? body.message.trim() : ''
    if (!message) return NextResponse.json({ error: 'message required' }, { status: 400 })

    const admin = createServiceRoleSupabaseClient()
    const { data: orgRowStudio } = await admin.from('organisations').select('settings').eq('id', orgId).maybeSingle()
    const { orgSettings, privateRuntime } = orgSettingsToAiChatContext(orgRowStudio?.settings)
    const configError = resolveChatConfigError(orgSettings, privateRuntime)
    if (configError) {
      return NextResponse.json(
        { error: `AI chat not configured: ${configError} See Settings → Org settings (private AI) or AI & API Keys.` },
        { status: 503 }
      )
    }
    const studioSettings = (orgRowStudio?.settings as Record<string, unknown> | null) ?? {}
    const studioAiCompliance = (studioSettings.ai_compliance as Record<string, unknown> | null) ?? {}
    if (studioAiCompliance.block_high_risk_pii_in_tutor !== false) {
      const st = scanSensitiveUserText(message)
      if (st.blocked) {
        return NextResponse.json(
          {
            error:
              "Can't process payment card numbers, government IDs, bank details, or private keys in chat. Remove them and try again.",
            guardrail_code: 'sensitive_data_detected',
          },
          { status: 400 },
        )
      }
    }
    const route = typeof body.route === 'string' ? body.route : ''
    const authoringCtx = body.authoring_context ?? {}
    const chatAiCtx = buildStudioUsageChatCtx({
      admin,
      orgId,
      userId: user.id,
      feature: 'studio_agent',
      route: '/api/agent/query',
      privateRuntime,
      orgSettings,
      metadata: authoringCtx.courseId
        ? { course_id: authoringCtx.courseId, module_id: authoringCtx.activeModuleId ?? undefined }
        : undefined,
    })
    const focusUserId = typeof body.focus_user_id === 'string' ? body.focus_user_id : undefined

    const ctx = await buildStudioContext(admin, orgId, { route, focusUserId })

    const systemPrompt = `You are Sudar, the AI assistant for Sudar Studio. You help with **everything** on the platform: Dashboard, Courses (create/edit/publish, modules, SCORM, media), Learning Paths (create, assign), Analytics, Training compliance, Users (add, roles, performance, enrollments), Integrations (API keys, embed, event ingestion), AI & API Keys, Org settings, and Help. Use **only** the Platform Knowledge and context below — never invent menus, endpoints, or steps.

When the user asks to do something that changes data (e.g. assign a path, assign a course, export users), respond clearly and at the end of your reply output exactly one line:
ACTIONS: [{"type":"<action_type>", ...}]

Allowed action types and JSON shapes:
- open_user: {"type":"open_user","user_id":"<uuid>","label":"Open user"}
- open_course: {"type":"open_course","course_id":"<uuid>","label":"Open course"}
- open_path: {"type":"open_path","path_id":"<uuid>","label":"Open path"}
- assign_course: {"type":"assign_course","user_id":"<uuid>","course_id":"<uuid>","label":"Assign course"}
- assign_path: {"type":"assign_path","user_id":"<uuid>","path_id":"<uuid>","label":"Assign path"}
- get_analytics_summary: {"type":"get_analytics_summary","label":"Show summary"}
- export_users_csv: {"type":"export_users_csv","label":"Download users CSV"}
- export_course_time: {"type":"export_course_time","course_id":"<uuid>","label":"Download course time report"}
- draft_module_content: {"type":"draft_module_content","course_id":"<uuid>","module_id":"<uuid>","prompt":"<what to write>","label":"Draft module"}
- apply_module_content: {"type":"apply_module_content","course_id":"<uuid>","module_id":"<uuid>","content":"<markdown>","mode":"replace|append","label":"Apply content"}

Use only IDs that appear in the context below. You may output multiple actions in the ACTIONS array. Omit the ACTIONS line if no action is needed. For content authoring, prefer drafting first, then apply only when user clearly asks to push it into the module.

Context:
${ctx.contextPrompt}
${authoringCtx.courseId ? `\nLive authoring context: course=${authoringCtx.courseId}, module=${authoringCtx.activeModuleId ?? 'none'}, region=${authoringCtx.activeKey ?? 'none'}` : ''}`

    const conversationHistory = (Array.isArray(body.conversation_history) ? body.conversation_history : []) as Array<{ role?: string; content?: string }>
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...conversationHistory.slice(-8).map((m) => ({
        role: (m.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
        content: String(m.content ?? ''),
      })),
      { role: 'user' as const, content: message },
    ]

    const { content: aiResponse } = await chatCompletion(
      {
        messages,
        max_tokens: 1024,
        temperature: 0.7,
      },
      chatAiCtx
    )

    let responseText = aiResponse?.trim() ?? ''
    if (studioAiCompliance.tutor_redact_echoed_secrets !== false) {
      responseText = redactEchoedSensitiveDigits(responseText)
    }
    if (studioAiCompliance.tutor_output_moderation_strict === true) {
      responseText = applyStrictOutputRedaction(responseText)
    }
    const { text: responseTextClean, rawActions } = parseActionsFromResponse(responseText)
    const actions = validateAndParseActions(rawActions, ctx.userIds, ctx.courseIds, ctx.pathIds, ctx.editableCourseIds, ctx.moduleIds)

    const blocks: Array<{ id: string; type: string; payload: Record<string, unknown> }> = [
      { id: 'text-1', type: 'text', payload: { content: responseTextClean } },
    ]

    const actionResults: Array<{ type: string; href?: string; message?: string; block?: Record<string, unknown> }> = []

    for (const action of actions) {
      if (action.type === 'open_user') {
        actionResults.push({ type: 'open_user', href: `/users/${action.user_id}` })
      } else if (action.type === 'open_course') {
        actionResults.push({ type: 'open_course', href: `/courses/${action.course_id}` })
      } else if (action.type === 'open_path') {
        actionResults.push({ type: 'open_path', href: `/paths/${action.path_id}` })
      } else if (action.type === 'assign_course') {
        const { error } = await admin.from('enrollments').insert({
          user_id: action.user_id,
          course_id: action.course_id,
          enrolled_by: user.id,
          status: 'not_started',
          progress_pct: 0,
        })
        actionResults.push({
          type: 'assign_course',
          message: error ? `Failed to assign course: ${error.message}` : 'Course assigned successfully.',
        })
      } else if (action.type === 'assign_path') {
        const pathId = action.path_id
        const { data: path } = await admin.from('learning_paths').select('id, courses, org_id').eq('id', pathId).single()
        if (!path || path.org_id !== orgId) {
          actionResults.push({ type: 'assign_path', message: 'Path not found or access denied.' })
          continue
        }
        const courses = (path.courses as Array<{ course_id: string }>) ?? []
        const dueDateISO = null
        const { data: existing } = await admin.from('enrollments').select('id').eq('user_id', action.user_id).eq('path_id', pathId).single()
        if (existing) {
          actionResults.push({ type: 'assign_path', message: 'User is already assigned to this path.' })
          continue
        }
        const personalizedSequence = courses.map((c, i) => ({ ...c, order_index: i, seq_status: 'not_started' }))
        const { error: enrollError } = await admin.from('enrollments').insert({
          user_id: action.user_id,
          path_id: pathId,
          enrolled_by: user.id,
          status: 'not_started',
          progress_pct: 0,
          due_date: dueDateISO,
          personalized_sequence: personalizedSequence,
        })
        if (enrollError) {
          actionResults.push({ type: 'assign_path', message: `Failed: ${enrollError.message}` })
          continue
        }
        for (const c of courses) {
          const { data: ce } = await admin.from('enrollments').select('id').eq('user_id', action.user_id).eq('course_id', c.course_id).single()
          if (!ce) {
            await admin.from('enrollments').insert({
              user_id: action.user_id,
              course_id: c.course_id,
              enrolled_by: user.id,
              status: 'not_started',
              progress_pct: 0,
            })
          }
        }
        actionResults.push({ type: 'assign_path', message: 'Path assigned successfully.' })
      } else if (action.type === 'get_analytics_summary') {
        actionResults.push({ type: 'get_analytics_summary', message: ctx.analyticsSummaryText })
      } else if (action.type === 'export_users_csv') {
        const { data: membersData } = await admin.from('org_members').select('user_id, role').eq('org_id', orgId).limit(50)
        const members = (membersData ?? []) as Array<{ user_id: string; role: string }>
        if (!members.length) {
          actionResults.push({ type: 'export_users_csv', message: 'No users to export.' })
          continue
        }
        const { data: profiles } = await admin.from('profiles').select('id, full_name').in('id', members.map((m) => m.user_id))
        const profileMap = new Map((profiles ?? []).map((p: { id: string; full_name: string | null }) => [p.id, p.full_name ?? '']))
        const roleMap = new Map(members.map((m) => [m.user_id, m.role]))
        const authUsers = await Promise.all(members.map((m) => admin.auth.admin.getUserById(m.user_id)))
        const rows = members.map((m, i) => {
          const auth = authUsers[i]?.data?.user
          const email = auth?.email ?? ''
          const name = (profileMap.get(m.user_id) ?? auth?.user_metadata?.full_name ?? '').replace(/"/g, '""')
          const role = roleMap.get(m.user_id) ?? 'LEARNER'
          return `"${name}",${email.replace(/"/g, '""')},${role},active`
        })
        const csv = 'Name,Email,Role,Status\n' + rows.join('\n')
        const base64 = Buffer.from(csv, 'utf-8').toString('base64')
        blocks.push({
          id: 'download-users-csv',
          type: 'download',
          payload: { filename: `users-export-${new Date().toISOString().slice(0, 10)}.csv`, mimeType: 'text/csv', contentBase64: base64 },
        })
        actionResults.push({ type: 'export_users_csv', message: 'Users CSV ready. Use the download button below.' })
      } else if (action.type === 'export_course_time') {
        const courseId = action.course_id
        const baseUrl = request.nextUrl.origin
        const res = await fetch(`${baseUrl}/api/analytics/course-time?course_id=${courseId}`, {
          headers: { Cookie: request.headers.get('cookie') ?? '' },
        })
        if (!res.ok) {
          actionResults.push({ type: 'export_course_time', message: 'Could not load course time data.' })
          continue
        }
        const data = await res.json()
        const header = 'Learner,Module,Total (sec),Active (sec),Completed\n'
        const csvRows: string[] = []
        for (const row of data.learners ?? []) {
          for (const mod of row.modules ?? []) {
            csvRows.push(`${(row.name ?? '').replace(/"/g, '""')},${(mod.module_title ?? '').replace(/"/g, '""')},${mod.total_secs ?? 0},${mod.active_secs ?? 0},${mod.completed ? 'Yes' : 'No'}`)
          }
        }
        const csv = header + csvRows.join('\n')
        const base64 = Buffer.from(csv, 'utf-8').toString('base64')
        blocks.push({
          id: 'download-course-time',
          type: 'download',
          payload: { filename: `course-time-${courseId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.csv`, mimeType: 'text/csv', contentBase64: base64 },
        })
        actionResults.push({ type: 'export_course_time', message: 'Course time report ready. Use the download button below.' })
      } else if (action.type === 'draft_module_content') {
        const { data: moduleRow } = await admin
          .from('modules')
          .select('id, title, content')
          .eq('id', action.module_id)
          .eq('course_id', action.course_id)
          .single()
        if (!moduleRow) {
          actionResults.push({ type: 'draft_module_content', message: 'Module not found.' })
          continue
        }
        const moduleContent = (moduleRow.content as Record<string, unknown> | null) ?? {}
        const currentText =
          typeof moduleContent.body === 'string'
            ? moduleContent.body
            : typeof moduleContent.introduction === 'string'
              ? moduleContent.introduction
              : ''
        try {
          const { content: drafted } = await chatCompletion(
            {
              messages: [
                {
                  role: 'system',
                  content:
                    'You are a course authoring assistant for Sudar Studio. Return only markdown lesson content, no preamble.',
                },
                {
                  role: 'user',
                  content: `Module title: ${moduleRow.title}\n\nCurrent content:\n${currentText}\n\nInstruction:\n${action.prompt}\n\nReturn improved module markdown now.`,
                },
              ],
              max_tokens: 1200,
              temperature: 0.5,
            },
            chatAiCtx
          )
          const draftText = drafted?.trim()
          if (!draftText) {
            actionResults.push({ type: 'draft_module_content', message: 'Could not draft module content.' })
            continue
          }
          blocks.push({
            id: `draft-module-${action.module_id}`,
            type: 'module_apply',
            payload: {
              courseId: action.course_id,
              moduleId: action.module_id,
              mode: 'replace',
              previousContent: currentText,
              content: draftText,
              label: action.label ?? 'Apply draft to module',
            },
          })
          actionResults.push({ type: 'draft_module_content', message: 'Draft created. Review and apply from chat.' })
        } catch {
          actionResults.push({ type: 'draft_module_content', message: 'Draft generation failed.' })
        }
      } else if (action.type === 'apply_module_content') {
        const { data: moduleRow } = await admin
          .from('modules')
          .select('id, content')
          .eq('id', action.module_id)
          .eq('course_id', action.course_id)
          .single()
        if (!moduleRow) {
          actionResults.push({ type: 'apply_module_content', message: 'Module not found.' })
          continue
        }
        const previous = (moduleRow.content as Record<string, unknown> | null) ?? {}
        const nextBody =
          action.mode === 'append' && typeof previous.body === 'string'
            ? `${previous.body}\n\n${action.content}`.trim()
            : action.content
        const nextContent =
          previous.type === 'text' || !previous.type
            ? { type: 'text', body: nextBody }
            : { ...previous, introduction: nextBody }
        const { error: patchError } = await admin
          .from('modules')
          .update({ content: nextContent })
          .eq('id', action.module_id)
          .eq('course_id', action.course_id)
        if (patchError) {
          actionResults.push({ type: 'apply_module_content', message: `Failed to apply content: ${patchError.message}` })
          continue
        }
        await admin.from('learning_events').insert({
          user_id: user.id,
          course_id: action.course_id,
          module_id: action.module_id,
          event_type: 'studio_chat_apply_content',
          payload: { mode: action.mode ?? 'replace' },
          modality: 'studio',
        })
        actionResults.push({ type: 'apply_module_content', message: 'Content applied to module successfully.' })
      }
    }

    const actionsForClient = actions.map((a, i) => {
      const result = actionResults[i]
      if (a.type === 'open_user' && result?.href) return { type: 'open_user', label: a.label ?? 'Open user', href: result.href }
      if (a.type === 'open_course' && result?.href) return { type: 'open_course', label: a.label ?? 'Open course', href: result.href }
      if (a.type === 'open_path' && result?.href) return { type: 'open_path', label: a.label ?? 'Open path', href: result.href }
      return null
    }).filter(Boolean) as Array<{ type: string; label: string; href: string }>

    if (actionsForClient.length > 0) {
      blocks.push({ id: 'actions-1', type: 'action_group', payload: { actions: actionsForClient } })
    }

    return NextResponse.json({
      response: responseTextClean,
      ...(actionsForClient.length > 0 ? { actions: actionsForClient } : {}),
      blocks,
      ...(actionResults.some((r) => r.message) ? { action_messages: actionResults.map((r) => r.message).filter(Boolean) } : {}),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg || 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
