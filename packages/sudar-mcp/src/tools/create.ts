import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { AlpClient } from '../clients/alp.js'
import type { SudarMcpConfig } from '../config.js'

function createClient(config: SudarMcpConfig): AlpClient | null {
  if (!config.learnUrl || !config.alpApiKey) return null
  return new AlpClient(config.learnUrl, config.alpApiKey)
}

export function registerCreateTools(server: McpServer, config: SudarMcpConfig): void {
  const alp = createClient(config)
  if (!alp) return

  server.tool(
    'sudar_create_quiz',
    'Generate quiz questions via Sudar Create ALP API (LMS integration).',
    {
      content: z.string().min(1),
      course_title: z.string().optional(),
      module_title: z.string().optional(),
      num_questions: z.number().int().min(1).max(15).optional(),
      export_format: z.enum(['json', 'scorm12']).optional(),
      creator_user_id: z.string().uuid().optional(),
    },
    async (args) => {
      const result = await alp.createQuiz(args)
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.tool(
    'sudar_create_interactive',
    'Generate interactive blocks (timeline, matching, tabs) via Sudar Create.',
    {
      content: z.string().min(1),
      title: z.string().optional(),
      export_format: z.enum(['json', 'scorm12']).optional(),
      creator_user_id: z.string().uuid().optional(),
    },
    async (args) => {
      const result = await alp.createInteractive(args)
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.tool(
    'sudar_create_flashcards',
    'Generate flashcard deck via Sudar Create.',
    {
      content: z.string().min(1),
      module_title: z.string().optional(),
      export_format: z.enum(['json', 'scorm12', 'embed']).optional(),
      creator_user_id: z.string().uuid().optional(),
    },
    async (args) => {
      const result = await alp.createFlashcards(args)
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.tool(
    'sudar_create_outline',
    'Generate course module outline via Sudar Create.',
    {
      course_title: z.string().min(1),
      description: z.string().optional(),
      num_modules: z.number().int().optional(),
      creator_user_id: z.string().uuid().optional(),
    },
    async (args) => {
      const result = await alp.createOutline(args)
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.tool(
    'sudar_create_from_document',
    'Start async document-to-outline job via Sudar Create.',
    {
      creator_user_id: z.string().uuid(),
      text: z.string().optional(),
      url: z.string().url().optional(),
      course_title: z.string().optional(),
      webhook_url: z.string().url().optional(),
    },
    async (args) => {
      const result = await alp.createFromDocument(args)
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.tool(
    'sudar_create_embed_token',
    'Create embed token for Sudar Create teacher UI (/alp/create).',
    {
      creator_user_id: z.string().uuid(),
      tool: z.enum(['quiz', 'interact', 'cards', 'draft', 'media', 'outline']).optional(),
    },
    async (args) => {
      const result = await alp.createEmbedToken(args)
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    },
  )
}
