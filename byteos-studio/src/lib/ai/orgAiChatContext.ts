import { buildPrivateOpenAiRuntime, type PrivateOpenAiRuntime } from '@/types/orgAiInference'

export type OrgAiChatContext = {
  orgSettings: unknown
  privateRuntime: PrivateOpenAiRuntime | null
}

export function orgSettingsToAiChatContext(settings: unknown): OrgAiChatContext {
  return {
    orgSettings: settings ?? {},
    privateRuntime: buildPrivateOpenAiRuntime(settings),
  }
}
