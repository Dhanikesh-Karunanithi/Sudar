function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

export async function registerServiceWorkerAndSubscribe(): Promise<{ ok: boolean; reason?: string }> {
  if (!('serviceWorker' in navigator)) return { ok: false, reason: 'service_worker_unsupported' }
  if (!('PushManager' in window)) return { ok: false, reason: 'push_unsupported' }
  if (Notification.permission !== 'granted') return { ok: false, reason: 'permission_not_granted' }
  const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY
  if (!publicKey) return { ok: false, reason: 'missing_public_key' }

  const registration = await navigator.serviceWorker.register('/sw.js')
  const sub = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  })
  const response = await fetch('/api/notifications/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription: sub.toJSON() }),
  })
  if (!response.ok) return { ok: false, reason: 'subscribe_api_failed' }
  return { ok: true }
}

export async function unsubscribeWebPush(): Promise<{ ok: boolean; reason?: string }> {
  const reg = await navigator.serviceWorker.getRegistration('/sw.js')
  const sub = await reg?.pushManager.getSubscription()
  if (!sub) return { ok: true }
  const endpoint = sub.endpoint
  await sub.unsubscribe()
  const response = await fetch('/api/notifications/push/unsubscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint }),
  })
  if (!response.ok) return { ok: false, reason: 'unsubscribe_api_failed' }
  return { ok: true }
}
