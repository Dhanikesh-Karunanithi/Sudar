import type { SudarMcpConfig } from '../config.js'

export async function maybeAudit(
  config: SudarMcpConfig,
  toolName: string,
  success: boolean,
): Promise<void> {
  if (!config.mcpAudit || !config.learnUrl || !config.accessToken) return
  try {
    await fetch(`${config.learnUrl}/api/mcp/audit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.accessToken}`,
      },
      body: JSON.stringify({ tool: toolName, success, surface: 'learn' }),
    })
  } catch {
    // non-fatal
  }
}

export async function maybeAuditStudio(
  config: SudarMcpConfig,
  toolName: string,
  success: boolean,
): Promise<void> {
  if (!config.mcpAudit || !config.studioUrl || !config.accessToken) return
  try {
    await fetch(`${config.studioUrl}/api/mcp/audit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.accessToken}`,
      },
      body: JSON.stringify({ tool: toolName, success, surface: 'studio' }),
    })
  } catch {
    // non-fatal
  }
}
