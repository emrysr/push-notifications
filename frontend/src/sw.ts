/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>
}

precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

interface PushPayload {
  title?: string
  body?: string
  icon?: string
  badge?: string
  tag?: string
  silent?: boolean
  data?: { url?: string; [key: string]: unknown }
}

self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return

  // The server sends either a plain payload ("legacy"/"mutable" mode) or a
  // Declarative Web Push envelope ({ web_push: 8030, notification: {...} }).
  // Normalize to a plain payload so this handler works either way.
  const raw = event.data.json() as PushPayload & { notification?: PushPayload }
  const payload: PushPayload = raw.notification ?? raw

  const title = payload.title ?? 'New notification'
  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body,
      icon: payload.icon ?? '/icons/icon-192.png',
      badge: payload.badge,
      tag: payload.tag,
      silent: payload.silent ?? undefined,
      data: payload.data ?? {},
    }),
  )
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()

  const url = (event.notification.data?.url as string | undefined) ?? '/'
  const targetUrl = new URL(url, self.registration.scope).href

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })

      const existing = allClients.find((client) => client.url.startsWith(self.registration.scope))

      if (existing) {
        await existing.focus()
        existing.postMessage({
          type: 'push-navigate',
          url,
          title: event.notification.title,
          body: event.notification.body,
        })
        return
      }

      await self.clients.openWindow(targetUrl)
    })(),
  )
})
