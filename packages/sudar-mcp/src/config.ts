export type Toolset = 'integrator' | 'creator' | 'admin' | 'learner' | 'all'

export type SudarMcpConfig = {
  learnUrl: string
  studioUrl: string
  intelligenceUrl: string
  alpApiKey: string
  accessToken: string
  toolset: Toolset
  mcpAudit: boolean
}

function env(name: string): string {
  return (process.env[name] ?? '').trim()
}

export function loadConfig(override?: Partial<SudarMcpConfig>): SudarMcpConfig {
  const toolsetRaw = override?.toolset ?? (env('SUDAR_TOOLSET') || 'integrator')
  const toolset = (['integrator', 'creator', 'admin', 'learner', 'all'] as const).includes(toolsetRaw as Toolset)
    ? (toolsetRaw as Toolset)
    : 'integrator'

  return {
    learnUrl: (override?.learnUrl ?? env('SUDAR_LEARN_URL')).replace(/\/$/, ''),
    studioUrl: (override?.studioUrl ?? env('SUDAR_STUDIO_URL')).replace(/\/$/, ''),
    intelligenceUrl: (override?.intelligenceUrl ?? env('SUDAR_INTELLIGENCE_URL')).replace(/\/$/, ''),
    alpApiKey: override?.alpApiKey ?? env('SUDAR_ALP_API_KEY'),
    accessToken: override?.accessToken ?? env('SUDAR_ACCESS_TOKEN'),
    toolset: override?.toolset ?? toolset,
    mcpAudit: override?.mcpAudit ?? env('SUDAR_MCP_AUDIT') !== 'false',
  }
}

export function toolsetIncludes(config: SudarMcpConfig, part: Exclude<Toolset, 'all'>): boolean {
  return config.toolset === 'all' || config.toolset === part
}
