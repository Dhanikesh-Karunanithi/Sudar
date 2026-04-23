export interface ForegroundNotificationPayload {
  title: string
  body?: string | null
  tag?: string
}

export function canUseForegroundNotifications(): boolean {
  if (typeof window === 'undefined') return false
  return 'Notification' in window && window.isSecureContext
}

export async function requestForegroundNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!canUseForegroundNotifications()) return 'unsupported'
  if (Notification.permission === 'default') return Notification.requestPermission()
  return Notification.permission
}

export function showForegroundNotification(payload: ForegroundNotificationPayload): boolean {
  if (!canUseForegroundNotifications() || Notification.permission !== 'granted') return false
  const icon = new URL('/sudar-logo.png', window.location.origin).href
  const notification = new Notification(payload.title, {
    body: payload.body ?? '',
    tag: payload.tag,
    icon,
    badge: icon,
  })
  notification.onclick = () => {
    try {
      window.focus()
    } catch {}
    notification.close()
  }
  return true
}
