import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/types/database'
import { logWarn } from '@/lib/logger'
import type { NotificationCategory } from '@/types/notifications'
import { dispatchUserNotification } from '@/lib/notifications/dispatch'

type AdminClient = SupabaseClient<Database>

/**
 * Persists an in-app notification (service role). Safe to call from API routes and server logic.
 */
export async function createUserNotification(
  _admin: AdminClient,
  input: {
    userId: string
    category: NotificationCategory
    title: string
    body?: string | null
    linkUrl?: string | null
    metadata?: Record<string, unknown>
  }
): Promise<void> {
  void _admin
  await dispatchUserNotification({
    userId: input.userId,
    category:
      input.category === 'course' ? 'course_assigned' :
      input.category === 'path' ? 'path_assigned' :
      input.category === 'checkin' ? 'checkin_today' :
      input.category === 'level' ? 'level_up' :
      input.category,
    title: input.title,
    body: input.body ?? null,
    linkUrl: input.linkUrl ?? null,
    metadata: (input.metadata ?? {}) as Json,
  }).catch((error: unknown) => {
    const e = error as { code?: string; message?: string }
    logWarn('user_notification_insert_failed', { code: e?.code, message: e?.message ?? 'dispatch_failed' })
  })
}
