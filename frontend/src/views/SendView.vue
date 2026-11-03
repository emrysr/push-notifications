<script setup lang="ts">
import { ref } from 'vue'
import { sendNotification } from '../composables/useNotify'

const title = ref('Test notification')
const body = ref('Hello from the send page!')
const url = ref('/messages/123')
const topic = ref(import.meta.env.VITE_DEFAULT_TOPIC)

const isSending = ref(false)
const error = ref<string | null>(null)
const result = ref<{ sent: number; failed: number; stale_removed: number } | null>(null)

async function onSubmit() {
  isSending.value = true
  error.value = null
  result.value = null
  try {
    result.value = await sendNotification({
      title: title.value,
      body: body.value,
      url: url.value,
      topic: topic.value,
    })
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to send notification.'
  } finally {
    isSending.value = false
  }
}
</script>

<template>
  <section class="section">
    <div class="container">
      <h1 class="title">Send a Notification</h1>
      <p class="subtitle">
        Posts to the backend API, which triggers a push notification through
        <code>go-notify-server</code>.
      </p>

      <form @submit.prevent="onSubmit">
        <div class="field">
          <label class="label">Title</label>
          <div class="control">
            <input v-model="title" class="input" type="text" required />
          </div>
        </div>

        <div class="field">
          <label class="label">Body</label>
          <div class="control">
            <textarea v-model="body" class="textarea" rows="3"></textarea>
          </div>
        </div>

        <div class="field">
          <label class="label">Link (opened when the notification is clicked)</label>
          <div class="control">
            <input v-model="url" class="input" type="text" placeholder="/messages/123" />
          </div>
        </div>

        <div class="field">
          <label class="label">Topic</label>
          <div class="control">
            <input v-model="topic" class="input" type="text" placeholder="general" />
          </div>
          <p class="help">Leave blank to broadcast to every subscriber.</p>
        </div>

        <div class="field">
          <div class="control">
            <button class="button is-primary" :class="{ 'is-loading': isSending }" type="submit">
              Send notification
            </button>
          </div>
        </div>
      </form>

      <div v-if="result" class="notification is-success">
        Sent: {{ result.sent }} · Failed: {{ result.failed }} · Stale removed:
        {{ result.stale_removed }}
      </div>
      <div v-if="error" class="notification is-danger">{{ error }}</div>
    </div>
  </section>
</template>
