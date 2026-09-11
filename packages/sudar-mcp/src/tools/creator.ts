import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { bearerGet, bearerPost } from '../clients/bearer.js'
import type { SudarMcpConfig } from '../config.js'
import {
  SUDAR_BUILD_COURSE_TOOL,
  SUDAR_EXPORT_COURSE_TOOL,
  SUDAR_GENERATE_COURSE_TOOL,
  SUDAR_GENERATE_OUTLINE_TOOL,
  SUDAR_GET_COURSE_TOOL,
} from '../instructions.js'
import { maybeAuditStudio } from './audit.js'
import { ensureStudioUrl, nestedData, parseObject, withStudioDirective, formatChatGptCourseDeliverable } from './creatorFormat.js'

function studioText(ok: boolean, body: string) {
  return { content: [{ type: 'text' as const, text: withStudioDirective(ok, body) }], isError: !ok }
}

function deliverCourse(ok: boolean, payload: Record<string, unknown>) {
  return {
    content: [{ type: 'text' as const, text: withStudioDirective(ok, formatChatGptCourseDeliverable(payload)) }],
    isError: !ok,
  }
}

async function maybeAttachExports(
  config: SudarMcpConfig,
  payload: Record<string, unknown>,
  exportFormat: 'html' | 'scorm12' | 'both' | 'none',
): Promise<Record<string, unknown>> {
  if (exportFormat === 'none') return payload
  const courseId = typeof payload.course_id === 'string' ? payload.course_id : null
  if (!courseId) return payload
  const wantHtml = (exportFormat === 'html' || exportFormat === 'both') && payload.html == null
  const wantScorm = (exportFormat === 'scorm12' || exportFormat === 'both') && payload.scorm == null
  if (!wantHtml && !wantScorm) return payload

  const next = { ...payload }
  if (wantHtml) {
    const htmlRes = await bearerGet(
      config.studioUrl,
      `/api/courses/${courseId}/export?format=html`,
      config.accessToken,
    )
    const parsed = parseObject(htmlRes.text)
    if (htmlRes.ok && parsed) next.html = nestedData(parsed)
  }
  if (wantScorm) {
    const scormRes = await bearerGet(
      config.studioUrl,
      `/api/courses/${courseId}/export?format=scorm-1.2&delivery=json`,
      config.accessToken,
    )
    const parsed = parseObject(scormRes.text)
    if (scormRes.ok && parsed) next.scorm = nestedData(parsed)
  }
  return next
}

async function collectCourse(
  config: SudarMcpConfig,
  courseId: string,
  exportFormat: 'html' | 'scorm12' | 'both' | 'none',
  seed?: Record<string, unknown>,
) {
  const res = await bearerGet(config.studioUrl, `/api/courses/${courseId}`, config.accessToken)
  const got = parseObject(res.text)
  const fromGet = Boolean(got && (got.id === courseId || Array.isArray(got.modules)))
  const parsed = (fromGet ? got : seed ?? got) as Record<string, unknown> | null
  if (!parsed) {
    return studioText(false, res.text || JSON.stringify({ status: res.status }))
  }
  const payload = ensureStudioUrl({ ...seed, ...parsed, course_id: courseId }, config.studioUrl)
  const remaining =
    typeof payload.remaining_empty === 'number' ? payload.remaining_empty : null
  if (remaining != null && remaining > 0) {
    await bearerPost(config.studioUrl, '/api/ai/generate-all-modules', config.accessToken, {
      course_id: courseId,
      kick: true,
    })
    return deliverCourse(true, {
      ...payload,
      generation_status: 'running',
      poll_after_seconds: 20,
    })
  }
  const completed = payload.generation_completed === true || remaining === 0
  if (completed && exportFormat !== 'none' && exportFormat !== 'scorm12') {
    const withExports = await maybeAttachExports(config, payload, 'html')
    return deliverCourse(true, withExports)
  }
  return deliverCourse(true, payload)
}

