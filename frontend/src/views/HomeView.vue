<script setup lang="ts">
import { onMounted } from 'vue'
import { usePush } from '../composables/usePush'

const { isSupported, isSubscribed, isLoading, error, subscribe, unsubscribe, refreshStatus } =
  usePush()

onMounted(refreshStatus)
</script>

<template>
  <section class="section">
    <div class="container">
      <h1 class="title">Push Notifications</h1>
      <p class="subtitle">Subscribe to receive push notifications on this device.</p>

      <div v-if="!isSupported" class="notification is-warning">
        Push notifications are not supported in this browser.
      </div>

      <template v-else>
        <div class="buttons">
          <button
            class="button is-primary"
            :class="{ 'is-loading': isLoading }"
            :disabled="isSubscribed"
            @click="subscribe()"
          >
            Subscribe
          </button>
          <button
            class="button"
            :class="{ 'is-loading': isLoading }"
            :disabled="!isSubscribed"
            @click="unsubscribe()"
          >
            Unsubscribe
          </button>
        </div>

        <div class="notification" :class="isSubscribed ? 'is-success' : 'is-light'">
          Status: {{ isSubscribed ? 'Subscribed' : 'Not subscribed' }}
        </div>

        <div v-if="error" class="notification is-danger">{{ error }}</div>
      </template>
    </div>
  </section>
</template>
