self.addEventListener('push', (event) => {
  const payload = event.data ? event.data.json() : {}
  const title = payload.title || 'Sudar'
  const body = payload.body || ''
  const icon = payload.icon || '/sudar-logo.png'
  const badge = payload.badge || '/sudar-logo.png'
  const data = payload.data || {}

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      data,
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const data = event.notification.data || {}
  const url = data.url || '/notifications'
  event.waitUntil(
    Promise.all([
      fetch(`/api/notifications/track?id=${encodeURIComponent(data.notificationId || '')}&event=click`, {
        method: 'POST',
      }).catch(() => undefined),
      clients.openWindow(url),
    ])
  )
})
