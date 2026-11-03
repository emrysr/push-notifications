# Self-Hosted Web Push Service

A lightweight, self-hosted Web Push stack running in Docker, designed to deliver push
notifications to a Progressive Web App (PWA) without depending on third-party ecosystems like
Firebase.

## Architecture Overview

* **Web Push Service (`webpush` / [`go-notify-server`](https://github.com/mpizenberg/go-notify-server))**:
  Manages VAPID keys, stores client subscriptions, and routes push notifications to browser push
  endpoints using the standard Web Push protocol. Exposed on port `8080`.
* **Backend API (`backend/`)**: A Python FastAPI service that fronts the Web Push service for
  anything that needs to *send* notifications, so the `go-notify-server` admin key never has to be
  handed to a client. See [API](#backend-api) below.
* **Frontend PWA (`frontend/`)**: A Vue 3 + TypeScript + Vite PWA that subscribes to the Web Push
  service and displays whatever page a push notification links to. Deployed to GitHub Pages in
  production; the `frontend` Docker Compose service (nginx serving `frontend/dist`) is for local
  testing only. See [`frontend/README.md`](frontend/README.md) for both.
* **Reverse Proxy (`caddy`)**: Automatically provisions and manages TLS/HTTPS certificates, which
  are strictly required by browsers for Web Push functionality outside of `localhost`. Proxies the
  configured `DOMAIN_NAME` to the `webpush` service (see `Caddyfile`).

```
┌─────────────┐   subscribe / unsubscribe   ┌──────────────┐
│ frontend PWA │ ───────────────────────────▶│   webpush    │
│  (Vue PWA)   │                             │ go-notify-   │
└─────────────┘◀─────────── push ────────────│   server     │
       ▲                                      └──────────────┘
       │ notification click (deep link)              ▲
       │                                              │ POST /notify (admin key)
       │                                     ┌──────────────┐
       └─────────── triggered by ───────────│   backend    │
                                              │  (FastAPI)   │
                                              └──────────────┘
```

---

## Prerequisites

* Docker and Docker Compose installed on your host system.
* A domain name pointed to your server (required for production HTTPS/TLS via Caddy). Not
  required for local development — `webpush` and `backend` are also exposed directly on
  `localhost`.
* VAPID keys for authentication. Generate a pair with:
  ```bash
  npx web-push generate-vapid-keys
  ```

## Environment variables

Copy `.env.example` to `.env` and fill in the values:

| Variable              | Used by          | Description                                                                 |
| ---------------------- | ---------------- | ----------------------------------------------------------------------------- |
| `DOMAIN_NAME`          | `caddy`          | Public domain Caddy requests a TLS certificate for and proxies to `webpush`.   |
| `VAPID_PUBLIC_KEY`     | `webpush`        | Public half of the VAPID key pair, also served at `GET /vapid-public-key`.     |
| `VAPID_PRIVATE_KEY`    | `webpush`        | Private half of the VAPID key pair. Keep secret.                              |
| `VAPID_CONTACT_EMAIL`  | `webpush`        | Contact email required by the Web Push protocol (`mailto:` is prepended).     |
| `ADMIN_SECRET_KEY`     | `webpush`, `backend` | Shared bearer token for admin endpoints. `webpush` enforces it on `/notify`; `backend` uses it to call that endpoint on your behalf. |
| `CORS_ORIGIN`          | `webpush`, `backend` | `Access-Control-Allow-Origin` value for both services (e.g. your frontend's origin — `http://localhost:5173` for local dev). Defaults to `*`. |

`WEBPUSH_URL` (used by `backend` to reach `webpush`) is hardcoded to `http://webpush:8080` in
`docker-compose.yml` — the two services talk to each other over the internal Docker network, so it
doesn't need to be set in `.env`.

## Quick Start

```sh
cp .env.example .env
# edit .env with your VAPID keys, admin key, domain, etc.
docker compose up -d --build
```

* `webpush` → `http://localhost:8080` (public: `https://<DOMAIN_NAME>` via Caddy)
* `backend` → `http://localhost:8000`

The frontend isn't started by the command above — it needs a build step first. See
[Testing on localhost](frontend/README.md#testing-on-localhost) in the frontend README for the
full flow (installing the PWA, subscribing, and triggering a real push notification). In short:

```sh
cd frontend && npm run build
cd .. && docker compose up -d frontend
```

* `frontend` → `http://localhost:4173` (nginx serving `frontend/dist`; local testing only — not
  how it's deployed in production, see [`frontend/README.md`](frontend/README.md))

## Backend API

The FastAPI backend (`backend/app/main.py`) exposes:

* `GET /` — sample/health-check route.
* `POST /push` — accepts a JSON payload describing a notification and forwards it to `webpush`'s
  admin `POST /notify` endpoint, attaching the `ADMIN_KEY` bearer token server-side.

  ```json
  {
    "title": "New message",
    "body": "You have a new message from Alice",
    "topic": "general",
    "data": { "url": "/messages/123" }
  }
  ```

  `title` is required; `body`, `icon`, `badge`, `tag`, `lang`, `silent`, `topic`, and `data` are
  optional and passed straight through to `webpush`. `legacy` defaults to `true` so the frontend's
  service worker wakes up and handles the notification click (see
  [`frontend/README.md`](frontend/README.md) for why that matters) — pass `"legacy": false` to use
  `webpush`'s default Declarative Web Push delivery instead.

  The response is `webpush`'s own response, e.g. `{"sent": 1, "failed": 0, "stale_removed": 0}`.

For the full set of `webpush` endpoints (subscription management, topics, etc.), see the
[`go-notify-server` README](https://github.com/mpizenberg/go-notify-server#api).

## Project structure

```
├── docker-compose.yml   # webpush, backend, frontend (local only), caddy services
├── Caddyfile             # reverse proxy config for webpush
├── .env.example          # template for docker-compose environment variables
├── backend/              # FastAPI service that triggers push notifications
└── frontend/              # Vue PWA that subscribes and displays notification content
    ├── nginx.conf         # SPA config for the local-only 'frontend' compose service
    └── dist/              # build output, bind-mounted into that service (git-ignored)
```
