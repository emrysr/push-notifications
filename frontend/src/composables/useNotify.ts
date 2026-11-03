const backendUrl = import.meta.env.VITE_BACKEND_API_URL

export interface NotifyPayload {
  title: string
  body?: string
  url?: string
  topic?: string
}

export async function sendNotification(payload: NotifyPayload) {
  const response = await fetch(`${backendUrl}/push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: payload.title,
      body: payload.body || undefined,
      topic: payload.topic || undefined,
      data: payload.url ? { url: payload.url } : undefined,
    }),
  })

  const result = await response.json()
  if (!response.ok) {
    const message = Array.isArray(result?.detail)
      ? result.detail.map((d: { msg: string }) => d.msg).join(', ')
      : (result?.detail ?? `Server responded with ${response.status}`)
    throw new Error(message)
  }

  return result as { sent: number; failed: number; stale_removed: number }
}
