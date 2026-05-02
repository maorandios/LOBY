/* global self, clients */
self.addEventListener('push', (event) => {
  let parsed = {}
  try {
    const t = event.data?.text?.() ?? '{}'
    parsed = JSON.parse(t)
  } catch {
    parsed = {}
  }
  const title = typeof parsed.title === 'string' ? parsed.title : ''
  const body = typeof parsed.body === 'string' ? parsed.body : ''
  const data = parsed.data && typeof parsed.data === 'object' ? parsed.data : {}

  /* Keep options minimal: extra fields can cause some OSes to add an app-name line
     between title and body. No badge (often tied to app attribution on Android). */
  event.waitUntil(
    self.registration.showNotification(title || ' ', {
      body,
      data,
      icon: '/192.png',
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const rawUrl = event.notification?.data?.url
  let target = typeof rawUrl === 'string' && rawUrl.startsWith('http')
    ? rawUrl
    : null
  if (!target && typeof rawUrl === 'string' && rawUrl.startsWith('/')) {
    target = `${self.origin}${rawUrl}`
  }
  target = target || `${self.origin}/feed`

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url === target && 'focus' in c) {
          return c.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(target)
      }
    })
  )
})
