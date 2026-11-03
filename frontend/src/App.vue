<script setup lang="ts"></script>

<template>
  <nav class="navbar is-primary" role="navigation" aria-label="main navigation">
    <div class="navbar-brand">
      <router-link class="navbar-item" to="/"><strong>Push Notifications</strong></router-link>
    </div>
    <div class="navbar-menu">
      <div class="navbar-start">
        <router-link class="navbar-item" to="/send">Send Notification</router-link>
      </div>
    </div>
  </nav>

  <router-view />
</template>
