# Self-Hosted Web Push Service

A lightweight, self-hosted Web Push backend running in Docker, designed to deliver push notifications to Progressive Web Apps (PWAs) without depending on third-party ecosystems like Firebase.

## Architecture Overview

* **Web Push Service (`go-notify-server`)**: Manages VAPID keys, stores client subscriptions, and routes push notifications to browser push endpoints using the standard Web Push protocol.
* **Reverse Proxy (`Caddy`)**: Automatically provisions and manages TLS/HTTPS certificates, which are strictly required by browsers for Web Push functionality outside of `localhost`.

---

## Prerequisites

* Docker and Docker Compose installed on your host system.
* A domain name pointed to your server (required for production HTTPS/TLS via Caddy).
* VAPID keys for authentication. You can generate a pair using Node.js:
  ```bash
  npx web-push generate-vapid-keys

## Quick Start

```
├── docker-compose.yml
├── .env
└── Caddyfile
```


