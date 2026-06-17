import type { SupabaseClient } from '@supabase/supabase-js'

export type AccessSupabaseClient = SupabaseClient<Record<string, unknown>>

export type AccessTier = 'default' | 'early_access' | 'tester' | 'unlimited'

export type InviteCodeType = 'early_access' | 'tester'

export type InviteValidation =
  | { valid: false; error: string }
  | {
      valid: true
      code: string
      type: InviteCodeType
      grantsTier: AccessTier
      bonusCredits: number
      referrerId?: string
    }
