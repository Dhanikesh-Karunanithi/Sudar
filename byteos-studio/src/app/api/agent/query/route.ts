import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getOrgIdAndRole } from '@/lib/org'
import { NextRequest, NextResponse } from 'next/server'
import { chatCompletion, getChatConfigError } from '@/lib/ai/chat'
import { buildStudioContext } from '@/lib/agent/studioContext'
import { STUDIO_ACTION_TYPES, type StudioAction } from '@/lib/agent/types'

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
  pathIds: Set<string>
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

    const configError = getChatConfigError()
    if (configError) {
      return NextResponse.json({ error: 'AI chat not configured. Configure an AI provider in Settings → AI & API Keys.' }, { status: 503 })
    }

    let body: { message?: string; conversation_history?: unknown[]; route?: string; focus_user_id?: string } = {}
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const message = typeof body.message === 'string' ? body.message.trim() : ''
    if (!message) return NextResponse.json({ error: 'message required' }, { status: 400 })

    const admin = createAdminClient()
    const route = typeof body.route === 'string' ? body.route : ''
    const focusUserId = typeof body.focus_user_id === 'string' ? body.focus_user_id : undefined

    const ctx = await buildStudioContext(admin, orgId, { route, focusUserId })

    const systemPrompt = `You are Sudar, the AI assistant for Sudar Studio. You help with **everything** on the platform: Dashboard, Courses (create/edit/publish, modules, SCORM, media), Learning Paths (create, assign), Analytics, Compliance, Users (add, roles, performance, enrollments), Integrations (API keys, embed, event ingestion), AI & API Keys, Org settings, and Help. Use **only** the Platform Knowledge and context below — never invent menus, endpoints, or steps.

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

Use only IDs that appear in the context below. You may output multiple actions in the ACTIONS array. Omit the ACTIONS line if no action is needed.

Context:
${ctx.contextPrompt}`

    const conversationHistory = Array.isArray(body.conversation_history) ? body.conversation_history : []
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...conversationHistory.slice(-8).map((m: { role?: string; content?: string }) => ({
        role: (m.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
        content: String(m.content ?? ''),
      })),
      { role: 'user' as const, content: message },
    ]

    const { content: aiResponse } = await chatCompletion({
      messages,
      max_tokens: 1024,
      temperature: 0.7,
    })

    const responseText = aiResponse?.trim() ?? ''
    const { text: responseTextClean, rawActions } = parseActionsFromResponse(responseText)
    const actions = validateAndParseActions(rawActions, ctx.userIds, ctx.courseIds, ctx.pathIds)

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
        const { data: members } = await admin.from('org_members').select('user_id, role').eq('org_id', orgId).limit(50)
        if (!members?.length) {
          actionResults.push({ type: 'export_users_csv', message: 'No users to export.' })
          continue
        }
        const { data: profiles } = await admin.from('profiles').select('id, full_name').in('id', members.map((m) => m.user_id))
        const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name ?? '']))
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
