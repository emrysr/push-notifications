/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/vue" />

interface ImportMetaEnv {
  readonly VITE_PUSH_API_URL: string
  readonly VITE_BACKEND_API_URL: string
  readonly VITE_DEFAULT_TOPIC: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
