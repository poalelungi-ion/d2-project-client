/// <reference types="vite/client" />

/**
 * The `VITE_`-prefixed variables this app reads. Optional: client.ts falls
 * back to the local-development default documented in .env.example.
 */
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
