import { ref } from 'vue'

const apiBase = import.meta.env.VITE_PUSH_API_URL
const defaultTopic = import.meta.env.VITE_DEFAULT_TOPIC ?? ''

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i)
  }
  return output
}

const isSupported = 'serviceWorker' in navigator && 'PushManager' in window
const isSubscribed = ref(false)
const isLoading = ref(false)
const error = ref<string | null>(null)

async function getExistingSubscription() {
  const registration = await navigator.serviceWorker.ready
  return registration.pushManager.getSubscription()
}

async function refreshStatus() {
  if (!isSupported) return
  const subscription = await getExistingSubscription()
  isSubscribed.value = !!subscription
}

async function subscribe(topic: string = defaultTopic) {
  if (!isSupported) {
    error.value = 'Push notifications are not supported in this browser.'
    return
  }

  isLoading.value = true
  error.value = null
  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      throw new Error('Notification permission was not granted.')
    }

    const registration = await navigator.serviceWorker.ready
    const { vapidPublicKey } = await fetch(`${apiBase}/vapid-public-key`).then((response) =>
      response.json(),
    )

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    })

    const response = await fetch(`${apiBase}/subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, subscription: subscription.toJSON() }),
    })
    if (!response.ok) throw new Error(`Server responded with ${response.status}`)

    isSubscribed.value = true
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to subscribe.'
  } finally {
    isLoading.value = false
  }
}

async function unsubscribe(topic: string = defaultTopic) {
  isLoading.value = true
  error.value = null
  try {
    const subscription = await getExistingSubscription()
    if (!subscription) {
      isSubscribed.value = false
      return
    }

    const response = await fetch(`${apiBase}/subscriptions`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: subscription.endpoint, topic }),
    })
    if (!response.ok) throw new Error(`Server responded with ${response.status}`)

    await subscription.unsubscribe()
    isSubscribed.value = false
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to unsubscribe.'
  } finally {
    isLoading.value = false
  }
}

export function usePush() {
  return { isSupported, isSubscribed, isLoading, error, subscribe, unsubscribe, refreshStatus }
}
