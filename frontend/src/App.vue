<script setup lang="ts"></script>

<template>
  <nav class="navbar is-primary" role="navigation" aria-label="main navigation">
    <div class="navbar-brand">
      <router-link class="navbar-item" to="/"><strong>Push Notifications</strong></router-link>
    </div>
    <!-- is-active forces the menu to stay expanded on mobile too, since there's no
         burger toggle here and the one nav link should always be reachable. -->
    <div class="navbar-menu is-active">
      <div class="navbar-start">
        <router-link class="navbar-item" to="/send">Send Notification</router-link>
      </div>
    </div>
  </nav>

  <div class="notification is-warning is-light" style="border-radius: 0; margin-bottom: 0">
    This demo currently only works when opened via its ngrok tunnel URL, not this app's
    GitHub Pages URL — see the <a href="https://github.com/emrysr/push-notifications#readme">README</a>
    for details.
  </div>

  <router-view />

  <footer class="footer">
    <div class="content has-text-centered">
      <p>
        <strong>Getting started:</strong> install this app via your browser's "Install app" /
        "Add to Home Screen" option, then go to <router-link to="/">Home</router-link> and tap
        <strong>Subscribe</strong> to grant notification permission. Use
        <router-link to="/send">Send Notification</router-link> to trigger a test push — it'll
        arrive even if this app is closed, and tapping it should open straight to the linked page.
      </p>
    </div>
  </footer>
</template>
