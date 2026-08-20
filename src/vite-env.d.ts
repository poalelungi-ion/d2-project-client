/// <reference types="vite/client" />

/**
 * The `VITE_`-prefixed variables this app reads. Both are optional: client.ts
 * falls back to the local-development defaults documented in .env.example.
 */
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
