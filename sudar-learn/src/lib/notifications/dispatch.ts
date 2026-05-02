import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { dispatchNotification, type DispatchNotificationInput } from '../../../../shared/notifications/engine'
import { sendWebPush } from '../../../../shared/notifications/channels/web_push'
import { sendEmailNotification, buildUnsubscribeUrl } from '../../../../shared/notifications/channels/email'
import { emitInAppRealtime } from '../../../../shared/notifications/channels/in_app'
import { createUnsubscribeToken } from '../../../../shared/notifications/unsubscribeToken'

function safeRelativeLink(url: string | null | undefined): string {
  if (!url?.trim()) return '/notifications'
  if (!url.startsWith('/') || url.startsWith('//')) return '/notifications'
  return url
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function dispatchUserNotification(input: DispatchNotificationInput) {
  const admin = createServiceRoleSupabaseClient()

  const result = await dispatchNotification(admin, input, {
    in_app: async (payload) => {
      await emitInAppRealtime(admin, {
        userId: payload.userId,
        notificationId: payload.notificationId,
        category: payload.category,
        title: payload.title,
        linkUrl: payload.linkUrl,
      })
    },
    web_push: async (payload) => {
      await sendWebPush(admin, payload)
    },
    email: async (payload) => {
      const auth = await admin.auth.admin.getUserById(payload.userId)
      const email = auth.data?.user?.email
      if (!email) return
      const unsub = buildUnsubscribeUrl(createUnsubscribeToken(payload.userId))
      await sendEmailNotification({
        to: email,
        subject: payload.title,
        html: `<p>${escapeHtml(payload.body ?? '')}</p><p><a href="${safeRelativeLink(payload.linkUrl)}">Open in Sudar</a></p><p style="font-size:12px;color:#667085">Manage notifications: <a href="${unsub}">unsubscribe</a></p>`,
      })
    },
  })

  return result
}
