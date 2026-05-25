import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { bearerPost, parseJsonResponse } from '../clients/bearer.js'
import type { SudarMcpConfig } from '../config.js'
import { maybeAudit } from './audit.js'

export function registerLearnerTools(server: McpServer, config: SudarMcpConfig): void {
  if (!config.learnUrl || !config.accessToken) return

  server.tool(
    'sudar_run_learner_agent',
    'Run Sudar learner agent (e.g. week_plan). Org toggles and learner opt-outs enforced by Learn BFF.',
    {
      goal_kind: z
        .enum(['week_plan', 'remediation', 'path_health', 'spacing_digest', 'custom'])
        .optional(),
      goal: z.string().max(4000).optional(),
      force_nba_refresh: z.boolean().optional(),
      policy_pack_id: z.string().max(64).optional(),
    },
    async (args) => {
      const res = await bearerPost(config.learnUrl, '/api/agents/runs', config.accessToken, {
        goal_kind: args.goal_kind ?? 'week_plan',
        goal: args.goal,
        force_nba_refresh: args.force_nba_refresh === true,
        policy_pack_id: args.policy_pack_id,
      })
      await maybeAudit(config, 'sudar_run_learner_agent', res.ok)
      return {
        content: [{ type: 'text', text: res.text || JSON.stringify({ status: res.status }) }],
        isError: !res.ok,
      }
    },
  )

  server.tool(
    'sudar_learner_tutor_query',
    'Ask Sudar tutor as the signed-in learner (Learn /api/tutor/query).',
    {
      message: z.string().min(1).max(2000),
      course_id: z.string().uuid().optional(),
      module_id: z.string().uuid().optional(),
      context_text: z.string().max(15000).optional(),
    },
    async (args) => {
      const res = await bearerPost(config.learnUrl, '/api/tutor/query', config.accessToken, args)
      await maybeAudit(config, 'sudar_learner_tutor_query', res.ok)
      return {
        content: [{ type: 'text', text: res.text || JSON.stringify({ status: res.status }) }],
        isError: !res.ok,
      }
    },
  )

  server.tool(
    'sudar_learner_next_action',
    'Refresh next-best-action for the signed-in learner.',
    {
      force: z.boolean().optional(),
    },
    async ({ force }) => {
      const res = await bearerPost(config.learnUrl, '/api/intelligence/next-action', config.accessToken, {
        force: force === true,
      })
      await maybeAudit(config, 'sudar_learner_next_action', res.ok)
      return {
        content: [{ type: 'text', text: res.text || JSON.stringify({ status: res.status }) }],
        isError: !res.ok,
      }
    },
  )

  server.tool(
    'sudar_learner_proactive_nudge',
    'Generate a proactive tutor nudge for the current module (idle/quiz/replay).',
    {
      course_id: z.string().uuid(),
      module_id: z.string().uuid(),
      reason: z.enum(['idle_90s', 'quiz_low_score', 'replay_pattern']).optional(),
    },
    async (args) => {
      const res = await bearerPost(config.learnUrl, '/api/tutor/proactive-nudge', config.accessToken, args)
      await maybeAudit(config, 'sudar_learner_proactive_nudge', res.ok)
      const parsed = parseJsonResponse(res.text)
      return {
        content: [{ type: 'text', text: JSON.stringify(parsed, null, 2) }],
        isError: !res.ok,
      }
    },
  )
}
