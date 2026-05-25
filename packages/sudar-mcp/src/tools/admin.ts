import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { bearerGet, bearerPost } from '../clients/bearer.js'
import type { SudarMcpConfig } from '../config.js'
import { maybeAudit } from './audit.js'

export function registerAdminTools(server: McpServer, config: SudarMcpConfig): void {
  if (!config.accessToken) return

  server.tool(
    'sudar_run_admin_agent',
    'Run Sudar admin agent (e.g. path_health cohort pulse). Requires Studio admin JWT in SUDAR_ACCESS_TOKEN.',
    {
      goal_kind: z
        .enum(['week_plan', 'remediation', 'path_health', 'spacing_digest', 'custom'])
        .optional(),
      goal: z.string().max(4000).optional(),
      path_id: z.string().uuid().optional(),
      policy_pack_id: z.string().max(64).optional(),
    },
    async (args) => {
      if (!config.studioUrl) {
        return { content: [{ type: 'text', text: 'SUDAR_STUDIO_URL is required for admin tools.' }], isError: true }
      }
      const res = await bearerPost(config.studioUrl, '/api/agents/runs', config.accessToken, {
        goal_kind: args.goal_kind ?? 'path_health',
        goal: args.goal,
        path_id: args.path_id,
        policy_pack_id: args.policy_pack_id,
      })
      await maybeAudit(config, 'sudar_run_admin_agent', res.ok)
      return {
        content: [{ type: 'text', text: res.text || JSON.stringify({ status: res.status }) }],
        isError: !res.ok,
      }
    },
  )

  server.tool(
    'sudar_list_agent_skills',
    'List Sudar Agents logical tools (Intelligence /api/agents/skills).',
    {},
    async () => {
      const base = config.intelligenceUrl
      if (!base) {
        return {
          content: [{ type: 'text', text: 'SUDAR_INTELLIGENCE_URL is required for sudar_list_agent_skills.' }],
          isError: true,
        }
      }
      const res = await bearerGet(base, '/api/agents/skills', config.accessToken)
      return {
        content: [{ type: 'text', text: res.text || JSON.stringify({ status: res.status }) }],
        isError: !res.ok,
      }
    },
  )
}
