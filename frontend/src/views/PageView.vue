<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getNotification, type StoredNotification } from '../push-cache'

const route = useRoute()
const content = ref<StoredNotification | null>(null)

watch(
  () => route.fullPath,
  async (path) => {
    content.value = await getNotification(path)
  },
  { immediate: true },
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

      <div v-if="content" class="box">
        <h1 class="title is-4">{{ content.title }}</h1>
        <p class="content">{{ content.body }}</p>
      </div>

      <div v-else class="notification is-light">
        This page was linked to by a push notification at <code>{{ route.fullPath }}</code>, but no
        notification content is available for it in this session.
      </div>
    </div>
  </section>
</template>
