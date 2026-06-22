/** Org-level "Sudar AI" platform provider (FreeLLMAPI proxy on staging pilots). */

import { z } from 'zod'

export const SUDAR_PLATFORM_PROVIDER_ID = 'sudar_platform'
export const SUDAR_PLATFORM_DEFAULT_LABEL = 'Sudar AI'
export const SUDAR_PLATFORM_DEFAULT_MODEL = 'auto'

export const orgAiPlatformPatchSchema = z
  .object({
    enabled: z.boolean().optional(),
    label: z.string().trim().max(64).optional(),
    model: z.string().trim().max(256).optional(),
  })
  .strict()

export type OrgAiPlatformPatch = z.infer<typeof orgAiPlatformPatchSchema>

export type OrgAiPlatformStored = {
  enabled: boolean
  label: string
  model: string
}

export type PlatformAiRuntime = {
  baseUrl: string
  apiKey: string
  defaultModel: string
  label: string
}

export function isOrgPlatformAiFeatureEnabled(): boolean {
  return process.env.ALLOW_ORG_PLATFORM_AI?.trim().toLowerCase() === 'true'
}

export function isFreellmapiConfigured(): boolean {
  return Boolean(
    process.env.FREELLMAPI_API_KEY?.trim() || process.env.FREELLMAPI_BASE_URL?.trim()
  )
}

export function parseOrgAiPlatform(settings: unknown): OrgAiPlatformStored {
  const raw = (settings as Record<string, unknown> | null)?.ai_platform
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { enabled: false, label: SUDAR_PLATFORM_DEFAULT_LABEL, model: SUDAR_PLATFORM_DEFAULT_MODEL }
  }
  const p = raw as Record<string, unknown>
  return {
    enabled: p.enabled === true,
    label:
      typeof p.label === 'string' && p.label.trim()
        ? p.label.trim()
        : SUDAR_PLATFORM_DEFAULT_LABEL,
    model:
      typeof p.model === 'string' && p.model.trim()
        ? p.model.trim()
        : SUDAR_PLATFORM_DEFAULT_MODEL,
  }
}

export function isOrgPlatformAiActive(settings: unknown): boolean {
  if (!isOrgPlatformAiFeatureEnabled() || !isFreellmapiConfigured()) return false
  return parseOrgAiPlatform(settings).enabled
}

export function getFreellmapiEnv(): { baseUrl: string; apiKey: string } | null {
  const apiKey = process.env.FREELLMAPI_API_KEY?.trim()
  const baseRaw = process.env.FREELLMAPI_BASE_URL?.trim() || 'http://localhost:3001/v1'
  const baseUrl = baseRaw.replace(/\/$/, '')
  if (!apiKey && !baseRaw) return null
  if (!apiKey) return null
  return { baseUrl, apiKey }
}

export function buildPlatformAiRuntime(settings: unknown): PlatformAiRuntime | null {
  if (!isOrgPlatformAiActive(settings)) return null
  const env = getFreellmapiEnv()
  if (!env) return null
  const platform = parseOrgAiPlatform(settings)
  return {
    baseUrl: env.baseUrl,
    apiKey: env.apiKey,
    defaultModel: platform.model,
    label: platform.label,
  }
}

export function getOrgPlatformAiConfigError(settings: unknown): string | null {
  const platform = parseOrgAiPlatform(settings)
  if (!platform.enabled) return null
  if (!isOrgPlatformAiFeatureEnabled()) {
    return 'Sudar AI (included pilot tier) is not enabled on this deployment.'
  }
  if (!getFreellmapiEnv()?.apiKey) {
    return 'Sudar AI is enabled for your organisation but the platform operator has not configured the included AI service yet.'
  }
  return null
}
