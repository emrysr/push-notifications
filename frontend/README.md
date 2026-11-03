# Push Notifications PWA

A Vue 3 + TypeScript PWA (built with Vite) that subscribes to the [`go-notify-server`](../README.md)
Web Push backend and displays whatever page a push notification links to.

## How it works

- `src/sw.ts` is a custom service worker (built via `vite-plugin-pwa`'s `injectManifest`
  strategy). It listens for `push` events to show the notification, and for
  `notificationclick` events to focus an existing app window (or open a new one) at the
  URL carried in the notification's `data.url` field.
- `src/composables/usePush.ts` fetches the `go-notify-server`'s VAPID public key and manages
  subscribing/unsubscribing via its `/vapid-public-key` and `/subscriptions` endpoints.
- `src/composables/useNotify.ts` posts to the `backend`'s `POST /push` endpoint (see the root
  [README](../README.md#backend-api)), which triggers an actual push notification.
  `src/views/SendView.vue` (at `/send`) is a form built on top of it, for manually testing the
  whole subscribe → send → receive → click flow.
- `src/router` uses a catch-all route so any `data.url` path (e.g. `/messages/123`) renders
  `src/views/PageView.vue` inside the app shell instead of leaving it.
- Styling uses [Bulma v1](https://bulma.io/).

### Sending a notification the service worker can act on

By default the backend wraps notifications in the Declarative Web Push format, which lets
Safari show them without waking the service worker — but that also skips our custom
`notificationclick` handler. Send `"legacy": true` (or `"mutable": true`) in the `/notify` /
`/topics/{topic}/notify` payload so this app's service worker handles the click:

```json
{
  "title": "New message",
  "body": "You have a new message from Alice",
  "data": { "url": "/messages/123" },
  "legacy": true
}
```

## Project setup

```sh
npm install
cp .env.example .env   # point VITE_PUSH_API_URL / VITE_BACKEND_API_URL at your services
npm run dev
```

Build for production:

```sh
npm run build
```

## Testing on localhost

1. From the repo root, start `webpush` and `backend` (see the root
   [README](../README.md#quick-start)):
   ```sh
   cp .env.example .env   # fill in real VAPID keys + ADMIN_SECRET_KEY
   docker compose up -d --build webpush backend
   ```
2. Serve the frontend. Either works — both are secure contexts, so the service worker, push
   subscription, and install prompt all work without HTTPS:
   - **Dev server** (hot reload, best while actively changing code):
     ```sh
     cd frontend && npm install && npm run dev
     ```
     Open the printed `http://localhost:5173` URL.
   - **Production build served by nginx** (closer to the real GitHub Pages deployment —
     catches base-path/service-worker-caching issues the dev server won't show):
     ```sh
     cd frontend && npm run build   # writes to frontend/dist
     cd .. && docker compose up -d frontend
     ```
     Open `http://localhost:4173`. Re-run `npm run build` after any change — nginx reads
     `frontend/dist` straight off disk (bind-mounted, see `docker-compose.yml`), so there's
     no container rebuild or restart needed, just a page refresh.
3. **Install the PWA**: click the install icon in the address bar (or the browser's "Install
   app" / "Add to Home Screen" menu item). This is only available once the service worker has
   registered and the manifest has loaded — reload once if you don't see it right away.
4. On the home page (`/`), click **Subscribe** and accept the notification permission prompt.
5. Go to **Send Notification** (`/send`), fill in a title/body/link, and submit. It posts to the
   `backend`'s `/push` endpoint, which forwards to `webpush`'s `/notify` endpoint, which delivers
   an actual push message to your browser — even with the PWA closed, if it's installed.
6. Clicking the resulting notification focuses the installed app (or opens it) and navigates to
   the link you set, rendered by `src/views/PageView.vue`.

## Testing from a mobile device (ngrok)

The localhost setup above only reaches devices on the same machine. To subscribe and receive a
real push on your phone, `webpush`, `backend`, and the frontend all need to be reachable over
HTTPS from the phone — `localhost` won't resolve to anything useful on a different device.
[ngrok](https://ngrok.com) tunnels all three at once:

1. With `webpush` (`:8080`), `backend` (`:8000`), and the built frontend served by nginx
   (`:4173`, see above) all running, start one ngrok agent with three tunnels:
   ```sh
   ngrok start --all --config ~/.config/ngrok/ngrok.yml --config ngrok-tunnels.yml
   ```
   where `ngrok-tunnels.yml` defines:
   ```yaml
   version: "3"
   tunnels:
     frontend:
       proto: http
       addr: 4173
     webpush:
       proto: http
       addr: 8080
     backend:
       proto: http
       addr: 8000
   ```
2. Note the three `https://*.ngrok-free.app` URLs ngrok prints (or check
   `http://127.0.0.1:4040/api/tunnels`).
3. Set `frontend/.env`'s `VITE_PUSH_API_URL` and `VITE_BACKEND_API_URL` to the `webpush` and
   `backend` ngrok URLs, then `npm run build` — this bakes the tunnel URLs into the bundle nginx
   is already serving, no restart needed.
4. Open the **frontend's** ngrok URL on your phone (dismiss ngrok's one-time free-tier warning
   page) and follow the same install/subscribe/send steps as above.

Free ngrok URLs are random and change every time the tunnel restarts — if that happens, update
`frontend/.env` and rebuild again. This is also why the GitHub Pages deployment (below) can't be
used for this: it's a one-time static build with whatever API URLs were set at build time, and
ngrok URLs aren't stable enough to bake in permanently. The in-app banner on every page is a
reminder of this limitation.

## Deploying to GitHub Pages

This repo includes `.github/workflows/deploy-frontend.yml`, which builds `frontend/` and
publishes `frontend/dist` to GitHub Pages on every push to `master` that touches `frontend/`.

One-time setup:

1. In the repo's **Settings → Pages**, set **Source** to **GitHub Actions**.
2. In **Settings → Secrets and variables → Actions → Variables**, add:
   - `VITE_PUSH_API_URL` — the public URL of your deployed `go-notify-server` (e.g.
     `https://push.yourdomain.com`)
   - `VITE_BACKEND_API_URL` — the public URL of your deployed `backend` (e.g.
     `https://api.yourdomain.com`)
   - `VITE_DEFAULT_TOPIC` — optional, the default subscription topic

The app is served at `https://<user>.github.io/push-notifications/`. The workflow builds with
`BASE_PATH=/push-notifications/` (see `vite.config.ts`, which otherwise defaults `base` to `/`
for local builds), and `public/404.html` is a standard [SPA-on-GitHub-Pages
redirect](https://github.com/rafgraph/spa-github-pages). If you ever rename the repository,
update `BASE_PATH` in `.github/workflows/deploy-frontend.yml` and `pathSegmentsToKeep` in
`public/404.html` to match.

**Note:** this only makes the app *load*. For Subscribe/Send to actually work from this URL,
`VITE_PUSH_API_URL`/`VITE_BACKEND_API_URL` need to point at a `webpush`/`backend` deployment
that's permanently reachable at a stable public URL — e.g. host them on a server with a real
domain, pointed at by `Caddy` + `DOMAIN_NAME` (see the root [README](../README.md)), then set
those as the repo variables above. ngrok's free tier isn't suitable for this since its URLs
change on every restart; use it only for the ad hoc local/mobile testing described above.
