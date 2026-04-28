/* global self, clients */
self.addEventListener('push', (event) => {
  let parsed = {}
  try {
    const t = event.data?.text?.() ?? '{}'
    parsed = JSON.parse(t)
  } catch {
    parsed = {}
  }
  const title = typeof parsed.title === 'string' ? parsed.title : 'לובי'
  const body = typeof parsed.body === 'string' ? parsed.body : ''
  const data = parsed.data && typeof parsed.data === 'object' ? parsed.data : {}

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      data,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      lang: 'he',
      dir: 'rtl',
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
