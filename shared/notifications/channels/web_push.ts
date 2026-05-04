import webpush from 'web-push'
import type { SupabaseClient } from '@supabase/supabase-js'
import { asNotificationDb } from '../dbTypes'
import { NOTIFICATION_ICON_PATH } from '../notificationIconPath'

let configured = false
function configureWebPush() {
  if (configured) return
  const pub = process.env.WEB_PUSH_VAPID_PUBLIC_KEY
  const priv = process.env.WEB_PUSH_VAPID_PRIVATE_KEY
  const subject = process.env.WEB_PUSH_SUBJECT
  if (!pub || !priv || !subject) return
  webpush.setVapidDetails(subject, pub, priv)
  configured = true
}

export async function sendWebPush(
  admin: SupabaseClient<unknown>,
  input: { userId: string; title: string; body?: string | null; linkUrl?: string | null; notificationId?: string }
) {
  const db = asNotificationDb(admin)
  configureWebPush()
  if (!configured) return
  const { data: channels } = await db
    .from('notification_channels')
    .select('id, endpoint_payload')
    .eq('user_id', input.userId)
    .eq('channel', 'web_push')
    .is('revoked_at', null)

  const payload = JSON.stringify({
    title: input.title,
    body: input.body ?? '',
    icon: NOTIFICATION_ICON_PATH,
    badge: NOTIFICATION_ICON_PATH,
    data: { url: input.linkUrl ?? '/notifications', notificationId: input.notificationId ?? null },
  })

  for (const row of channels ?? []) {
    try {
      await webpush.sendNotification((row.endpoint_payload as object) ?? {}, payload)
    } catch {
      await db
        .from('notification_channels')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', row.id)
    }
  }
}
