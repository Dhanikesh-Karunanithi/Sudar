import type { SupabaseClient } from '@supabase/supabase-js'

export async function emitInAppRealtime(
  admin: SupabaseClient<unknown>,
  input: { userId: string; notificationId?: string; category: string; title: string; linkUrl?: string | null }
) {
  await admin.channel(`notifications:${input.userId}`).send({
    type: 'broadcast',
    event: 'notification',
    payload: {
      notificationId: input.notificationId ?? null,
      category: input.category,
      title: input.title,
      linkUrl: input.linkUrl ?? null,
    },
  })
}
