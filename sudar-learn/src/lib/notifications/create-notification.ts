import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/types/database'
import { logWarn } from '@/lib/logger'
import type { NotificationCategory } from '@/types/notifications'

type AdminClient = SupabaseClient<Database>

/**
 * Persists an in-app notification (service role). Safe to call from API routes and server logic.
 */
export async function createUserNotification(
  admin: AdminClient,
  input: {
    userId: string
    category: NotificationCategory
    title: string
    body?: string | null
    linkUrl?: string | null
    metadata?: Record<string, unknown>
  }
): Promise<void> {
  const { error } = await admin.from('user_notifications').insert({
    user_id: input.userId,
    category: input.category,
    title: input.title,
    body: input.body ?? null,
    link_url: input.linkUrl ?? null,
    metadata: (input.metadata ?? {}) as Json,
  })
  if (error) {
    logWarn('user_notification_insert_failed', {
      code: error.code,
      message: error.message,
    })
  }
}
