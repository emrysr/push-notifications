import { ref } from 'vue'

export interface NotificationPayload {
  url: string
  title?: string
  body?: string
}

const STORAGE_KEY = 'push:last-notification'

function load(): NotificationPayload | null {
  const raw = sessionStorage.getItem(STORAGE_KEY)
  return raw ? (JSON.parse(raw) as NotificationPayload) : null
}

export const lastNotification = ref<NotificationPayload | null>(load())

export function setLastNotification(payload: NotificationPayload) {
  lastNotification.value = payload
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}