export function registerCreatorTools(server: McpServer, config: SudarMcpConfig): void {
  if (!config.studioUrl || !config.accessToken) return

  server.tool(
    'sudar_build_course',
    SUDAR_BUILD_COURSE_TOOL,
    {
      title: z.string().min(1).optional(),
      course_id: z.string().uuid().optional(),
      brief: z.string().optional(),
      difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
      num_modules: z.number().int().min(2).max(12).optional(),
      target_audience: z.string().optional(),
      export_format: z.enum(['html', 'scorm12', 'both', 'none']).optional(),
    },
    async (args) => {
      try {
        const exportFormat = args.export_format ?? 'both'
        if (args.course_id) {
          return collectCourse(config, args.course_id, exportFormat)
        }
        if (!args.title?.trim()) {
          return studioText(false, JSON.stringify({ error: 'title or course_id required' }))
        }
        const res = await bearerPost(config.studioUrl, '/api/ai/generate-course', config.accessToken, {
          title: args.title,
          brief: args.brief,
          difficulty: args.difficulty ?? 'beginner',
          num_modules: Math.min(args.num_modules ?? 3, 3),
          target_audience: args.target_audience,
          content_density: 'concise',
          apply_quality_filtering: false,
          no_external_video: true,
          background_fill: true,
        })
        const parsed = parseObject(res.text)
        await maybeAuditStudio(config, 'sudar_build_course', Boolean(parsed && parsed.course_id))
        if (!parsed || typeof parsed.course_id !== 'string') {
          return studioText(
            false,
            JSON.stringify({
              status: res.status,
              body: (res.text || '').slice(0, 800),
            }),
          )
        }
        return collectCourse(config, parsed.course_id, exportFormat, parsed)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        return studioText(false, JSON.stringify({ error: message }))
      }
    },
  )

  server.tool(
    'sudar_get_course',
    SUDAR_GET_COURSE_TOOL,
    {
      course_id: z.string().uuid(),
    },
    async (args) => {
      try {
        return collectCourse(config, args.course_id, 'both')
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        return studioText(false, JSON.stringify({ error: message }))
      }
    },
  )

  server.tool(
    'sudar_export_course',
    SUDAR_EXPORT_COURSE_TOOL,
    {
      course_id: z.string().uuid(),
      format: z.enum(['html', 'scorm12', 'both']).optional(),
    },
    async (args) => collectCourse(config, args.course_id, args.format ?? 'both'),
  )

  server.tool(
    'sudar_generate_outline',
    SUDAR_GENERATE_OUTLINE_TOOL,
    {
      course_title: z.string().min(1),
      description: z.string().optional(),
      difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
      num_modules: z.number().int().min(2).max(20).optional(),
    },
    async (args) => {
      const res = await bearerPost(config.studioUrl, '/api/ai/generate-outline', config.accessToken, args)
      await maybeAuditStudio(config, 'sudar_generate_outline', res.ok)
      return {
        content: [{ type: 'text', text: res.text || JSON.stringify({ status: res.status }) }],
        isError: !res.ok,
      }
    },
  )

  server.tool(
    'sudar_generate_course_metadata',
    'Generate course metadata (description, tags, outcomes) for a title/brief.',
    {
      title: z.string().min(1),
      brief: z.string().optional(),
      difficulty: z.string().optional(),
      target_audience: z.string().optional(),
      learning_outcomes: z.array(z.string()).optional(),
    },
    async (args) => {
      const res = await bearerPost(
        config.studioUrl,
        '/api/ai/generate-course-metadata',
        config.accessToken,
        args,
      )
      await maybeAuditStudio(config, 'sudar_generate_course_metadata', res.ok)
      return {
        content: [{ type: 'text', text: res.text || JSON.stringify({ status: res.status }) }],
        isError: !res.ok,
      }
    },
  )

  server.tool(
    'sudar_generate_course',
    SUDAR_GENERATE_COURSE_TOOL,
    {
      title: z.string().min(1),
      brief: z.string().optional(),
      difficulty: z.string().optional(),
      num_modules: z.number().int().optional(),
      target_audience: z.string().optional(),
    },
    async (args) => {
      const res = await bearerPost(config.studioUrl, '/api/ai/generate-course', config.accessToken, args)
      await maybeAuditStudio(config, 'sudar_generate_course', res.ok)
      const parsed = parseObject(res.text)
      const body = parsed
        ? JSON.stringify(ensureStudioUrl(parsed, config.studioUrl), null, 2)
        : res.text || JSON.stringify({ status: res.status })
      return studioText(res.ok, body)
    },
  )

  server.tool(
    'sudar_generate_quiz',
    'Generate quiz questions for a module (requires module_id and content text).',
    {
      module_id: z.string().uuid(),
      content: z.string().min(1),
      course_title: z.string().optional(),
      module_title: z.string().optional(),
      num_questions: z.number().int().min(1).max(15).optional(),
      difficulty: z.string().optional(),
    },
    async (args) => {
      const res = await bearerPost(config.studioUrl, '/api/ai/generate-quiz', config.accessToken, args)
      await maybeAuditStudio(config, 'sudar_generate_quiz', res.ok)
      return {
        content: [{ type: 'text', text: res.text || JSON.stringify({ status: res.status }) }],
        isError: !res.ok,
      }
    },
  )

  server.tool(
    'sudar_generate_from_document',
    'Generate a course from document text or a URL (Studio AI). Provide text OR url.',
    {
      text: z.string().optional(),
      url: z.string().url().optional(),
      difficulty: z.string().optional(),
      target_audience: z.string().optional(),
    },
    async (args) => {
      if (!args.text?.trim() && !args.url) {
        return {
          content: [{ type: 'text', text: 'Provide text or url' }],
          isError: true,
        }
      }
      const res = await bearerPost(
        config.studioUrl,
        '/api/ai/generate-from-document',
        config.accessToken,
        args,
      )
      await maybeAuditStudio(config, 'sudar_generate_from_document', res.ok)
      return {
        content: [{ type: 'text', text: res.text || JSON.stringify({ status: res.status }) }],
        isError: !res.ok,
      }
    },
  )

  server.tool(
    'sudar_create_course',
    'Create a draft course shell in Studio (returns course id). Prefer sudar_build_course for a full generated course.',
    {
      title: z.string().min(1),
      description: z.string().optional(),
      difficulty: z.string().optional(),
    },
    async (args) => {
      const res = await bearerPost(config.studioUrl, '/api/courses', config.accessToken, args)
      await maybeAuditStudio(config, 'sudar_create_course', res.ok)
      return {
        content: [{ type: 'text', text: res.text || JSON.stringify({ status: res.status }) }],
        isError: !res.ok,
      }
    },
  )

  server.tool(
    'sudar_list_courses',
    'List draft/published courses in your organisation (Studio).',
    {},
    async () => {
      const res = await fetch(`${config.studioUrl}/api/courses`, {
        headers: { Authorization: `Bearer ${config.accessToken}` },
      })
      const text = await res.text()
      await maybeAuditStudio(config, 'sudar_list_courses', res.ok)
      return {
        content: [{ type: 'text', text: text || JSON.stringify({ status: res.status }) }],
        isError: !res.ok,
      }
    },
  )
}
