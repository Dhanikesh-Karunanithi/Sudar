import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { loadConfig, toolsetIncludes, type SudarMcpConfig } from './config.js'
import { registerIntegratorTools } from './tools/integrator.js'
import { registerCreateTools } from './tools/create.js'
import { registerAdminTools } from './tools/admin.js'
import { registerLearnerTools } from './tools/learner.js'
import { registerCreatorTools } from './tools/creator.js'

export function registerSudarTools(server: McpServer, config: SudarMcpConfig): void {
  if (toolsetIncludes(config, 'integrator')) {
    registerIntegratorTools(server, config)
    registerCreateTools(server, config)
  }
  if (toolsetIncludes(config, 'creator')) {
    registerCreatorTools(server, config)
  }
  if (toolsetIncludes(config, 'admin')) {
    registerAdminTools(server, config)
  }
  if (toolsetIncludes(config, 'learner')) {
    registerLearnerTools(server, config)
  }
}

export function createSudarMcpServer(configOverride?: Partial<SudarMcpConfig>): McpServer {
  const config = loadConfig(configOverride)
  const server = new McpServer({
    name: 'sudar',
    version: '0.2.0',
  })
  registerSudarTools(server, config)
  return server
}
