// Cache Storage, unlike sessionStorage, is readable from both the service
// worker and any page — including a window opened fresh in response to a
// notification click, which has no session state of its own.
const CACHE_NAME = 'push-notification-data'
const DATA_KEY = '/__notification-data__'

export interface StoredNotification {
  title?: string
  body?: string
}

async function readAll(): Promise<Record<string, StoredNotification>> {
  const cache = await caches.open(CACHE_NAME)
  const match = await cache.match(DATA_KEY)
  return match ? ((await match.json()) as Record<string, StoredNotification>) : {}
}

export async function storeNotification(url: string, data: StoredNotification) {
  const cache = await caches.open(CACHE_NAME)
  const all = await readAll()
  all[url] = data
  await cache.put(DATA_KEY, new Response(JSON.stringify(all)))
}

export async function getNotification(url: string): Promise<StoredNotification | null> {
  const all = await readAll()
  return all[url] ?? null
}
