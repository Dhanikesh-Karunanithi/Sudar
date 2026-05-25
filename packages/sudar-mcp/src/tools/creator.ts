import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { bearerPost } from '../clients/bearer.js'
import type { SudarMcpConfig } from '../config.js'
import { maybeAuditStudio } from './audit.js'

export function registerCreatorTools(server: McpServer, config: SudarMcpConfig): void {
  if (!config.studioUrl || !config.accessToken) return

  server.tool(
    'sudar_generate_outline',
    'Generate a course module outline (JSON array of module titles) in Sudar Studio.',
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
    'Generate a full draft course (modules + content) in Sudar Studio from a title/topic.',
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
      return {
        content: [{ type: 'text', text: res.text || JSON.stringify({ status: res.status }) }],
        isError: !res.ok,
      }
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
    'Create a draft course shell in Studio (returns course id).',
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
