<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { lastNotification } from '../store/notification'

const route = useRoute()

const matchesCurrentPath = computed(
  () => lastNotification.value && lastNotification.value.url === route.fullPath,
)
</script>

<template>
  <section class="section">
    <div class="container">
      <nav class="breadcrumb" aria-label="breadcrumbs">
        <ul>
          <li><router-link to="/">Home</router-link></li>
          <li class="is-active"><a href="#" aria-current="page">{{ route.fullPath }}</a></li>
        </ul>
      </nav>

      <div v-if="matchesCurrentPath" class="box">
        <h1 class="title is-4">{{ lastNotification?.title }}</h1>
        <p class="content">{{ lastNotification?.body }}</p>
      </div>

      <div v-else class="notification is-light">
        This page was linked to by a push notification at <code>{{ route.fullPath }}</code>, but no
        notification content is available for it in this session.
      </div>
    </div>
  </section>
</template>
