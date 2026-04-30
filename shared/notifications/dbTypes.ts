import type { SupabaseClient } from '@supabase/supabase-js'

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type NotificationDatabase = {
  public: {
    Tables: {
      notification_preferences: {
        Row: { user_id: string; category_slug: string; channel: string; enabled: boolean }
        Insert: { user_id: string; category_slug: string; channel: string; enabled?: boolean }
        Update: { enabled?: boolean }
        Relationships: []
      }
      notification_delivery_log: {
        Row: {
          id: string
          user_id: string
          notification_id: string | null
          category_slug: string
          channel: string
          status: string
          suppression_reason: string | null
          sent_at: string | null
          opened_at: string | null
          clicked_at: string | null
          created_at: string
          metadata: Json
        }
        Insert: {
          id?: string
          user_id: string
          notification_id?: string | null
          category_slug: string
          channel: string
          status?: string
          suppression_reason?: string | null
          sent_at?: string | null
          opened_at?: string | null
          clicked_at?: string | null
          metadata?: Json
        }
        Update: {
          status?: string
          suppression_reason?: string | null
          sent_at?: string | null
          opened_at?: string | null
          clicked_at?: string | null
          metadata?: Json
        }
        Relationships: []
      }
      user_notification_settings: {
        Row: {
          user_id: string
          timezone: string | null
          quiet_hours_start: string | null
          quiet_hours_end: string | null
          frequency_mode: string | null
          coin_opt_in_awarded_at: string | null
          last_revoke_at: string | null
          last_monthly_bonus_at: string | null
          never_prompt_push: boolean | null
          daily_digest_email: boolean | null
        }
        Insert: {
          user_id: string
          timezone?: string | null
          quiet_hours_start?: string | null
          quiet_hours_end?: string | null
          frequency_mode?: string | null
          coin_opt_in_awarded_at?: string | null
          last_revoke_at?: string | null
          last_monthly_bonus_at?: string | null
          never_prompt_push?: boolean | null
          daily_digest_email?: boolean | null
        }
        Update: {
          timezone?: string | null
          quiet_hours_start?: string | null
          quiet_hours_end?: string | null
          frequency_mode?: string | null
          coin_opt_in_awarded_at?: string | null
          last_revoke_at?: string | null
          last_monthly_bonus_at?: string | null
          never_prompt_push?: boolean | null
          daily_digest_email?: boolean | null
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          id: string
          user_id: string
          category: string
          title: string
          body: string | null
          link_url: string | null
          metadata: Json
        }
        Insert: {
          id?: string
          user_id: string
          category: string
          title: string
          body?: string | null
          link_url?: string | null
          metadata?: Json
        }
        Update: {
          category?: string
          title?: string
          body?: string | null
          link_url?: string | null
          metadata?: Json
        }
        Relationships: []
      }
      notification_channels: {
        Row: {
          id: string
          user_id: string
          channel: string
          endpoint_payload: Json
          endpoint_hash: string | null
          revoked_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          channel: string
          endpoint_payload?: Json
          endpoint_hash?: string | null
          revoked_at?: string | null
        }
        Update: { revoked_at?: string | null; endpoint_payload?: Json; endpoint_hash?: string | null }
        Relationships: []
      }
      learner_profiles: {
        Row: { user_id: string; coin_balance: number }
        Insert: { user_id: string; coin_balance?: number }
        Update: { coin_balance?: number }
        Relationships: []
      }
      coin_ledger: {
        Row: { id: string; user_id: string; amount: number; event_type: string; reference_id: string; balance_after: number; metadata: Json }
        Insert: { id?: string; user_id: string; amount: number; event_type: string; reference_id: string; balance_after: number; metadata?: Json }
        Update: { metadata?: Json }
        Relationships: []
      }
      learning_events: {
        Row: { id: string; user_id: string; event_type: string; created_at: string }
        Insert: { id?: string; user_id: string; event_type: string; created_at?: string }
        Update: { event_type?: string }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type NotificationSupabaseClient = SupabaseClient<NotificationDatabase>

export function asNotificationDb(admin: SupabaseClient<unknown>): NotificationSupabaseClient {
  return admin as unknown as NotificationSupabaseClient
}
