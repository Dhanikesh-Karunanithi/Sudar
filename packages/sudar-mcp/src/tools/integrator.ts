import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { AlpClient } from '../clients/alp.js'
import type { SudarMcpConfig } from '../config.js'

const eventSchema = z.object({
  event_type: z.string(),
  course_id: z.string().uuid().optional(),
  module_id: z.string().uuid().optional(),
  payload: z.record(z.unknown()).optional(),
  modality: z.string().optional(),
  duration_secs: z.number().int().optional(),
})

export function registerIntegratorTools(server: McpServer, config: SudarMcpConfig): void {
  if (!config.learnUrl || !config.alpApiKey) {
    return
  }
  const alp = new AlpClient(config.learnUrl, config.alpApiKey)

  server.tool(
    'sudar_ingest_learning_events',
    'Ingest a batch of learning events into Sudar (Digital Learner Twin / SudarMemory). Requires Sudar user_id UUID.',
    {
      user_id: z.string().uuid(),
      events: z.array(eventSchema).min(1),
    },
    async ({ user_id, events }) => {
      const result = await alp.ingestEvents({ user_id, events })
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      }
    },
  )

  server.tool(
    'sudar_tutor_query',
    'Ask Sudar tutor a question for a learner (ALP). Returns tutor response JSON.',
    {
      user_id: z.string().uuid(),
      message: z.string().min(1).max(2000),
      context_text: z.string().max(15000).optional(),
      course_id: z.string().uuid().optional(),
      module_id: z.string().uuid().optional(),
    },
    async (args) => {
      const result = await alp.tutorQuery(args)
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      }
    },
  )

  server.tool(
    'sudar_next_best_action',
    'Compute next-best-action recommendation for a learner.',
    {
      user_id: z.string().uuid(),
      current_enrollment_ids: z.array(z.string().uuid()).optional(),
    },
    async ({ user_id, current_enrollment_ids }) => {
      const result = await alp.nextAction({ user_id, current_enrollment_ids })
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      }
    },
  )

  server.tool(
    'sudar_resolve_lms_user',
    'Resolve LMS external user id to Sudar profiles.id (org-scoped API key required).',
    {
      external_user_id: z.string().min(1),
      provider: z.string().optional(),
    },
    async ({ external_user_id, provider }) => {
      const result = await alp.resolveIdentity({ external_user_id, provider })
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      }
    },
  )

  server.tool(
    'sudar_create_embed_token',
    'Create a short-lived embed token and URL for Sudar tutor/widget in an external LMS.',
    {
      user_id: z.string().uuid(),
      course_id: z.string().uuid().optional(),
      module_id: z.string().uuid().optional(),
    },
    async (args) => {
      const result = await alp.embedToken(args)
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      }
    },
  )
}
